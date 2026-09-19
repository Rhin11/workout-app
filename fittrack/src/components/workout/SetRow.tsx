import type { HistoricSet } from '../../utils/liftHistory';
import type { WorkoutSet } from '../../store/workoutStore';

interface Props {
  setNumber: number | string;
  set: WorkoutSet;
  onUpdate: (updates: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'unit' | 'completed'>>) => void;
  onRemove: () => void;
  canRemove: boolean;
  readOnly?: boolean;
  /** When set (superset rounds), replaces the set-number cell with this label. */
  leadingLabel?: string;
  /** Styles the row as a warm-up set (amber accent) instead of a working set. */
  isWarmup?: boolean;
  /** Last session's matching working set, shown as a hint. */
  previous?: HistoricSet;
}

export default function SetRow({
  setNumber,
  set,
  onUpdate,
  onRemove,
  canRemove,
  readOnly,
  leadingLabel,
  isWarmup = false,
  previous,
}: Props) {
  const leadCols = leadingLabel ? '6rem' : '2.5rem';
  const leadCell = leadingLabel ? (
    <span className="truncate pl-1 text-left text-xs text-gray-300" title={leadingLabel}>
      {leadingLabel}
    </span>
  ) : (
    <span
      className={`text-center text-sm ${isWarmup ? 'font-semibold text-amber-500' : 'text-gray-500'}`}
    >
      {setNumber}
    </span>
  );
  const borderColor = isWarmup ? 'border-amber-900/50' : 'border-gray-800';
  if (readOnly) {
    return (
      <div
        className={`grid items-center gap-2 border-b py-2 ${borderColor} ${
          set.completed ? 'opacity-60' : ''
        }`}
        style={{ gridTemplateColumns: `${leadCols} 1fr 1fr 2.5rem` }}
      >
        {leadCell}
        <span className="text-center text-sm text-gray-100">
          {set.weight} {set.unit}
        </span>
        <span className="text-center text-sm text-gray-100">{set.reps}</span>
        <span className="text-center text-sm">{set.completed ? '✓' : '—'}</span>
      </div>
    );
  }

  return (
    <div
      className={`grid items-center gap-2 border-b py-2 ${borderColor} ${
        set.completed ? 'opacity-60' : ''
      }`}
      style={{ gridTemplateColumns: `${leadCols} 1fr 1fr 2.5rem 2rem` }}
    >
      {leadCell}

      <div className="flex flex-col items-stretch gap-0.5">
        <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          step={2.5}
          value={set.weight || ''}
          placeholder="0"
          onChange={(e) => onUpdate({ weight: Number(e.target.value) || 0 })}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center text-sm text-gray-100 outline-none focus:border-indigo-500"
        />
        <select
          value={set.unit}
          onChange={(e) => onUpdate({ unit: e.target.value as 'lbs' | 'kg' })}
          className="rounded-lg border border-gray-700 bg-gray-800 px-1 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500"
        >
          <option value="lbs">lbs</option>
          <option value="kg">kg</option>
        </select>
        </div>
        {previous && (
          <span className="text-center text-[10px] tabular-nums text-gray-600">
            last {previous.weight}×{previous.reps}
          </span>
        )}
      </div>

      <input
        type="number"
        min={0}
        step={1}
        value={set.reps || ''}
        placeholder="0"
        onChange={(e) => onUpdate({ reps: Number(e.target.value) || 0 })}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-center text-sm text-gray-100 outline-none focus:border-indigo-500"
      />

      <button
        type="button"
        onClick={() => onUpdate({ completed: !set.completed })}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
          set.completed
            ? 'border-green-600 bg-green-600/20 text-green-400'
            : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
        }`}
        aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
      >
        ✓
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="text-gray-600 hover:text-red-400 disabled:invisible"
        aria-label="Remove set"
      >
        ×
      </button>
    </div>
  );
}
