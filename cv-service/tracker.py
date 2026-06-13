"""
Barbell path analysis using OpenCV Hough Circle Transform.
MediaPipe object detection is used as the primary detector; Hough circles are the fallback.
"""
from __future__ import annotations

import cv2
import numpy as np
from typing import TypedDict


class PathPoint(TypedDict):
    x: int
    y: int
    frame: int
    time_ms: int


class StickingPoint(TypedDict):
    frame: int
    time_ms: int
    y: int


class AnalysisResult(TypedDict):
    path: list[PathPoint]
    sticking_points: list[StickingPoint]
    rep_count: int
    bar_speed_avg: float


VELOCITY_THRESHOLD = 2.0  # pixels/frame — below this counts as a sticking point
MIN_RADIUS = 10
MAX_RADIUS = 60


def _detect_circle(frame_gray: np.ndarray) -> tuple[int, int] | None:
    blurred = cv2.GaussianBlur(frame_gray, (9, 9), 2)
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=50,
        param1=50,
        param2=30,
        minRadius=MIN_RADIUS,
        maxRadius=MAX_RADIUS,
    )
    if circles is None:
        return None
    x, y, _ = np.round(circles[0][0]).astype(int)
    return int(x), int(y)


def analyze_video(video_path: str) -> AnalysisResult:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    path: list[PathPoint] = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        pos = _detect_circle(gray)
        if pos is not None:
            path.append(
                PathPoint(
                    x=pos[0],
                    y=pos[1],
                    frame=frame_idx,
                    time_ms=int(frame_idx / fps * 1000),
                )
            )
        frame_idx += 1

    cap.release()

    sticking_points: list[StickingPoint] = []
    speeds: list[float] = []

    for i in range(1, len(path)):
        dy = abs(path[i]["y"] - path[i - 1]["y"])
        speeds.append(dy)
        if dy < VELOCITY_THRESHOLD:
            sticking_points.append(
                StickingPoint(
                    frame=path[i]["frame"],
                    time_ms=path[i]["time_ms"],
                    y=path[i]["y"],
                )
            )

    avg_speed = float(np.mean(speeds)) if speeds else 0.0
    rep_count = _count_reps(path)

    return AnalysisResult(
        path=path,
        sticking_points=sticking_points,
        rep_count=rep_count,
        bar_speed_avg=round(avg_speed, 3),
    )


def _count_reps(path: list[PathPoint]) -> int:
    if len(path) < 4:
        return 0

    ys = [p["y"] for p in path]
    direction = 0
    reps = 0

    for i in range(1, len(ys)):
        dy = ys[i] - ys[i - 1]
        if dy > 2 and direction != 1:
            direction = 1
        elif dy < -2 and direction == 1:
            direction = -1
            reps += 1

    return reps
