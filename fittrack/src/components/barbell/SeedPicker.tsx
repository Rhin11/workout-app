import { useEffect, useRef, useState } from 'react';
import type { RomMarkers, SeedPoint } from '../../utils/barbellAnalysis';
import { clientToVideoPixels, getVideoContentRect, videoPixelsToFraction } from '../../utils/videoCoords';

type Step = 'a' | 'b' | 'done';

interface DisplayMarker {
  fx: number;
  fy: number;
  kind: 'a' | 'b';
}

interface Props {
  videoUrl: string;
  videoWidth: number;
  videoHeight: number;
  rom: RomMarkers | null;
  onRom: (rom: RomMarkers | null) => void;
}

const STEP_HINT: Record<Step, string> = {
  a: 'Step 1 — Scrub to one end of your rep, then tap the barbell (point A)',
  b: 'Step 2 — Scrub to the other end, then tap the barbell (point B)',
  done: 'Range marked ✓ — tracking will follow the bar between A and B',
};

/** Minimum pixel distance between A and B so they aren't placed on the same spot. */
const MIN_MARKER_DIST_PX = 24;

/**
 * Lets the user scrub the lift video and tap the barbell at two points (A and B)
 * to define full ROM. Order doesn't matter — deadlifts, presses, etc. all work.
 */
export default function SeedPicker({
  videoUrl,
  videoWidth,
  videoHeight,
  rom,
  onRom,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [step, setStep] = useState<Step>(rom ? 'done' : 'a');
  const [markers, setMarkers] = useState<DisplayMarker[]>([]);
  const [pendingA, setPendingA] = useState<{ point: SeedPoint; time: number } | null>(null);
  const [scrubTime, setScrubTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tapError, setTapError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!rom) {
      setStep('a');
      setMarkers([]);
      setPendingA(null);
    }
  }, [rom]);

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

  const markerPos = (fx: number, fy: number) => {
    if (!containerSize.w || !containerSize.h) return { left: '0%', top: '0%' };
    const cr = getVideoContentRect(containerSize.w, containerSize.h, nativeW, nativeH);
    const left = cr.left + fx * cr.width;
    const top = cr.top + fy * cr.height;
    return { left: `${(left / containerSize.w) * 100}%`, top: `${(top / containerSize.h) * 100}%` };
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (step === 'done') return;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const rect = container.getBoundingClientRect();
    const point = clientToVideoPixels(e.clientX, e.clientY, rect, nativeW, nativeH);
    if (!point) {
      setTapError('Tap on the video picture (not the black bars).');
      return;
    }

    const { fx, fy } = videoPixelsToFraction(point.x, point.y, nativeW, nativeH);
    const t = video.currentTime;

    if (step === 'a') {
      setTapError(null);
      setMarkers([{ fx, fy, kind: 'a' }]);
      setPendingA({ point, time: t });
      setStep('b');
      return;
    }

    if (!pendingA) return;
    const dist = Math.hypot(point.x - pendingA.point.x, point.y - pendingA.point.y);
    if (dist < MIN_MARKER_DIST_PX) {
      setTapError('Points A and B need to be at opposite ends of the rep — tap further apart.');
      return;
    }

    setTapError(null);
    setMarkers([
      { fx: markers[0]?.fx ?? fx, fy: markers[0]?.fy ?? fy, kind: 'a' },
      { fx, fy, kind: 'b' },
    ]);
    onRom({
      pointA: pendingA.point,
      pointAFrame: Math.round(pendingA.time * 30),
      pointATime: pendingA.time,
      pointB: point,
      pointBFrame: Math.round(t * 30),
      pointBTime: t,
    });
    setStep('done');
    setPendingA(null);
  };

  const clear = () => {
    onRom(null);
    setStep('a');
    setMarkers([]);
    setPendingA(null);
    setTapError(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setScrubTime(0);
    }
  };

  const markerClass = (kind: 'a' | 'b') =>
    kind === 'a'
      ? 'border-emerald-400 bg-emerald-500/70'
      : 'border-orange-400 bg-orange-500/70';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">{STEP_HINT[step]}</p>
        {(rom || markers.length > 0) && (
          <button
            type="button"
            onClick={clear}
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
          {markers.map((m) => (
            <span
              key={m.kind}
              className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow ${markerClass(m.kind)}`}
              style={markerPos(m.fx, m.fy)}
            >
              {m.kind.toUpperCase()}
            </span>
          ))}
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

      {tapError && <p className="text-center text-xs text-amber-400">{tapError}</p>}
    </div>
  );
}
