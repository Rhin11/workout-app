import { useRef, useState } from 'react';
import type { SeedPoint } from '../../utils/barbellAnalysis';

interface Props {
  /** Data URL of the captured first frame (native video resolution). */
  firstFrameDataUrl: string;
  seed: SeedPoint | null;
  onSeed: (seed: SeedPoint | null) => void;
}

/**
 * Lets the user tap the barbell in the first frame to seed tracking. The tap is
 * converted to native video-pixel coordinates so it matches what the CV service
 * sees. Optional — analyzing without a seed falls back to auto-detection.
 */
export default function SeedPicker({ firstFrameDataUrl, seed, onSeed }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Fractional position (0–1) of the marker for display, derived from the tap.
  const [marker, setMarker] = useState<{ fx: number; fy: number } | null>(null);

  if (!firstFrameDataUrl) return null;

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setMarker({ fx, fy });
    // Scale into native video pixels (naturalWidth === video_width).
    onSeed({ x: fx * img.naturalWidth, y: fy * img.naturalHeight });
  };

  const clear = () => {
    setMarker(null);
    onSeed(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {seed ? 'Barbell marked ✓' : 'Tap the barbell to improve tracking'}
        </p>
        {seed && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-[#2A2A2A] bg-black">
        <img
          ref={imgRef}
          src={firstFrameDataUrl}
          alt="First frame — tap the barbell"
          onClick={handleClick}
          className="block w-full cursor-crosshair select-none"
        />
        {marker && (
          <span
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#6C63FF]/60 shadow"
            style={{ left: `${marker.fx * 100}%`, top: `${marker.fy * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
