import { useState } from 'react';
import type { Exercise } from '../../store/workoutStore';
import ExerciseInfoButton from './ExerciseInfoButton';
import SetRow from './SetRow';

interface Props {
  exercise: Exercise;
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateSet: (
    setId: string,
    updates: Partial<{ reps: number; weight: number; unit: 'lbs' | 'kg'; completed: boolean }>,
  ) => void;
  onRemoveSet: (setId: string) => void;
}

export default function ExerciseCard({
  exercise,
  onAddSet,
  onRemoveExercise,
  onUpdateNotes,
  onUpdateSet,
  onRemoveSet,
}: Props) {
  const hasNotes = Boolean(exercise.notes?.trim());
  const [showNotes, setShowNotes] = useState(hasNotes);

  const totalVolume = exercise.sets.reduce(
    (sum, s) => sum + (s.completed ? s.reps * s.weight : 0),
    0,
  );

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-100">{exercise.name}</h3>
          {totalVolume > 0 && (
            <p className="mt-0.5 text-xs text-gray-500">
              {exercise.sets.filter((s) => s.completed).length} sets · {totalVolume.toLocaleString()}{' '}
              {exercise.sets[0]?.unit ?? 'lbs'} volume
            </p>
          )}
          {showNotes ? (
            <div className="mt-2">
              <textarea
                value={exercise.notes ?? ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Notes — tempo, RPE, form cues..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-indigo-500"
              />
              {!exercise.notes?.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateNotes('');
                    setShowNotes(false);
                  }}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="mt-2 text-xs text-gray-500 hover:text-indigo-400"
            >
              + Add note
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onRemoveExercise}
          className="shrink-0 text-sm text-gray-500 hover:text-red-400"
        >
          Remove
        </button>
      </div>

      <div className="mb-1 grid grid-cols-[2.5rem_1fr_1fr_2.5rem_2rem] gap-2 px-0 text-xs font-medium uppercase tracking-wide text-gray-500">
        <span className="flex items-center justify-center gap-1">
          Set
          <ExerciseInfoButton exerciseName={exercise.name} size="sm" />
        </span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>

      {exercise.sets.map((s, i) => (
        <SetRow
          key={s.id}
          setNumber={i + 1}
          set={s}
          onUpdate={(updates) => onUpdateSet(s.id, updates)}
          onRemove={() => onRemoveSet(s.id)}
          canRemove={exercise.sets.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={onAddSet}
        className="mt-3 w-full rounded-lg border border-dashed border-gray-700 py-2 text-sm text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-400"
      >
        + Add Set
      </button>
    </div>
  );
}
