import type { PersonalRecord } from '../../utils/prs';

const card = 'rounded-xl border border-[#2A2A2A] bg-[#141414] p-4';

function formatDate(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  pr: PersonalRecord;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Expandable Personal Record card — exercise name, best set, date, estimated 1RM,
 * with per-workout history when expanded. Shared by the featured main-lifts list
 * and the "See all PRs" view, so the styling/behavior stays identical everywhere.
 */
export default function PRCard({ pr, isOpen, onToggle }: Props) {
  return (
    <div className={card}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-100">{pr.exercise}</p>
          <p className="text-xs text-gray-500">
            {pr.weight} {pr.unit} × {pr.reps} · {formatDate(pr.date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-right">
          <div>
            <p className="text-sm font-bold text-[#6C63FF]">
              {Math.round(pr.e1rm)} {pr.unit}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">est. 1RM</p>
          </div>
          <span className="text-gray-500">{isOpen ? '▴' : '▾'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 border-t border-[#2A2A2A] pt-3">
          {pr.history.length <= 1 ? (
            <p className="text-xs text-gray-500">No earlier attempts logged yet.</p>
          ) : (
            <ul className="space-y-1">
              {pr.history.map((h, i) => (
                <li
                  key={`${h.date}-${i}`}
                  className="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>{formatDate(h.date)}</span>
                  <span>
                    {h.weight} {h.unit} × {h.reps}
                    <span className="ml-2 text-gray-600">
                      ~{Math.round(h.e1rm)} {h.unit}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
