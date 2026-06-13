import type { WorkoutSet } from '../../store/workoutStore';

interface Props {
  setNumber: number;
  set: WorkoutSet;
  onUpdate: (updates: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'unit' | 'completed'>>) => void;
  onRemove: () => void;
  canRemove: boolean;
  readOnly?: boolean;
}

export default function SetRow({ setNumber, set, onUpdate, onRemove, canRemove, readOnly }: Props) {
  if (readOnly) {
    return (
      <div
        className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 border-b border-gray-800 py-2 ${
          set.completed ? 'opacity-60' : ''
        }`}
      >
        <span className="text-center text-sm text-gray-500">{setNumber}</span>
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
      className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 border-b border-gray-800 py-2 ${
        set.completed ? 'opacity-60' : ''
      }`}
    >
      <span className="text-center text-sm text-gray-500">{setNumber}</span>

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
