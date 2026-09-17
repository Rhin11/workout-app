import { useState } from 'react';
import { colors } from '../../constants/theme';
import {
  formatSessionDate,
  formatSetList,
  type LiftHistoryView,
} from '../../utils/liftHistory';

interface Props {
  history: LiftHistoryView;
}

const TREND = {
  more: { label: 'More than last time', short: 'More', arrow: '↑', color: colors.success },
  less: { label: 'Less than last time', short: 'Less', arrow: '↓', color: colors.error },
  same: { label: 'Same as last time', short: 'Same', arrow: '→', color: colors.textSecondary },
} as const;

export default function LiftHistory({ history }: Props) {
  const [open, setOpen] = useState(false);
  const { last, older, trend } = history;

  if (!last) return null;

  const trendUi = trend ? TREND[trend] : null;

  return (
    <div className="mb-3 rounded-lg border border-gray-800 bg-gray-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
        aria-label={open ? 'Collapse lift history' : 'Expand lift history'}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {open ? '▾' : '▸'} Last time · {formatSessionDate(last.date)}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-300">{formatSetList(last.sets)}</p>
        </div>
        {trendUi && (
          <span
            className="shrink-0 text-xs font-semibold"
            style={{ color: trendUi.color }}
            title={trendUi.label}
          >
            {trendUi.arrow} {trendUi.short}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-800 px-3 py-2">
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-600">
            Working sets
          </p>
          <ol className="space-y-0.5">
            {last.sets.map((s, i) => (
              <li key={`${last.workoutId}-${i}`} className="flex justify-between text-xs text-gray-400">
                <span>Set {i + 1}</span>
                <span className="tabular-nums">
                  {s.weight} {s.unit} × {s.reps}
                </span>
              </li>
            ))}
          </ol>
          {older.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-gray-800 pt-2">
              {older.map((session) => (
                <li
                  key={session.workoutId}
                  className="flex items-start justify-between gap-2 text-xs text-gray-500"
                >
                  <span className="shrink-0">{formatSessionDate(session.date)}</span>
                  <span className="text-right tabular-nums">{formatSetList(session.sets)}</span>
                </li>
              ))}
            </ul>
          )}
          {older.length === 0 && (
            <p className="mt-2 text-[11px] text-gray-600">No earlier sessions for this lift.</p>
          )}
        </div>
      )}
    </div>
  );
}
