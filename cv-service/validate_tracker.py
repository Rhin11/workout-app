"""
Regression check for barbell tracker performance optimizations.

Generates synthetic lift videos (moving plate circle) and verifies that
analyze_video still finds the rep and path. Run from cv-service/:

    python validate_tracker.py
"""
from __future__ import annotations

import os
import sys
import tempfile
import time

import cv2
import numpy as np

from tracker import analyze_video


def make_lift_video(
    path: str,
    width: int,
    height: int,
    fps: float,
    lift_seconds: float,
    tail_seconds: float,
    plate_radius: int = 40,
) -> tuple[float, float]:
    """
    Render a synthetic bench-press clip: plate rises for lift_seconds, then holds.
    Returns (seed_x, seed_y) at the start position (full-res video pixels).
    """
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(path, fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f"Could not open VideoWriter for {path}")

    cx = width // 2
    y_start = int(height * 0.75)
    y_end = int(height * 0.35)
    lift_frames = max(2, int(round(lift_seconds * fps)))
    tail_frames = int(round(tail_seconds * fps))
    total = lift_frames + tail_frames

    for i in range(total):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:] = (30, 30, 30)
        if i < lift_frames:
            t = i / max(1, lift_frames - 1)
            cy = int(y_start + (y_end - y_start) * t)
        else:
            cy = y_end
        cv2.circle(frame, (cx, cy), plate_radius, (220, 220, 220), -1)
        cv2.circle(frame, (cx, cy), plate_radius, (180, 180, 180), 2)
        writer.write(frame)

    writer.release()
    return float(cx), float(y_start)


def run_case(name: str, width: int, height: int, fps: float, lift_s: float, tail_s: float):
    print(f"\n=== {name} ({width}x{height} @ {fps} fps, lift={lift_s}s + tail={tail_s}s) ===")
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        seed_x, seed_y = make_lift_video(tmp_path, width, height, fps, lift_s, tail_s)
        t0 = time.perf_counter()
        result = analyze_video(tmp_path, seed_x=seed_x, seed_y=seed_y)
        elapsed = time.perf_counter() - t0

        path = result["path"]
        y_vals = [p["y"] for p in path]
        y_travel = max(y_vals) - min(y_vals)

        print(f"  elapsed: {elapsed:.2f}s")
        print(f"  rep_count: {result['rep_count']} (expected 1)")
        print(f"  path points: {len(path)}")
        print(f"  vertical travel: {y_travel:.0f}px (expected > {height * 0.2:.0f}px)")
        print(f"  sticking_points: {len(result['sticking_points'])}")

        assert result["rep_count"] >= 1, "expected at least one rep"
        assert y_travel > height * 0.2, "bar should have moved significantly upward"
        assert len(path) >= 5, "expected a reasonable path length"
        print("  PASS")
        return elapsed, len(path)
    finally:
        os.unlink(tmp_path)


def main():
    cases = [
        ("720p baseline", 720, 1280, 30.0, 2.5, 1.0),
        ("1080p phone", 1080, 1920, 30.0, 2.5, 5.0),
        ("4K 60fps stress", 3840, 2160, 60.0, 2.0, 10.0),
        ("long tail early exit", 1080, 1920, 30.0, 2.0, 20.0),
    ]

    results = []
    for args in cases:
        results.append(run_case(*args))

    print("\n=== Summary ===")
    for (args, (elapsed, points)) in zip(cases, results):
        print(f"  {args[0]}: {elapsed:.2f}s, {points} path points")

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
