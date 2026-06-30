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
):
    # OpenCV needs a real file path, so persist the upload to a temp file.
    suffix = os.path.splitext(video.filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await video.read())
        tmp_path = tmp.name

    try:
        return analyze_video(tmp_path, seed_x=seed_x, seed_y=seed_y)
    except TrackingError as exc:
        # User-facing message the frontend can display directly.
        raise HTTPException(status_code=422, detail=str(exc))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
