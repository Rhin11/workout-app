import { useEffect, useMemo, useRef, useState } from 'react';
import type { PathPoint, StickingPoint } from '../../utils/barbellAnalysis';
import { segmentSpeeds, speedColor } from '../../utils/barbellAnalysis';
import VideoPathOverlay from './VideoPathOverlay';

interface Props {
  path: PathPoint[];
  stickingPoints: StickingPoint[];
  videoUrl: string;
  videoWidth?: number;
  videoHeight?: number;
  fps?: number;
}

interface ColoredSegment {
  d: string;
  color: string;
}

function inferFps(path: PathPoint[]): number {
  if (path.length < 2) return 30;
  const df = path[1].frame - path[0].frame;
  const dt = path[1].time_ms - path[0].time_ms;
  if (df > 0 && dt > 0) return (df / dt) * 1000;
  return 30;
}

function buildSegments(pts: PathPoint[], min: number, range: number): ColoredSegment[] {
  if (pts.length < 2) return [];
  const speeds = segmentSpeeds(pts);
  const segments: ColoredSegment[] = [];
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const normalized = (speeds[i - 1] - min) / range;
    segments.push({
      d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
      color: speedColor(normalized),
    });
  }
  return segments;
}

/** Sync overlay to video by frame index (not wall-clock time alone). */
function revealedPathByFrame(
  path: PathPoint[],
  frame: number,
): { pts: PathPoint[]; cur: PathPoint | null } {
  if (path.length === 0 || frame < path[0].frame) return { pts: [], cur: null };
  const last = path[path.length - 1];
  if (frame >= last.frame) return { pts: path, cur: last };

  let i = 0;
  while (i < path.length - 1 && path[i + 1].frame <= frame) i += 1;
  const a = path[i];
  const b = path[i + 1];
  const f = (frame - a.frame) / (b.frame - a.frame || 1);
  const cur: PathPoint = {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    frame,
    time_ms: Math.round(a.time_ms + (b.time_ms - a.time_ms) * f),
  };
  return { pts: [...path.slice(0, i + 1), cur], cur };
}

export default function PathReplay({
  path,
  stickingPoints,
  videoUrl,
  videoWidth,
  videoHeight,
  fps: fpsProp,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(0);

  const fps = fpsProp ?? inferFps(path);

  const { min, range } = useMemo(() => {
    const speeds = segmentSpeeds(path);
    const max = Math.max(...speeds, 0.0001);
    const lo = Math.min(...speeds, max);
    return { min: lo, range: max - lo || 1 };
  }, [path]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => setFrame(Math.round(video.currentTime * fps));

    const loop = () => {
      sync();
      if (!video.paused && !video.ended) {
        rafRef.current = requestAnimationFrame(loop);
      }
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
  }, [videoUrl, fps]);

  const { pts, cur } = useMemo(() => revealedPathByFrame(path, frame), [path, frame]);
  const segments = useMemo(() => buildSegments(pts, min, range), [pts, min, range]);

  const revealedMarkers = useMemo(
    () =>
      stickingPoints
        .map((sp) => path.find((p) => p.frame === sp.frame) ?? path[0])
        .filter((p): p is PathPoint => Boolean(p) && p.frame <= frame),
    [stickingPoints, path, frame],
  );

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
          className="h-full w-full object-contain"
        />

        {hasDims && (
          <VideoPathOverlay mediaRef={videoRef} videoWidth={vbW} videoHeight={vbH}>
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

            {cur && (
              <g>
                <circle cx={cur.x} cy={cur.y} r={1.8 * k} fill="#6C63FF" fillOpacity={0.35} />
                <circle
                  cx={cur.x}
                  cy={cur.y}
                  r={1.1 * k}
                  fill="#6C63FF"
                  stroke="white"
                  strokeWidth={0.35 * k}
                />
              </g>
            )}
          </VideoPathOverlay>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-16 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(255,70,70), rgb(255,255,70), rgb(70,200,70))' }}
          />
          <span>slow → fast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6C63FF]" />
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
