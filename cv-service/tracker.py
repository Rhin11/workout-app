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

import os

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

# Path smoothing for the overlay (median removes spikes; moving avg for stats).
PATH_MEDIAN_WINDOW = 5
SMOOTH_WINDOW = 3

# Template match must exceed this score (0–1) to accept a new position.
TEMPLATE_MATCH_THRESHOLD = 0.45

# Reject tracker jumps larger than this fraction of ROM per frame.
MAX_ROM_STEP_FRAC = 0.18

# ── Track-loss recovery (seed/CSRT path) ─────────────────────────────────────
# A tracker step beyond this multiple of the per-frame clamp is treated as a lost
# lock (a wild jump) rather than real motion.
JUMP_TOL = 3.0
# Accept the CSRT box only while it stays within this fraction range of the seed
# size — a box that balloons or collapses means it latched onto something else.
TRACK_SIZE_MIN_FRAC = 0.4
TRACK_SIZE_MAX_FRAC = 2.5
# Movement (px) below which the lock counts as "not moving" for stuck detection.
STILL_EPS = 0.6
# Consecutive still frames before we verify the lock against a fresh detection
# (catches a tracker frozen on the background while the bar actually moved).
STUCK_FRAMES = 5
# EMA weight for velocity estimated from real motion (used to predict occlusions).
VEL_SMOOTH = 0.6
# Velocity decay applied each frame while coasting through an occlusion.
VEL_DECAY = 0.85
# Short lost stretches (≤ this many frames) bracketed by real detections are
# interpolated into a continuous line. Scales with fps; this is the floor.
MIN_GAP_FRAMES = 3
# Require at least this fraction of frames to be really tracked/reacquired,
# otherwise we report that the lift couldn't be tracked (vs. a bogus short path).
MIN_REAL_COVERAGE = 0.4

# Per-frame status of the seed/CSRT path (also used for the debug overlay).
_REAL_STATUSES = ("tracked", "reacquired")
_DEBUG_COLORS = {
    "tracked": (0, 255, 0),       # green
    "reacquired": (0, 255, 255),  # yellow
    "predicted": (0, 165, 255),   # orange
    "interpolated": (255, 0, 255),  # magenta
    "rom": (0, 255, 0),
}


def _debug_enabled() -> bool:
    return os.environ.get("DEBUG_TRACKING", "").strip().lower() in ("1", "true", "yes", "on")


