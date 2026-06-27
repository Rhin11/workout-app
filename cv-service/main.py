"""
FastAPI entrypoint for the Barbell Path Analyzer CV service.

Runs standalone on port 8000, independent of the Node backend and the Vite
frontend. The frontend (http://localhost:5173) POSTs a lift video to /analyze
and receives the traced bar path + stats.

    uvicorn main:app --reload --port 8000
"""
import os
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from tracker import TrackingError, analyze_video

app = FastAPI(title="FitTrack CV Service")

# Allow the Vite dev server. 5173 is the default, but Vite picks another port if
# it's taken, so allow any localhost/127.0.0.1 port for local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    video: UploadFile = File(...),
    seed_x: float | None = Form(None),
    seed_y: float | None = Form(None),
    seed_frame: int | None = Form(None),
    # Optional segment to analyze (ms into the video). Defaults to the full clip.
    start_ms: float | None = Form(None),
    end_ms: float | None = Form(None),
    point_a_x: float | None = Form(None),
    point_a_y: float | None = Form(None),
    point_a_time: float | None = Form(None),
    point_a_frame: int | None = Form(None),
    point_b_x: float | None = Form(None),
    point_b_y: float | None = Form(None),
    point_b_time: float | None = Form(None),
    point_b_frame: int | None = Form(None),
    # Legacy field names (older clients)
    rom_top_y: float | None = Form(None),
    rom_bottom_x: float | None = Form(None),
    rom_bottom_y: float | None = Form(None),
    rom_bottom_frame: int | None = Form(None),
):
    # OpenCV needs a real file path, so persist the upload to a temp file.
    suffix = os.path.splitext(video.filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await video.read())
        tmp_path = tmp.name

    try:
        return analyze_video(
            tmp_path,
            seed_x=seed_x,
            seed_y=seed_y,
            seed_frame=seed_frame,
            start_ms=start_ms,
            end_ms=end_ms,
            point_a_x=point_a_x,
            point_a_y=point_a_y,
            point_a_time=point_a_time,
            point_a_frame=point_a_frame,
            point_b_x=point_b_x,
            point_b_y=point_b_y,
            point_b_time=point_b_time,
            point_b_frame=point_b_frame,
            rom_top_y=rom_top_y,
            rom_bottom_x=rom_bottom_x,
            rom_bottom_y=rom_bottom_y,
            rom_bottom_frame=rom_bottom_frame,
        )
    except TrackingError as exc:
        # User-facing message the frontend can display directly.
        raise HTTPException(status_code=422, detail=str(exc))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
