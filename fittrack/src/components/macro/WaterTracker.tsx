import { useState } from 'react';
import { colors } from '../../constants/theme';
import type { WaterEntry } from '../../store/macroStore';

const QUICK_ADD = [
  { label: '+8 oz', amountOz: 8 },
  { label: '+12 oz', amountOz: 12 },
  { label: '+16 oz', amountOz: 16 },
  { label: '+20 oz', amountOz: 20 },
  { label: '+32 oz', amountOz: 32 },
];

export function formatOz(oz: number): string {
  const rounded = Math.round(oz * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

interface Props {
  consumedOz: number;
  goalOz: number;
  entries: WaterEntry[];
  onAdd: (amountOz: number) => void;
  onRemove: (id: string) => void;
  onEditGoal: () => void;
}

export default function WaterTracker({ consumedOz, goalOz, entries, onAdd, onRemove, onEditGoal }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [customOz, setCustomOz] = useState('');

  const pct = goalOz > 0 ? Math.min(100, (consumedOz / goalOz) * 100) : 0;

  const addCustom = () => {
    const amount = Number(customOz);
    if (amount > 0) {
      onAdd(amount);
      setCustomOz('');
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-medium text-gray-400">Water</p>
            <button
              type="button"
              onClick={onEditGoal}
              className="text-sm text-gray-500 hover:text-indigo-400"
              aria-label="Edit water goal"
              title="Edit water goal"
            >
              ⚙
            </button>
          </div>
          <p className="text-lg font-semibold text-gray-100">
            {formatOz(consumedOz)}
            <span className="text-sm font-normal text-gray-500"> / {formatOz(goalOz)} oz</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          {expanded ? 'Hide log ▲' : 'Show log ▼'}
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: colors.water }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map(({ label, amountOz }) => (
          <button
            key={label}
            type="button"
            onClick={() => onAdd(amountOz)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-300"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={customOz}
          onChange={(e) => setCustomOz(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addCustom();
          }}
          placeholder="Custom oz"
          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Add
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">No water logged yet</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {[...entries].reverse().map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-300">{formatOz(entry.amountOz)} oz</span>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-800 hover:text-red-400"
                    aria-label={`Remove ${formatOz(entry.amountOz)} oz`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
