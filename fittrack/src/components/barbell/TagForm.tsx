import { useState } from 'react';
import ExerciseSelect from './ExerciseSelect';

export interface AnalysisTag {
  exerciseName: string;
  date: string;
  weight?: number;
  weightUnit: 'lbs' | 'kg';
}

interface Props {
  initial?: Partial<AnalysisTag>;
  submitLabel: string;
  onSubmit: (tag: AnalysisTag) => void;
  onCancel?: () => void;
}

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Normalize an `initial.date` (already `YYYY-MM-DD`, or an ISO timestamp) to a date-input value. */
function toDateInputValue(value?: string): string {
  if (!value) return todayKey();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayKey();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * The shared tagging fields (lift + date + optional weight). Owns its own draft
 * state; reused by the inline post-analysis card and the re-tag modal.
 */
export default function TagForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [exerciseName, setExerciseName] = useState(initial?.exerciseName ?? '');
  const [date, setDate] = useState(toDateInputValue(initial?.date));
  const [weight, setWeight] = useState(initial?.weight != null ? String(initial.weight) : '');
  const [unit, setUnit] = useState<'lbs' | 'kg'>(initial?.weightUnit ?? 'lbs');

  const canSave = exerciseName.trim().length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    const parsedWeight = weight.trim() ? Number(weight) : undefined;
    onSubmit({
      exerciseName: exerciseName.trim(),
      date,
      weight: parsedWeight != null && !Number.isNaN(parsedWeight) ? parsedWeight : undefined,
      weightUnit: unit,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Lift
        </label>
        <ExerciseSelect value={exerciseName} onChange={setExerciseName} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Weight <span className="text-gray-600">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 315"
              className="min-w-0 flex-1 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-[#6C63FF]"
            />
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A]">
              {(['lbs', 'kg'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    unit === u ? 'bg-[#6C63FF] text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2A2A2A] px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSave}
          className="flex-1 rounded-lg bg-[#6C63FF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5a52e0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {canSave ? submitLabel : 'Choose a lift first'}
        </button>
      </div>
    </div>
  );
}
