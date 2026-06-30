import { useMemo } from 'react';
import type { PathPoint, StickingPoint } from '../../utils/barbellAnalysis';
import { segmentSpeeds, speedColor } from '../../utils/barbellAnalysis';

interface Props {
  path: PathPoint[];
  stickingPoints: StickingPoint[];
  /** Data URL of the lift's first frame, drawn behind the overlay. */
  backgroundUrl?: string | null;
  /**
   * Native video dimensions (px). When present, the path is in pixel
   * coordinates and the overlay scales to the real video aspect ratio. When
   * absent (legacy mock sessions), the path is in 0–100 normalized space.
   */
  videoWidth?: number;
  videoHeight?: number;
}

interface ColoredSegment {
  d: string;
  color: string;
}

function mid(a: PathPoint, b: PathPoint) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Build smoothed, per-segment-colored strokes through the path using
 * quadratic curves between segment midpoints (control point = the shared
 * vertex). Each sub-segment is colored by local bar speed.
 */
function buildSegments(path: PathPoint[]): ColoredSegment[] {
  if (path.length < 2) return [];

  const speeds = segmentSpeeds(path);
  const max = Math.max(...speeds, 0.0001);
  const min = Math.min(...speeds);
  const range = max - min || 1;

  const segments: ColoredSegment[] = [];
  for (let i = 1; i < path.length; i += 1) {
    const start = i === 1 ? path[0] : mid(path[i - 1], path[i]);
    const end = i === path.length - 1 ? path[i] : mid(path[i], path[i + 1]);
    const ctrl = path[i];
    const normalized = (speeds[i - 1] - min) / range;
    segments.push({
      d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
      color: speedColor(normalized),
    });
  }
  return segments;
}

export default function PathOverlay({
  path,
  stickingPoints,
  backgroundUrl,
  videoWidth,
  videoHeight,
}: Props) {
  const segments = useMemo(() => buildSegments(path), [path]);

  const markers = useMemo(
    () =>
      stickingPoints
        .map((sp) => path.find((p) => p.frame === sp.frame) ?? path[0])
        .filter((p): p is PathPoint => Boolean(p)),
    [stickingPoints, path],
  );

  // Real pixel-space results carry video dimensions; legacy mock data is 0–100.
  const hasDims = Boolean(videoWidth && videoHeight);
  const vbW = hasDims ? videoWidth! : 100;
  const vbH = hasDims ? videoHeight! : 100;
  // Scale stroke widths / marker radii so they look identical at any viewBox size.
  const k = Math.max(vbW, vbH) / 100;

  return (
    <div>
      <div
        className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-[#2A2A2A] bg-black ${
          hasDims ? '' : 'aspect-[3/4]'
        }`}
        style={hasDims ? { aspectRatio: `${vbW} / ${vbH}` } : undefined}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt="First frame of the lift"
            className={`h-full w-full opacity-80 ${hasDims ? 'object-fill' : 'object-cover'}`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]" />
        )}

        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
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

          {/* Sticking points: pulsing red markers. */}
          {markers.map((p, i) => (
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
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-16 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(255,70,70), rgb(255,255,70), rgb(70,200,70))' }}
          />
          <span>slow → fast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>sticking point</span>
        </div>
      </div>
    </div>
  );
}
