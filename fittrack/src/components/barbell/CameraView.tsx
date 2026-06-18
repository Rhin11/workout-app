import { useEffect, useRef, useState } from 'react';

export interface CapturedVideo {
  /** Object URL for the recorded/uploaded video. */
  videoUrl: string;
  /** Data URL of the first frame, used as overlay background + history thumbnail. */
  firstFrameDataUrl: string;
  /** The raw video bytes, POSTed to the CV service for analysis. */
  blob: Blob;
  /** Native video resolution (px) — used to scale seed taps into pixel coords. */
  width: number;
  height: number;
}

interface Props {
  onCapture: (video: CapturedVideo) => void;
  onReset: () => void;
  hasVideo: boolean;
  videoUrl: string | null;
}

const MAX_SECONDS = 30;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Grab the first frame of a video element to a data URL via an offscreen canvas. */
function captureFirstFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    // Tainted canvas (shouldn't happen for local blobs) — fail soft.
    return '';
  }
}

function clearVideoElement(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.srcObject = null;
  video.removeAttribute('src');
  video.load();
}

export default function CameraView({ onCapture, onReset, hasVideo, videoUrl }: Props) {
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoRecord, setAutoRecord] = useState(false);

  // Stop everything and release the camera.
  const teardownStream = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  };

  useEffect(() => teardownStream, []);

  useEffect(() => {
    if (!hasVideo) {
      clearVideoElement(previewVideoRef.current);
    }
  }, [hasVideo]);

  // Pull the first frame off a ready video element, then hand the capture up.
  const emitCapture = (url: string, blob: Blob) => {
    const probe = document.createElement('video');
    probe.preload = 'auto';
    probe.muted = true;
    probe.src = url;
    const finish = () => {
      const frame = captureFirstFrame(probe);
      onCapture({
        videoUrl: url,
        firstFrameDataUrl: frame,
        blob,
        width: probe.videoWidth || 0,
        height: probe.videoHeight || 0,
      });
    };
    probe.onloadeddata = () => {
      // Seek a hair past 0 so a real frame is decoded.
      const onSeeked = () => {
        probe.removeEventListener('seeked', onSeeked);
        finish();
      };
      probe.addEventListener('seeked', onSeeked);
      try {
        probe.currentTime = 0.1;
      } catch {
        finish();
      }
    };
    probe.onerror = () =>
      onCapture({ videoUrl: url, firstFrameDataUrl: '', blob, width: 0, height: 0 });
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        clearVideoElement(liveVideoRef.current);
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play().catch(() => {});
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        teardownStream();
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' });
        const url = URL.createObjectURL(blob);
        emitCapture(url, blob);
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      setError('Camera unavailable. Check permissions, or upload a video instead.');
      teardownStream();
    }
  };

  const stopRecording = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  useEffect(() => {
    if (!hasVideo && autoRecord) {
      setAutoRecord(false);
      void startRecording();
    }
    // startRecording is stable enough for this one-shot retake flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideo, autoRecord]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    emitCapture(url, file);
    e.target.value = '';
  };

  const handleRetake = () => {
    stopRecording();
    teardownStream();
    setElapsed(0);
    setError(null);
    clearVideoElement(previewVideoRef.current);
    clearVideoElement(liveVideoRef.current);
    onReset();
    setAutoRecord(true);
  };

  const btnPrimary =
    'rounded-lg bg-[#6C63FF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40';
  const btnGhost =
    'rounded-lg border border-[#2A2A2A] px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-[#6C63FF] hover:text-white';

  return (
    <div className="space-y-4">
      {/* Viewfinder */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl border border-[#2A2A2A] bg-black">
        {hasVideo && videoUrl ? (
          <video
            key="preview"
            ref={previewVideoRef}
            src={videoUrl}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <video
              key="live"
              ref={liveVideoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {!recording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#141414]/80">
                  <span className="text-2xl">🎥</span>
                </div>
                <p className="px-6 text-sm text-gray-500">
                  Record your lift from the side, or upload a video
                </p>
              </div>
            )}
            {/* Corner viewfinder guides */}
            <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/10" />
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-medium tabular-nums text-white">
                  {formatTimer(elapsed)} / {formatTimer(MAX_SECONDS)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasVideo ? (
          <button type="button" onClick={handleRetake} className={btnGhost}>
            Record again
          </button>
        ) : recording ? (
          <button type="button" onClick={stopRecording} className={btnPrimary}>
            Stop
          </button>
        ) : (
          <>
            <button type="button" onClick={startRecording} className={btnPrimary}>
              Record
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={btnGhost}
            >
              Upload Video
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
