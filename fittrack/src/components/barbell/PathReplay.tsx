import { useEffect, useMemo, useRef, useState } from 'react';
import type { PathPoint, StickingPoint } from '../../utils/barbellAnalysis';
import { segmentSpeeds, speedColor } from '../../utils/barbellAnalysis';

interface Props {
  path: PathPoint[];
  stickingPoints: StickingPoint[];
  /** Object URL of the analyzed lift video. */
  videoUrl: string;
  /** Native video dimensions (px) — overlay scales to these, like PathOverlay. */
  videoWidth?: number;
  videoHeight?: number;
}

interface ColoredSegment {
  d: string;
  color: string;
}

function mid(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Smoothed, per-segment-colored strokes — identical construction to PathOverlay
 * (quadratic curves between segment midpoints). Colors are normalized against
 * `min`/`range` from the FULL path so a segment keeps the same color as it's
 * progressively revealed during replay.
 */
function buildSegments(pts: PathPoint[], min: number, range: number): ColoredSegment[] {
  if (pts.length < 2) return [];
  const speeds = segmentSpeeds(pts);
  const segments: ColoredSegment[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const start = i === 1 ? pts[0] : mid(pts[i - 1], pts[i]);
    const end = i === pts.length - 1 ? pts[i] : mid(pts[i], pts[i + 1]);
    const ctrl = pts[i];
    const normalized = (speeds[i - 1] - min) / range;
    segments.push({
      d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
      color: speedColor(normalized),
    });
  }
  return segments;
}

/** Path points up to `tMs`, plus an interpolated point at exactly `tMs` so the line grows smoothly. */
function revealedPath(path: PathPoint[], tMs: number): { pts: PathPoint[]; cur: PathPoint | null } {
  if (path.length === 0) return { pts: [], cur: null };
  if (tMs <= path[0].time_ms) return { pts: [path[0]], cur: path[0] };
  const last = path[path.length - 1];
  if (tMs >= last.time_ms) return { pts: path, cur: last };

  let i = 0;
  while (i < path.length - 1 && path[i + 1].time_ms <= tMs) i += 1;
  const a = path[i];
  const b = path[i + 1];
  const f = (tMs - a.time_ms) / (b.time_ms - a.time_ms || 1);
  const cur: PathPoint = {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    frame: a.frame,
    time_ms: tMs,
  };
  return { pts: [...path.slice(0, i + 1), cur], cur };
}

export default function PathReplay({
  path,
  stickingPoints,
  videoUrl,
  videoWidth,
  videoHeight,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [tMs, setTMs] = useState(0);

  // Full-path speed range — fixed for the whole clip so colors stay stable.
  const { min, range } = useMemo(() => {
    const speeds = segmentSpeeds(path);
    const max = Math.max(...speeds, 0.0001);
    const lo = Math.min(...speeds, max);
    return { min: lo, range: max - lo || 1 };
  }, [path]);

  // Keep tMs synced to the video: a rAF loop during playback (smooth), plus
  // event-driven updates for pause/seek/scrub (which don't run the loop).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => setTMs(video.currentTime * 1000);
    const loop = () => {
      sync();
      if (!video.paused && !video.ended) rafRef.current = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      sync();
    };

    video.addEventListener('play', startLoop);
    video.addEventListener('playing', startLoop);
    video.addEventListener('pause', stopLoop);
    video.addEventListener('ended', stopLoop);
    video.addEventListener('seeking', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('timeupdate', sync);
    video.addEventListener('loadedmetadata', sync);

    return () => {
      video.removeEventListener('play', startLoop);
      video.removeEventListener('playing', startLoop);
      video.removeEventListener('pause', stopLoop);
      video.removeEventListener('ended', stopLoop);
      video.removeEventListener('seeking', sync);
      video.removeEventListener('seeked', sync);
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('loadedmetadata', sync);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [videoUrl]);

  const { pts, cur } = useMemo(() => revealedPath(path, tMs), [path, tMs]);
  const segments = useMemo(() => buildSegments(pts, min, range), [pts, min, range]);

  // Sticking markers appear once the bar reaches them in playback.
  const revealedMarkers = useMemo(
    () =>
      stickingPoints
        .map((sp) => path.find((p) => p.frame === sp.frame) ?? path[0])
        .filter((p): p is PathPoint => Boolean(p) && p.time_ms <= tMs),
    [stickingPoints, path, tMs],
  );

  // Mirror PathOverlay's alignment exactly: container aspect = native dims, the
  // media fills it (object-fill), and the SVG covers the container with
  // viewBox = native dims + preserveAspectRatio="none" — so the path lines up
  // identically to the static Path view.
  const hasDims = Boolean(videoWidth && videoHeight);
  const vbW = hasDims ? videoWidth! : 100;
  const vbH = hasDims ? videoHeight! : 100;
  const k = Math.max(vbW, vbH) / 100;

  return (
    <div>
      <div
        className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-[#2A2A2A] bg-black ${
          hasDims ? '' : 'aspect-[3/4]'
        }`}
        style={hasDims ? { aspectRatio: `${vbW} / ${vbH}` } : undefined}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className={`h-full w-full ${hasDims ? 'object-fill' : 'object-contain'}`}
        />

        {/* Overlay must not block the native video controls. */}
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Soft underlay so the colored path reads on any background. */}
          {segments.map((seg, i) => (
            <path
              key={`u-${i}`}
              d={seg.d}
              fill="none"
              stroke="black"
              strokeOpacity={0.35}
              strokeWidth={2.6 * k}
              strokeLinecap="round"
            />
          ))}
          {segments.map((seg, i) => (
            <path
              key={`s-${i}`}
              d={seg.d}
              fill="none"
              stroke={seg.color}
              strokeWidth={1.8 * k}
              strokeLinecap="round"
            />
          ))}

          {/* Sticking points reached so far: pulsing red markers (same style as static). */}
          {revealedMarkers.map((p, i) => (
            <g key={`m-${i}`}>
              <circle cx={p.x} cy={p.y} r={3.5 * k} fill="#ef4444" fillOpacity={0.4}>
                <animate
                  attributeName="r"
                  values={`${3.5 * k};${6.5 * k};${3.5 * k}`}
                  dur="1.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  values="0.5;0;0.5"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={p.x} cy={p.y} r={2 * k} fill="#ef4444" stroke="white" strokeWidth={0.6 * k} />
            </g>
          ))}

          {/* Current bar position — follows the bar through the rep. */}
          {cur && (
            <g>
              <circle cx={cur.x} cy={cur.y} r={4.5 * k} fill="#6C63FF" fillOpacity={0.3} />
              <circle
                cx={cur.x}
                cy={cur.y}
                r={2.6 * k}
                fill="#6C63FF"
                stroke="white"
                strokeWidth={0.8 * k}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Legend — matches the static view, plus the current-position marker. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-16 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(255,70,70), rgb(255,255,70), rgb(70,200,70))' }}
          />
          <span>slow → fast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6C63FF]" />
          <span>current position</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>sticking point</span>
        </div>
      </div>
    </div>
  );
}
