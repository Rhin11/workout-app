"""
Barbell path analysis for the FitTrack Barbell Path Analyzer.

Tracks the barbell across a lift video and returns the path, sticking points,
rep count, and speed stats. A CSRT tracker follows the plate; it is seeded
either from a user-supplied tap point (seed_x/seed_y, in video pixels) or from
an automatic Hough-circle detection of the round plate on the first frame.

Returns coordinates in VIDEO PIXEL space plus video_width/video_height so the
frontend can scale the overlay onto the displayed first frame.
"""
from __future__ import annotations

import cv2
import numpy as np

# Standard Olympic plate diameter (meters) — used to convert pixels → meters.
OLYMPIC_PLATE_DIAMETER_M = 0.45

# A TRUE sticking point is a *relative* slowdown during the press: the bar's
# upward velocity drops below this fraction of the rep's own average upward speed.
STICK_RELATIVE_FRACTION = 0.45

# ...and only counts in the MIDDLE of the concentric range. Excluding the first
# and last slice drops the off-the-chest start, the lockout finish, and the
# near-zero-velocity holds at the top/bottom turnarounds (not sticking points).
STICK_MIN_POSITION_PCT = 15.0
STICK_MAX_POSITION_PCT = 85.0

# Don't analyze reps that barely moved (avoids reading noise as a stall).
MIN_REP_AVG_SPEED_MPS = 0.05

# Frames moving faster than this (m/s, total) count toward time-under-tension.
MOVEMENT_SPEED_THRESHOLD_MPS = 0.05

# Minimum tracked frames before we trust the result.
MIN_TRACKED_FRAMES = 5

# Path/velocity smoothing window (frames).
SMOOTH_WINDOW = 5


class TrackingError(Exception):
    """Raised when the barbell cannot be located/tracked. Message is user-facing."""


def _create_csrt_tracker():
    """CSRT lives in cv2.* on recent opencv-python, and cv2.legacy.* on older builds."""
    if hasattr(cv2, "TrackerCSRT_create"):
        return cv2.TrackerCSRT_create()
    if hasattr(cv2, "legacy") and hasattr(cv2.legacy, "TrackerCSRT_create"):
        return cv2.legacy.TrackerCSRT_create()
    raise TrackingError(
        "CSRT tracker unavailable — install a recent 'opencv-python' build."
    )