def _open_debug_writer(video_path: str, fps: float, width: int, height: int):
    """VideoWriter that records the tracked box each frame when DEBUG_TRACKING is set."""
    if not _debug_enabled():
        return None, None
    out_dir = os.environ.get("DEBUG_TRACKING_DIR") or os.path.dirname(video_path) or "."
    try:
        os.makedirs(out_dir, exist_ok=True)
    except OSError:
        out_dir = "."
    out_path = os.path.join(out_dir, "tracking_debug.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(out_path, fourcc, fps if fps and fps > 1 else 30.0, (width, height))
    if not writer.isOpened():
        print(f"[tracker] DEBUG_TRACKING: could not open debug writer at {out_path}")
        return None, None
    print(f"[tracker] DEBUG_TRACKING enabled -> {out_path}")
    return writer, out_path


def _draw_debug(writer, frame: np.ndarray, cx: float, cy: float, side: float, status: str):
    """Draw the tracked box + status label on a copy of the frame and write it."""
    if writer is None:
        return
    canvas = frame.copy()
    color = _DEBUG_COLORS.get(status, (255, 255, 255))
    half = int(max(8, side / 2))
    x, y = int(round(cx)), int(round(cy))
    cv2.rectangle(canvas, (x - half, y - half), (x + half, y + half), color, 2)
    cv2.circle(canvas, (x, y), 3, color, -1)
    cv2.putText(canvas, status, (x - half, max(12, y - half - 6)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)
    writer.write(canvas)


def _reacquire(
    frame_bgr: np.ndarray,
    ex: float,
    ey: float,
    side: float,
    width: int,
    *,
    search_radius: float,
    template: np.ndarray | None,
    min_disp: float = 0.0,
) -> tuple[float, float] | None:
    """
    Re-detect the plate near an expected position (ex, ey) after a track loss.

    The bar moves smoothly, so it's near where it was. Prefer a Hough circle
    within `search_radius`; fall back to template matching. `min_disp` requires
    the hit to be at least that far from (ex, ey) — used by the stuck-check so we
    only re-seed when a plate is clearly displaced from a frozen tracker.
    """
    circles = _detect_circles(frame_bgr, width)
    found = _nearest_circle(circles, ex, ey, search_radius)
    if found is not None and (min_disp <= 0 or np.hypot(found[0] - ex, found[1] - ey) >= min_disp):
        return found
    # Template fallback (skip when we specifically want a displaced detection).
    if template is not None and min_disp <= 0:
        win = int(max(search_radius, side * 2))
        hit = _match_patch(frame_bgr, template, ex, ey, win, win)
        if hit is not None:
            return hit[0], hit[1]
    return None


def _interpolate_gaps(
    xs: list[float], ys: list[float], status: list[str], max_gap: int
) -> None:
    """
    Replace short runs of predicted points that are bracketed by real detections
    on BOTH sides with a straight interpolation, so the path stays continuous
    across brief losses instead of drifting. Mutates xs/ys/status in place.
    """
    n = len(status)
    i = 0
    while i < n:
        if status[i] in _REAL_STATUSES:
            i += 1
            continue
        j = i
        while j < n and status[j] not in _REAL_STATUSES:
            j += 1
        # Gap is [i, j-1]; bracketed by real frames i-1 and j.
        if i - 1 >= 0 and j < n and (j - i) <= max_gap:
            lx, ly, span = xs[i - 1], ys[i - 1], j - (i - 1)
            rx, ry = xs[j], ys[j]
            for k in range(i, j):
                t = (k - (i - 1)) / span
                xs[k] = lx + (rx - lx) * t
                ys[k] = ly + (ry - ly) * t
                status[k] = "interpolated"
        i = j


class TrackingError(Exception):
    """Raised when the barbell cannot be located/tracked. Message is user-facing."""


def _create_csrt_tracker():
    """Create a CSRT tracker, tolerating the API moving across OpenCV versions.

    The factory has lived in three places depending on the build:
      - cv2.TrackerCSRT_create()         (contrib snake_case factory)
      - cv2.legacy.TrackerCSRT_create()  (older contrib builds)
      - cv2.TrackerCSRT.create()         (newer class-based API)
    CSRT ships only in opencv-contrib-python, so a working build is expected.
    """
    if hasattr(cv2, "TrackerCSRT_create"):
        return cv2.TrackerCSRT_create()
    if hasattr(cv2, "legacy") and hasattr(cv2.legacy, "TrackerCSRT_create"):
        return cv2.legacy.TrackerCSRT_create()
    if hasattr(cv2, "TrackerCSRT") and hasattr(cv2.TrackerCSRT, "create"):
        return cv2.TrackerCSRT.create()
    raise TrackingError(
        "CSRT tracker unavailable — reinstall dependencies with "
        "'pip install -r requirements.txt' (requires opencv-contrib-python)."
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


def _tracker_side(plate_diameter_px: float | None, width: int) -> float:
    """Tight square ROI — plate-sized so CSRT stays on the bar, not the lifter."""
    if plate_diameter_px and plate_diameter_px > 1:
        return max(22.0, min(plate_diameter_px * 1.08, width * 0.07))
    return max(22.0, min(width * 0.055, 60.0))


def _nearest_circle(
    circles: np.ndarray | None, cx: float, cy: float, max_dist: float
) -> tuple[float, float] | None:
    if circles is None or len(circles) == 0:
        return None
    dists = [np.hypot(float(c[0]) - cx, float(c[1]) - cy) for c in circles]
    i = int(np.argmin(dists))
    if dists[i] <= max_dist:
        return float(circles[i][0]), float(circles[i][1])
    return None


def _rom_x(y: float, top_x: float, top_y: float, bottom_x: float, bottom_y: float) -> float:
    """X along the user-marked top→bottom bar line for a given Y."""
    span = bottom_y - top_y
    if span <= 0:
        return top_x
    t = float(np.clip((y - top_y) / span, 0.0, 1.0))
    return top_x + (bottom_x - top_x) * t


def _moving_median(values: np.ndarray, window: int) -> np.ndarray:
    if window <= 1 or len(values) < 2:
        return values
    window = min(window, len(values))
    if window % 2 == 0:
        window -= 1
    half = window // 2
    out = values.copy()
    for i in range(len(values)):
        lo = max(0, i - half)
        hi = min(len(values), i + half + 1)
        out[i] = float(np.median(values[lo:hi]))
    return out


def _extract_patch(frame_bgr: np.ndarray, cx: float, cy: float, side: float):
    """Gray template patch centered on (cx, cy). Returns (patch, top-left x, top-left y)."""
    side_i = int(max(16, side))
    half = side_i // 2
    x1 = max(0, int(round(cx)) - half)
    y1 = max(0, int(round(cy)) - half)
    x2 = min(frame_bgr.shape[1], x1 + side_i)
    y2 = min(frame_bgr.shape[0], y1 + side_i)
    if x2 - x1 < 12 or y2 - y1 < 12:
        return None
    patch = cv2.cvtColor(frame_bgr[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
    return patch, x1, y1


def _match_patch(
    frame_bgr: np.ndarray,
    template: np.ndarray,
    cx: float,
    cy: float,
    search_w: int,
    search_h: int,
) -> tuple[float, float, float] | None:
    """
    Search for `template` in a window around (cx, cy).
    Returns (center_x, center_y, score) or None if no confident match.
    """
    h, w = frame_bgr.shape[:2]
    th, tw = template.shape[:2]
    x1 = max(0, int(round(cx - search_w / 2)))
    y1 = max(0, int(round(cy - search_h / 2)))
    x2 = min(w, x1 + search_w + tw)
    y2 = min(h, y1 + search_h + th)
    x1 = max(0, x2 - search_w - tw)
    y1 = max(0, y2 - search_h - th)
    roi = cv2.cvtColor(frame_bgr[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
    if roi.shape[0] < th or roi.shape[1] < tw:
        return None
    result = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
    _, score, _, max_loc = cv2.minMaxLoc(result)
    if score < TEMPLATE_MATCH_THRESHOLD:
        return None
    mx = x1 + max_loc[0] + tw / 2
    my = y1 + max_loc[1] + th / 2
    return float(mx), float(my), float(score)


def _start_tracker(
    frame_bgr: np.ndarray, cx: float, cy: float, side: float, width: int, height: int
):
    bbox = _clamp_bbox(cx, cy, side, width, height)
    tracker = _create_csrt_tracker()
    tracker.init(frame_bgr, tuple(int(v) for v in bbox))
    x0, y0, w0, h0 = bbox
    return tracker, x0 + w0 / 2, y0 + h0 / 2


def _plate_diameter_near(
    frame_bgr: np.ndarray, width: int, cx: float, cy: float
) -> float | None:
    circles = _detect_circles(frame_bgr, width)
    if circles is None:
        return None
    dists = [np.hypot(float(c[0]) - cx, float(c[1]) - cy) for c in circles]
    nearest = circles[int(np.argmin(dists))]
    if np.min(dists) < max(width, frame_bgr.shape[0]) * 0.2:
        return float(2 * nearest[2])
    return None


def _snap_seed(
    frame_bgr: np.ndarray, sx: float, sy: float, width: int
) -> tuple[float, float, float | None] | None:
    """
    Snap a tapped seed point to the nearest detected plate on the start frame.

    The user may tap the bar at a different moment than the segment start, so we
    re-detect the plate near the tap and seed CSRT on the real plate. Returns
    (cx, cy, plate_diameter_px) or None if no circle is near the tap.
    """
    circles = _detect_circles(frame_bgr, width)
    if circles is None or len(circles) == 0:
        return None
    dists = [np.hypot(float(c[0]) - sx, float(c[1]) - sy) for c in circles]
    i = int(np.argmin(dists))
    if dists[i] <= max(width, frame_bgr.shape[0]) * 0.25:
        c = circles[i]
        return float(c[0]), float(c[1]), float(2 * c[2])
    return None


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


def _position_pct(y: float, rom_top_y: float, rom_bottom_y: float) -> float:
    """0 = bottom of user-marked ROM, 100 = lockout (pixel y grows downward)."""
    span = rom_bottom_y - rom_top_y
    if span <= 0:
        return 0.0
    return (rom_bottom_y - y) / span * 100.0


def _anchor_position(
    frame_i: int, ax: float, ay: float, a_f: int, bx: float, by: float, b_f: int
) -> tuple[float, float]:
    """Exact user coords at A/B frames; linear interp between them by frame index."""
    if frame_i == a_f:
        return ax, ay
    if frame_i == b_f:
        return bx, by
    lo_f, hi_f = min(a_f, b_f), max(a_f, b_f)
    if hi_f == lo_f:
        return ax, ay
    if frame_i <= lo_f:
        return (ax, ay) if a_f == lo_f else (bx, by)
    if frame_i >= hi_f:
        return (ax, ay) if a_f == hi_f else (bx, by)
    if a_f < b_f:
        t = (frame_i - a_f) / (b_f - a_f)
        return ax + (bx - ax) * t, ay + (by - ay) * t
    t = (frame_i - b_f) / (a_f - b_f)
    return bx + (ax - bx) * t, by + (ay - by) * t


def _track_lift(
    cap: cv2.VideoCapture,
    init_frame: np.ndarray,
    start_frame_i: int,
    width: int,
    height: int,
    fps: float,
    *,
    first_xy: tuple[float, float] | None,
    use_rom: bool,
    top_x: float = 0,
    top_y: float = 0,
    bottom_x: float = 0,
    bottom_y: float = 0,
    anchor_a: tuple[float, float, int] | None = None,
    anchor_b: tuple[float, float, int] | None = None,
    end_frame: int | None = None,
    debug_writer=None,
) -> tuple[list[float], list[float], list[int], float | None]:
    """
    Track the bar across the video.

    With ROM anchors: path is pinned at A/B and guided between them by frame.
    Without ROM: CSRT with outlier rejection from the seed frame.
    """
    plate_diameter_px = None
    circles = _detect_circles(init_frame, width)

    if first_xy is not None:
        cx, cy = first_xy
        # Snap to the real plate near the tap on this (segment-start) frame so the
        # tracker seeds on the bar even if the user tapped at a different moment.
        snapped = _snap_seed(init_frame, cx, cy, width)
        if snapped is not None:
            cx, cy, plate_diameter_px = snapped
        else:
            plate_diameter_px = _plate_diameter_near(init_frame, width, cx, cy)
    elif circles is not None:
        c = circles[0]
        cx, cy, r = float(c[0]), float(c[1]), float(c[2])
        plate_diameter_px = 2 * r
    else:
        raise TrackingError(
            "Couldn't track the barbell — try better lighting/contrast or tap the bar to help"
        )

    side = _tracker_side(plate_diameter_px, width)
    rom_span = (bottom_y - top_y) if use_rom else height * 0.5
    max_step_y = max(6.0, rom_span * MAX_ROM_STEP_FRAC)
    max_step_x = max(4.0, side * 0.35)

    xs: list[float] = []
    ys: list[float] = []
    frames: list[int] = []

    if use_rom and anchor_a is not None and anchor_b is not None:
        ax, ay, a_f = anchor_a
        bx, by, b_f = anchor_b
        start_f = min(a_f, b_f)
        search_w = int(max(side * 0.55, 22))
        search_h = int(max(side * 1.6, max_step_y * 2.0))
        template = None

        frame = init_frame
        frame_idx = start_frame_i
        while frame is not None:
            if end_frame is not None and frame_idx > end_frame:
                break
            if frame_idx >= start_f:
                exp_x, exp_y = _anchor_position(frame_idx, ax, ay, a_f, bx, by, b_f)

                if template is None:
                    extracted = _extract_patch(frame, exp_x, exp_y, side)
                    if extracted is None:
                        raise TrackingError(
                            "Couldn't read the barbell region — try tapping closer to the plate."
                        )
                    template = extracted[0]

                if frame_idx == a_f:
                    px, py = ax, ay
                elif frame_idx == b_f:
                    px, py = bx, by
                else:
                    hit = _match_patch(frame, template, exp_x, exp_y, search_w, search_h)
                    if hit is not None:
                        raw_x, raw_y, score = hit
                        blend = min(0.28, score * 0.28)
                        px = exp_x * (1.0 - blend) + raw_x * blend
                        py = exp_y * (1.0 - blend) + raw_y * blend
                    else:
                        px, py = exp_x, exp_y

                xs.append(px)
                ys.append(py)
                frames.append(frame_idx)
                _draw_debug(debug_writer, frame, px, py, side, "rom")

            ok, frame = cap.read()
            if not ok or frame is None:
                break
            frame_idx += 1
    else:
        tracker, cx, cy = _start_tracker(init_frame, cx, cy, side, width, height)
        xs.append(cx)
        ys.append(cy)
        frames.append(start_frame_i)
        status_list: list[str] = ["tracked"]
        _draw_debug(debug_writer, init_frame, cx, cy, side, "tracked")

        prev_x, prev_y = cx, cy
        vx = vy = 0.0
        lost_count = 0   # consecutive predicted (no real detection) frames
        still_count = 0  # consecutive ~motionless locks (stuck detection)
        extracted = _extract_patch(init_frame, cx, cy, side)
        template = extracted[0] if extracted is not None else None

        # Re-detection search radius grows with how long we've been lost, since
        # the bar could be further from its last real position.
        base_radius = max(side * 2.5, max_step_y * 4.0)
        max_radius = max(width, height) * 0.5

        frame_idx = start_frame_i + 1
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                break
            if end_frame is not None and frame_idx > end_frame:
                break

            # 1. DETECT TRACK LOSS — update must succeed AND the box must be a
            #    sane size and not have jumped wildly from the last position.
            updated, box = tracker.update(frame)
            accept = False
            if updated:
                bx, by, bw, bh = box
                ncx, ncy = bx + bw / 2, by + bh / 2
                size_ok = (
                    TRACK_SIZE_MIN_FRAC * side <= bw <= TRACK_SIZE_MAX_FRAC * side
                    and TRACK_SIZE_MIN_FRAC * side <= bh <= TRACK_SIZE_MAX_FRAC * side
                )
                dx, dy = ncx - prev_x, ncy - prev_y
                jump_ok = abs(dx) <= max_step_x * JUMP_TOL and abs(dy) <= max_step_y * JUMP_TOL
                if size_ok and jump_ok:
                    # Accept, clamping minor overshoot to a smooth per-frame step.
                    cx = prev_x + float(np.clip(dx, -max_step_x, max_step_x))
                    cy = prev_y + float(np.clip(dy, -max_step_y, max_step_y))
                    accept = True

            if accept:
                status = "tracked"
                lost_count = 0
                moved = abs(cx - prev_x) + abs(cy - prev_y)
                still_count = still_count + 1 if moved < STILL_EPS else 0

                # Frozen-while-bar-moved check: if the lock has sat still for a
                # while, verify against a fresh detection; re-seed only if a plate
                # is clearly displaced from where the tracker is stuck.
                if still_count >= STUCK_FRAMES:
                    reac = _reacquire(
                        frame, cx, cy, side, width,
                        search_radius=max(base_radius, max_step_y * 6.0),
                        template=template, min_disp=max_step_y * 1.5,
                    )
                    if reac is not None:
                        cx, cy = reac
                        tracker, cx, cy = _start_tracker(frame, cx, cy, side, width, height)
                        status = "reacquired"
                    still_count = 0
            else:
                # 2. RE-ACQUIRE ON LOSS — look for the plate near the position
                #    predicted from recent velocity, then re-seed CSRT there.
                ex, ey = prev_x + vx, prev_y + vy
                radius = min(base_radius * (1.0 + 0.5 * lost_count), max_radius)
                reac = _reacquire(
                    frame, ex, ey, side, width,
                    search_radius=radius, template=template,
                )
                if reac is not None:
                    cx, cy = reac
                    tracker, cx, cy = _start_tracker(frame, cx, cy, side, width, height)
                    status = "reacquired"
                    lost_count = 0
                    still_count = 0
                else:
                    # 4. PREDICT THROUGH BRIEF OCCLUSION — coast along the recent
                    #    velocity; we snap back to detection once the bar reappears.
                    cx = float(np.clip(ex, 0, width - 1))
                    cy = float(np.clip(ey, 0, height - 1))
                    vx *= VEL_DECAY
                    vy *= VEL_DECAY
                    status = "predicted"
                    lost_count += 1

            # Update velocity + template only from real detections.
            if status in _REAL_STATUSES:
                vx = VEL_SMOOTH * vx + (1.0 - VEL_SMOOTH) * (cx - prev_x)
                vy = VEL_SMOOTH * vy + (1.0 - VEL_SMOOTH) * (cy - prev_y)
                refreshed = _extract_patch(frame, cx, cy, side)
                if refreshed is not None:
                    template = refreshed[0]

            prev_x, prev_y = cx, cy
            xs.append(cx)
            ys.append(cy)
            frames.append(frame_idx)
            status_list.append(status)
            _draw_debug(debug_writer, frame, cx, cy, side, status)
            frame_idx += 1

        # 3. INTERPOLATE SMALL GAPS so brief losses read as a continuous line.
        max_gap = max(MIN_GAP_FRAMES, int(round(fps * 0.4)))
        _interpolate_gaps(xs, ys, status_list, max_gap)

        # 5. If the bar was lost for a large portion, say so rather than returning
        #    a misleading short/partial path.
        real = sum(1 for s in status_list if s in _REAL_STATUSES)
        if status_list and real / len(status_list) < MIN_REAL_COVERAGE:
            raise TrackingError(
                "Only part of the lift could be tracked — the bar was lost for too "
                "long. Try better lighting/contrast, keep the full plate in frame, "
                "or tap the bar to help."
            )

    return xs, ys, frames, plate_diameter_px


def _normalize_rom_endpoints(
    ax: float, ay: float, a_frame: int, bx: float, by: float, b_frame: int
) -> tuple[tuple[float, float, int], tuple[float, float, int]]:
    """
    Map arbitrary A/B taps to (high_in_frame, low_in_frame) endpoints.

    Pixel y grows downward, so the physically higher bar position has the
    smaller y value — regardless of which point the user marked first.
    """
    a = (ax, ay, a_frame)
    b = (bx, by, b_frame)
    if ay <= by:
        return a, b
    return b, a


def analyze_video(
    video_path: str,
    seed_x=None,
    seed_y=None,
    seed_frame=None,
    start_ms=None,
    end_ms=None,
    point_a_x=None,
    point_a_y=None,
    point_a_time=None,
    point_a_frame=None,
    point_b_x=None,
    point_b_y=None,
    point_b_time=None,
    point_b_frame=None,
    rom_top_y=None,
    rom_bottom_x=None,
    rom_bottom_y=None,
    rom_bottom_frame=None,
) -> dict:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise TrackingError("Couldn't open the video file.")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps != fps or fps <= 1:  # 0, NaN, or nonsense → default
        fps = 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Optional analysis window (ms → frame). Trims the walkout/re-rack so only the
    # working reps are tracked. Defaults to the whole clip.
    def _to_frame(ms) -> int:
        return max(0, int(round(float(ms) / 1000.0 * fps)))

    seg_start_frame = _to_frame(start_ms) if start_ms is not None else None
    seg_end_frame = _to_frame(end_ms) if end_ms is not None else None
    if seg_start_frame is not None and seg_end_frame is not None and seg_end_frame <= seg_start_frame:
        seg_end_frame = None  # ignore a nonsensical window; analyze to the end

    # Resolve ROM from point A/B (new) or legacy top/bottom fields.
    has_ab = (
        point_a_x is not None
        and point_a_y is not None
        and point_b_x is not None
        and point_b_y is not None
        and (point_a_time is not None or point_a_frame is not None)
        and (point_b_time is not None or point_b_frame is not None)
    )
    if has_ab:
        ax, ay = float(point_a_x), float(point_a_y)
        bx, by = float(point_b_x), float(point_b_y)
        if point_a_time is not None:
            a_frame = int(round(float(point_a_time) * fps))
        else:
            a_frame = int(point_a_frame or 0)
        if point_b_time is not None:
            b_frame = int(round(float(point_b_time) * fps))
        else:
            b_frame = int(point_b_frame or 0)
        a_frame = max(0, a_frame)
        b_frame = max(0, b_frame)
        (top_x, top_y, _), (bottom_x, bottom_y, _) = _normalize_rom_endpoints(
            ax, ay, a_frame, bx, by, b_frame
        )
        use_rom = abs(bottom_y - top_y) > 4.0
        anchor_a = (ax, ay, a_frame)
        anchor_b = (bx, by, b_frame)
        first_xy = (ax, ay) if a_frame <= b_frame else (bx, by)
    else:
        anchor_a = anchor_b = None
        use_rom = (
            seed_x is not None
            and seed_y is not None
            and rom_top_y is not None
            and rom_bottom_y is not None
            and float(rom_bottom_y) > float(rom_top_y)
        )
        top_frame_i = max(0, int(seed_frame or 0))
        bottom_frame_i = (
            max(0, int(rom_bottom_frame or 0)) if rom_bottom_frame is not None else top_frame_i
        )
        if use_rom:
            rom_top_y = float(rom_top_y)
            rom_bottom_y = float(rom_bottom_y)
            top_x, top_y = float(seed_x), float(seed_y)
            bottom_x = float(rom_bottom_x) if rom_bottom_x is not None else top_x
            bottom_y = rom_bottom_y
            first_frame_i = min(top_frame_i, bottom_frame_i)
            first_xy = (top_x, top_y) if first_frame_i == top_frame_i else (bottom_x, bottom_y)
        else:
            # Single-seed path: track the WHOLE segment (all reps). Begin at the
            # trimmed start; the tapped seed is snapped to the plate on that frame.
            first_frame_i = seg_start_frame if seg_start_frame is not None else top_frame_i
            top_x = top_y = bottom_x = bottom_y = 0.0
            first_xy = (
                (float(seed_x), float(seed_y)) if seed_x is not None and seed_y is not None else None
            )

    if use_rom:
        rom_top_y = float(top_y)
        rom_bottom_y = float(bottom_y)

    ok, init_frame = cap.read()
    if not ok or init_frame is None:
        cap.release()
        raise TrackingError("Couldn't read any frames from the video.")
    if not width or not height:
        height, width = init_frame.shape[:2]

    start_frame_i = 0
    if not has_ab:
        while start_frame_i < first_frame_i:
            ok, frame = cap.read()
            if not ok or frame is None:
                cap.release()
                raise TrackingError(
                    "Couldn't reach the marked frame — try marking from earlier in the video."
                )
            init_frame = frame
            start_frame_i += 1

    debug_writer, debug_path = _open_debug_writer(video_path, fps, width, height)
    try:
        xs, ys, frames, plate_diameter_px = _track_lift(
            cap,
            init_frame,
            start_frame_i,
            width,
            height,
            fps,
            first_xy=first_xy,
            use_rom=use_rom,
            top_x=top_x,
            top_y=top_y,
            bottom_x=bottom_x,
            bottom_y=bottom_y,
            anchor_a=anchor_a,
            anchor_b=anchor_b,
            end_frame=seg_end_frame,
            debug_writer=debug_writer,
        )
    except TrackingError:
        cap.release()
        if debug_writer is not None:
            debug_writer.release()
            print(f"[tracker] DEBUG_TRACKING: partial debug video saved to {debug_path}")
        raise
    finally:
        if debug_writer is not None and debug_writer.isOpened():
            debug_writer.release()
            print(f"[tracker] DEBUG_TRACKING: debug video saved to {debug_path}")

    cap.release()

    if len(frames) < MIN_TRACKED_FRAMES:
        raise TrackingError(
            "Couldn't track the barbell — try better lighting/contrast or tap the bar to help"
        )

    xs_arr = _moving_median(np.array(xs, dtype=float), PATH_MEDIAN_WINDOW)
    ys_arr = _moving_median(np.array(ys, dtype=float), PATH_MEDIAN_WINDOW)

    if has_ab:
        for i, f in enumerate(frames):
            if f == a_frame:
                xs_arr[i] = ax
                ys_arr[i] = ay
            elif f == b_frame:
                xs_arr[i] = bx
                ys_arr[i] = by

    xs_s = _moving_average(xs_arr, SMOOTH_WINDOW)
    ys_s = _moving_average(ys_arr, SMOOTH_WINDOW)
    times_ms = [int(round(f / fps * 1000)) for f in frames]

    path = [
        {"x": round(float(xs_arr[i]), 1), "y": round(float(ys_arr[i]), 1),
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
    if use_rom:
        rom_span = float(rom_bottom_y - rom_top_y)
        pivot_threshold = max(8.0, 0.12 * rom_span)
    else:
        y_range = float(np.max(ys_s) - np.min(ys_s))
        pivot_threshold = max(8.0, 0.15 * y_range)
    phases = _concentric_phases(ys_s, pivot_threshold)
    rep_count = len(phases)

    concentric_speeds: list[float] = []
    sticking_points: list[dict] = []

    # Each phase is a concentric (upward) press: `start` = bottom/off-the-chest,
    # `end` = lockout. The eccentric (lowering) phase is never in `phases`, so it
    # is already excluded — we never flag the controlled descent.
    for rep_idx, (start, end) in enumerate(phases, start=1):
        if use_rom:
            span = rom_bottom_y - rom_top_y
        else:
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
            if use_rom:
                pos_pct = _position_pct(float(ys_s[i]), rom_top_y, rom_bottom_y)
            else:
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
            if use_rom:
                pos_pct = _position_pct(float(ys_s[slowest]), rom_top_y, rom_bottom_y)
            else:
                pos_pct = (ys_s[start] - ys_s[slowest]) / span * 100.0
            sticking_points.append({
                "frame": int(frames[slowest]),
                "time_ms": int(times_ms[slowest]),
                "position_pct": int(round(min(100.0, max(0.0, pos_pct)))),
                "rep": int(rep_idx),  # which rep (1-based) this sticking point is in
            })

    avg_speed = float(np.mean(concentric_speeds)) if concentric_speeds else 0.0
    peak_speed = float(np.max(concentric_speeds)) if concentric_speeds else 0.0

    # Time under tension: total time the bar was actually moving.
    moving_frames = int(np.sum(speed_total > MOVEMENT_SPEED_THRESHOLD_MPS))
    time_under_tension_s = round(moving_frames * dt, 1)

    return {
        "video_width": int(width),
        "video_height": int(height),
        "fps": round(float(fps), 3),
        "path": path,
        "sticking_points": sticking_points,
        "rep_count": int(rep_count),
        "avg_speed": round(avg_speed, 2),
        "peak_speed": round(peak_speed, 2),
        "time_under_tension_s": time_under_tension_s,
    }
