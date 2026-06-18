import type { StickingPoint } from '../../utils/barbellAnalysis';
import { tipForPosition } from '../../utils/barbellAnalysis';

interface Props {
  stickingPoints: StickingPoint[];
}

function formatTimestamp(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export default function StickingPointsCard({ stickingPoints }: Props) {
  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <h2 className="text-sm font-semibold text-gray-100">Sticking points</h2>

      {stickingPoints.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          No sticking points detected — the bar moved smoothly through the lift. Nice work.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {stickingPoints.map((sp, i) => (
            <li
              key={`${sp.frame}-${i}`}
              className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-200">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  {sp.position_pct}% through the rep
                </span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500">
                  @ {formatTimestamp(sp.time_ms)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-400">{tipForPosition(sp.position_pct)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