def _detect_circles(frame_bgr: np.ndarray, width: int):
    """Return Hough circles as an (N, 3) array of (x, y, r), strongest first, or None."""
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    circles = cv2.HoughCircles(
        gray,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=max(20, width // 8),
        param1=100,
        param2=30,
        minRadius=max(5, int(0.03 * width)),
        maxRadius=int(0.25 * width),
    )
    if circles is None:
        return None
    # OpenCV returns circles ordered by accumulator strength (most prominent first).
    return np.round(circles[0]).astype(int)


def _clamp_bbox(cx: float, cy: float, side: float, width: int, height: int):
    """Square bbox (x, y, w, h) of `side` px centered at (cx, cy), clamped to frame."""
    side = int(max(16, min(side, min(width, height))))
    x = int(round(cx - side / 2))
    y = int(round(cy - side / 2))
    x = max(0, min(x, width - side))
    y = max(0, min(y, height - side))
    return (x, y, side, side)


def _moving_average(values: np.ndarray, window: int) -> np.ndarray:
    if window <= 1 or len(values) < 2:
        return values
    window = min(window, len(values))
    kernel = np.ones(window) / window
    # 'same' length, edge-padded so the series doesn't shrink or shift.
    padded = np.pad(values, (window // 2, window - 1 - window // 2), mode="edge")
    return np.convolve(padded, kernel, mode="valid")


def _find_pivots(ys: np.ndarray, threshold: float):
    """
    ZigZag turning points on the vertical series.

    Returns an alternating list of (index, kind) where kind is:
      - 'bottom' : a local maximum of y (bar at its lowest), and
      - 'top'    : a local minimum of y (bar at its highest).
    Pixel-y grows downward, so a bar moving up = y decreasing.
    """
    n = len(ys)
    pivots: list[tuple[int, str]] = []
    if n < 2:
        return pivots

    hi_i, hi_v = 0, float(ys[0])  # running highest y since last pivot (bottom candidate)
    lo_i, lo_v = 0, float(ys[0])  # running lowest y since last pivot (top candidate)
    trend = 0  # +1 = descending bar (y rising), -1 = ascending bar (y falling)

    for i in range(1, n):
        v = float(ys[i])
        if v > hi_v:
            hi_v, hi_i = v, i
        if v < lo_v:
            lo_v, lo_i = v, i

        if trend >= 0 and v <= hi_v - threshold:
            # Dropped a full threshold below the running high → confirm a bottom.
            pivots.append((hi_i, "bottom"))
            trend = -1
            lo_i, lo_v = i, v
        elif trend <= 0 and v >= lo_v + threshold:
            pivots.append((lo_i, "top"))
            trend = 1
            hi_i, hi_v = i, v

    # Flush the trailing (unconfirmed) leg so e.g. a squat that ends at the top
    # still produces a final bottom→top pair. trend == -1 means we're mid-ascent
    # (the running low is the final top); trend == 1 means mid-descent.
    if trend == -1:
        pivots.append((lo_i, "top"))
    elif trend == 1:
        pivots.append((hi_i, "bottom"))

    return pivots


def _concentric_phases(ys: np.ndarray, threshold: float):
    """List of (start_idx, end_idx) for each upward (bottom→top) phase."""
    pivots = _find_pivots(ys, threshold)
    phases: list[tuple[int, int]] = []
    for j in range(1, len(pivots)):
        (prev_i, prev_kind) = pivots[j - 1]
        (cur_i, cur_kind) = pivots[j]
        if prev_kind == "bottom" and cur_kind == "top" and cur_i > prev_i:
            phases.append((prev_i, cur_i))

    if not phases:
        # No clean cycle detected — if the bar clearly ascended overall, treat the
        # global bottom→top span as a single concentric phase.
        i_bottom = int(np.argmax(ys))
        i_top = int(np.argmin(ys))
        if i_top > i_bottom and (ys[i_bottom] - ys[i_top]) > threshold:
            phases.append((i_bottom, i_top))
    return phases


def analyze_video(video_path: str, seed_x=None, seed_y=None) -> dict:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise TrackingError("Couldn't open the video file.")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps != fps or fps <= 1:  # 0, NaN, or nonsense → default
        fps = 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    ok, first = cap.read()
    if not ok or first is None:
        cap.release()
        raise TrackingError("Couldn't read any frames from the video.")
    if not width or not height:
        height, width = first.shape[:2]

    # ── Seed the tracker + estimate plate diameter for scale ──────────────────
    plate_diameter_px = None
    circles = _detect_circles(first, width)

    if seed_x is not None and seed_y is not None:
        cx, cy = float(seed_x), float(seed_y)
        # If a detected circle sits near the tap, use its diameter for scale.
        if circles is not None:
            dists = [np.hypot(c[0] - cx, c[1] - cy) for c in circles]
            nearest = circles[int(np.argmin(dists))]
            if np.min(dists) < max(width, height) * 0.2:
                plate_diameter_px = float(2 * nearest[2])
        side = plate_diameter_px if plate_diameter_px else 0.12 * width
        bbox = _clamp_bbox(cx, cy, side, width, height)
    elif circles is not None:
        # Auto-detect: strongest circle is the most prominent plate.
        c = circles[0]
        cx, cy, r = float(c[0]), float(c[1]), float(c[2])
        plate_diameter_px = 2 * r
        bbox = _clamp_bbox(cx, cy, plate_diameter_px, width, height)
    else:
        cap.release()
        raise TrackingError(
            "Couldn't track the barbell — try better lighting/contrast or tap the bar to help"
        )

    # ── Track across all frames ──────────────────────────────────────────────
    tracker = _create_csrt_tracker()
    tracker.init(first, tuple(int(v) for v in bbox))

    xs: list[float] = []
    ys: list[float] = []
    frames: list[int] = []

    x0, y0, w0, h0 = bbox
    xs.append(x0 + w0 / 2)
    ys.append(y0 + h0 / 2)
    frames.append(0)

    frame_idx = 1
    while True:
        ok, frame = cap.read()
        if not ok or frame is None:
            break
        updated, box = tracker.update(frame)
        if not updated:
            break  # lost the bar — stop rather than emit garbage
        bx, by, bw, bh = box
        xs.append(bx + bw / 2)
        ys.append(by + bh / 2)
        frames.append(frame_idx)
        frame_idx += 1

    cap.release()

    if len(frames) < MIN_TRACKED_FRAMES:
        raise TrackingError(
            "Couldn't track the barbell — try better lighting/contrast or tap the bar to help"
        )

    # ── Smooth the path so the overlay isn't jittery ─────────────────────────
    xs_s = _moving_average(np.array(xs, dtype=float), SMOOTH_WINDOW)
    ys_s = _moving_average(np.array(ys, dtype=float), SMOOTH_WINDOW)
    times_ms = [int(round(f / fps * 1000)) for f in frames]

    path = [
        {"x": round(float(xs_s[i]), 1), "y": round(float(ys_s[i]), 1),
         "frame": int(frames[i]), "time_ms": int(times_ms[i])}
        for i in range(len(frames))
    ]

    # ── Scale calibration (pixels → meters) ──────────────────────────────────
    if plate_diameter_px and plate_diameter_px > 1:
        pixels_per_meter = plate_diameter_px / OLYMPIC_PLATE_DIAMETER_M
    else:
        # Fallback: no plate diameter available, so speeds are APPROXIMATE rather
        # than truly calibrated. Assume the frame height spans roughly 2 meters.
        pixels_per_meter = height / 2.0

    dt = 1.0 / fps  # uniform frame spacing

    # Per-frame vertical velocity (m/s); positive = upward (y decreasing).
    v_up = np.zeros(len(ys_s))
    speed_total = np.zeros(len(ys_s))
    for i in range(1, len(ys_s)):
        dy_m = (ys_s[i - 1] - ys_s[i]) / pixels_per_meter
        dx_m = (xs_s[i] - xs_s[i - 1]) / pixels_per_meter
        v_up[i] = dy_m / dt
        speed_total[i] = np.hypot(dx_m, dy_m) / dt

    # ── Concentric phases, reps, sticking points, stats ──────────────────────
    y_range = float(np.max(ys_s) - np.min(ys_s))
    pivot_threshold = max(8.0, 0.15 * y_range)
    phases = _concentric_phases(ys_s, pivot_threshold)
    rep_count = len(phases)

    concentric_speeds: list[float] = []
    sticking_points: list[dict] = []

    # Each phase is a concentric (upward) press: `start` = bottom/off-the-chest,
    # `end` = lockout. The eccentric (lowering) phase is never in `phases`, so it
    # is already excluded — we never flag the controlled descent.
    for (start, end) in phases:
        span = ys_s[start] - ys_s[end]  # total upward travel (px), > 0
        if span <= 0:
            continue

        press_idxs = list(range(start + 1, end + 1))
        for i in press_idxs:
            concentric_speeds.append(abs(float(v_up[i])))

        # This rep's average UPWARD speed (ignore momentary downward dips). A true
        # sticking point is judged RELATIVE to this, not an absolute threshold, so
        # a uniformly fast/slow rep isn't mis-flagged.
        upward = [float(v_up[i]) for i in press_idxs if v_up[i] > 0]
        rep_avg = float(np.mean(upward)) if upward else 0.0
        if rep_avg < MIN_REP_AVG_SPEED_MPS:
            continue  # rep barely moved — nothing meaningful to flag
        rep_threshold = rep_avg * STICK_RELATIVE_FRACTION

        # Flag a meaningful relative slowdown that happens in the MIDDLE of the
        # press while the bar is still meant to be rising — not off the chest,
        # not at lockout, not a turnaround hold.
        clusters: list[list[int]] = []
        current: list[int] = []
        for i in press_idxs:
            pos_pct = (ys_s[start] - ys_s[i]) / span * 100.0
            in_middle = STICK_MIN_POSITION_PCT <= pos_pct <= STICK_MAX_POSITION_PCT
            rising = v_up[i] > -0.02  # actively trying to go up (allow tiny noise)
            stalling = v_up[i] < rep_threshold
            if in_middle and rising and stalling:
                current.append(i)
            elif current:
                clusters.append(current)
                current = []
        if current:
            clusters.append(current)

        for cluster in clusters:
            slowest = min(cluster, key=lambda k: v_up[k])
            pos_pct = (ys_s[start] - ys_s[slowest]) / span * 100.0
            sticking_points.append({
                "frame": int(frames[slowest]),
                "time_ms": int(times_ms[slowest]),
                "position_pct": int(round(min(100.0, max(0.0, pos_pct)))),
            })

    avg_speed = float(np.mean(concentric_speeds)) if concentric_speeds else 0.0
    peak_speed = float(np.max(concentric_speeds)) if concentric_speeds else 0.0

    # Time under tension: total time the bar was actually moving.
    moving_frames = int(np.sum(speed_total > MOVEMENT_SPEED_THRESHOLD_MPS))
    time_under_tension_s = round(moving_frames * dt, 1)

    return {
        "video_width": int(width),
        "video_height": int(height),
        "path": path,
        "sticking_points": sticking_points,
        "rep_count": int(rep_count),
        "avg_speed": round(avg_speed, 2),
        "peak_speed": round(peak_speed, 2),
        "time_under_tension_s": time_under_tension_s,
    }
