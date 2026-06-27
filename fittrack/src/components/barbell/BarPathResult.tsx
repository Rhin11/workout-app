import { useState } from 'react';
import PathOverlay from './PathOverlay';
import PathReplay from './PathReplay';
import type { PathPoint, StickingPoint } from '../../utils/barbellAnalysis';

interface Props {
  path: PathPoint[];
  stickingPoints: StickingPoint[];
  /** First-frame image for the static view. */
  backgroundUrl?: string | null;
  videoWidth?: number;
  videoHeight?: number;
  fps?: number;
  videoUrl?: string | null;
}

type View = 'path' | 'replay';

/**
 * Bar-path result with a Path / Replay toggle. "Path" is the unchanged static
 * finished-path view; "Replay" plays the video with the path drawing in sync.
 * The toggle only appears when a replayable video is available.
 */
export default function BarPathResult({
  path,
  stickingPoints,
  backgroundUrl,
  videoWidth,
  videoHeight,
  fps,
  videoUrl,
}: Props) {
  const [view, setView] = useState<View>('path');

  const staticView = (
    <PathOverlay
      path={path}
      stickingPoints={stickingPoints}
      backgroundUrl={backgroundUrl}
      videoWidth={videoWidth}
      videoHeight={videoHeight}
    />
  );

  if (!videoUrl) return staticView;

  const toggleBtn = (target: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(target)}
      className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
        view === target ? 'bg-[#6C63FF] text-white' : 'text-gray-400 hover:text-white'
      }`}
      aria-pressed={view === target}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-0.5">
        {toggleBtn('path', 'Path')}
        {toggleBtn('replay', 'Replay')}
      </div>

      {view === 'path' ? (
        staticView
      ) : (
        <PathReplay
          path={path}
          stickingPoints={stickingPoints}
          videoUrl={videoUrl}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          fps={fps}
        />
      )}
    </div>
  );
}
