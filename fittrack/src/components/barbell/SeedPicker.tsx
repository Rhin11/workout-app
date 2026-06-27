import { useEffect, useRef, useState } from 'react';
import type { SeedPoint } from '../../utils/barbellAnalysis';
import { clientToVideoPixels, getVideoContentRect } from '../../utils/videoCoords';

/** A single tapped bar location plus the moment (seconds) it was tapped. */
export interface SeedSelection {
  point: SeedPoint;
  time: number;
}

interface Props {
  videoUrl: string;
  videoWidth: number;
  videoHeight: number;
  seed: SeedSelection | null;
  onSeed: (seed: SeedSelection | null) => void;
  /** Trim window (ms). null = default (seed time / clip end). */
  startMs: number | null;
  endMs: number | null;
  onStartMs: (ms: number | null) => void;
  onEndMs: (ms: number | null) => void;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/**
 * Lets the user scrub the lift video, optionally trim the working set with
 * "Set start" / "Set end", and tap the barbell once to seed the tracker. The
 * tracker then follows the bar across the whole segment (all reps).
 */
export default function SeedPicker({
  videoUrl,
  videoWidth,
  videoHeight,
  seed,
  onSeed,
  startMs,
  endMs,
  onStartMs,
  onEndMs,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scrubTime, setScrubTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tapError, setTapError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!videoUrl) return null;

  const nativeW = videoWidth || videoRef.current?.videoWidth || 1;
  const nativeH = videoHeight || videoRef.current?.videoHeight || 1;

  const handleLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setScrubTime(video.currentTime || 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) setScrubTime(video.currentTime);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(e.target.value);
    video.currentTime = t;
    setScrubTime(t);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    const rect = container.getBoundingClientRect();
    const point = clientToVideoPixels(e.clientX, e.clientY, rect, nativeW, nativeH);
    if (!point) {
      setTapError('Tap on the video picture (not the black bars).');
      return;
    }
    setTapError(null);
    onSeed({ point, time: video.currentTime });
  };

  const setStart = () => {
    const ms = Math.round(scrubTime * 1000);
    if (endMs != null && ms >= endMs) {
      setTapError('Start must come before the end marker.');
      return;
    }
    setTapError(null);
    onStartMs(ms);
  };

  const setEnd = () => {
    const ms = Math.round(scrubTime * 1000);
    if (startMs != null && ms <= startMs) {
      setTapError('End must come after the start marker.');
      return;
    }
    setTapError(null);
    onEndMs(ms);
  };

  const clearAll = () => {
    onSeed(null);
    onStartMs(null);
    onEndMs(null);
    setTapError(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setScrubTime(0);
    }
  };

  const markerPos = (point: SeedPoint) => {
    if (!containerSize.w || !containerSize.h) return { left: '0%', top: '0%' };
    const cr = getVideoContentRect(containerSize.w, containerSize.h, nativeW, nativeH);
    const left = cr.left + (point.x / nativeW) * cr.width;
    const top = cr.top + (point.y / nativeH) * cr.height;
    return { left: `${(left / containerSize.w) * 100}%`, top: `${(top / containerSize.h) * 100}%` };
  };

  const trimLabel =
    startMs != null || endMs != null
      ? `Analyzing ${startMs != null ? fmt(startMs / 1000) : 'start'} → ${
          endMs != null ? fmt(endMs / 1000) : 'end'
        }`
      : 'Analyzing the full video';

  const pill =
    'rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-[#6C63FF] hover:text-white';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {seed
            ? 'Bar marked ✓ — optionally trim to your working reps below'
            : 'Tap the barbell to mark it, then (optionally) trim the segment'}
        </p>
        {(seed || startMs != null || endMs != null) && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-sm cursor-crosshair overflow-hidden rounded-xl border border-[#2A2A2A] bg-black"
        style={nativeW && nativeH ? { aspectRatio: `${nativeW} / ${nativeH}` } : undefined}
        onClick={handleTap}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoaded}
          onTimeUpdate={handleTimeUpdate}
          className="pointer-events-none h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-0">
          {seed && (
            <span
              className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#6C63FF] bg-[#6C63FF]/60 text-[10px] font-bold text-white shadow"
              style={markerPos(seed.point)}
            >
              ✕
            </span>
          )}
        </div>
      </div>

      {duration > 0 && (
        <input
          type="range"
          min={0}
          max={duration}
          step={0.033}
          value={scrubTime}
          onChange={handleScrub}
          className="mx-auto block w-full max-w-sm accent-[#6C63FF]"
          aria-label="Scrub video"
        />
      )}

      {/* Trim controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={setStart} className={pill}>
          Set start ({fmt(scrubTime)})
        </button>
        <button type="button" onClick={setEnd} className={pill}>
          Set end ({fmt(scrubTime)})
        </button>
        {startMs != null && (
          <button type="button" onClick={() => onStartMs(null)} className={pill}>
            Clear start
          </button>
        )}
        {endMs != null && (
          <button type="button" onClick={() => onEndMs(null)} className={pill}>
            Clear end
          </button>
        )}
      </div>

      <p className="text-center text-xs text-gray-500">{trimLabel}</p>
      {tapError && <p className="text-center text-xs text-amber-400">{tapError}</p>}
    </div>
  );
}
