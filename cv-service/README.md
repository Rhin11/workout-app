# FitTrack CV Service — Barbell Path Analyzer

A standalone Python (FastAPI + OpenCV) service that analyzes a lift video and
returns the barbell path, sticking points, rep count, and speed stats. It runs
**independently** of the Node backend and the Vite frontend, on its own port
(8000). The frontend posts videos to it at `http://localhost:8000/analyze`.

## Setup

From this `cv-service/` folder:

```bash
# 1. Create a virtual environment
python -m venv venv

# 2. Activate it
#    Windows (PowerShell / cmd):
venv\Scripts\activate
#    macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

- Health check: `GET http://localhost:8000/health` → `{"status": "ok"}`
- Analyze: `POST http://localhost:8000/analyze` (multipart/form-data)

## API

`POST /analyze`

| field    | type        | required | description                                            |
|----------|-------------|----------|--------------------------------------------------------|
| `video`  | file        | yes      | The lift video (mp4/webm/mov).                         |
| `seed_x` | float       | no       | Barbell x in the first frame, in **video pixels**.     |
| `seed_y` | float       | no       | Barbell y in the first frame, in **video pixels**.     |

If a seed point is provided, a CSRT tracker is initialized on it. Otherwise the
service auto-detects the round plate on the first frame with a Hough Circle
Transform and seeds the tracker there.

Response (`200`):

```json
{
  "video_width": 720,
  "video_height": 1280,
  "path": [{ "x": 360.0, "y": 900.0, "frame": 0, "time_ms": 0 }],
  "sticking_points": [{ "frame": 42, "time_ms": 1400, "position_pct": 55 }],
  "rep_count": 1,
  "avg_speed": 0.42,
  "peak_speed": 0.88,
  "time_under_tension_s": 3.2
}
```

Coordinates are in **video pixel space**; `video_width`/`video_height` let the
frontend scale the overlay onto the displayed first frame.

If the barbell can't be tracked, the service responds `422` with a readable
`detail` message (e.g. *"Couldn't track the barbell — try better
lighting/contrast or tap the bar to help"*).

## Notes

- **Scale:** real-world speed (m/s) is derived from the detected plate diameter,
  assuming a standard Olympic plate of 0.45 m. If the diameter can't be
  determined, speeds are approximate (the frame height is assumed to span ~2 m).
- **Rotation metadata:** phone videos that carry rotation metadata may be decoded
  by OpenCV in a different orientation than the browser shows, which can offset
  seed coordinates. Not handled here.
