import { useState } from 'react';
import type { Workout } from '../../store/workoutStore';
import SetRow from './SetRow';

interface Props {
  workouts: Workout[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function workoutSummary(workout: Workout) {
  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  return `${exerciseCount} lift${exerciseCount === 1 ? '' : 's'} · ${setCount} set${setCount === 1 ? '' : 's'}`;
}

export default function WorkoutHistory({ workouts, onDelete, onEdit, onRename }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  const beginRename = (workout: Workout) => {
    setRenamingId(workout.id);
    setNameDraft(workout.name);
  };

  const saveRename = (id: string) => {
    onRename(id, nameDraft);
    setRenamingId(null);
    setNameDraft('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setNameDraft('');
  };

  if (workouts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-500">No workouts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const expanded = expandedId === workout.id;
        const isRenaming = renamingId === workout.id;

        return (
          <div key={workout.id} className="rounded-xl border border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2 p-4">
              {isRenaming ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(workout.id);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-1.5 text-sm font-medium text-gray-100 outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveRename(workout.id)}
                    className="shrink-0 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs text-white hover:bg-indigo-400"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelRename}
                    className="shrink-0 text-xs text-gray-500 hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : workout.id)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-100">{workout.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatDate(workout.date)} · {workoutSummary(workout)}
                      </p>
                    </div>
                    <span className="shrink-0 text-gray-500">{expanded ? '▲' : '▼'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => beginRename(workout)}
                    className="shrink-0 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(workout.id)}
                    className="shrink-0 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:border-indigo-500 hover:text-indigo-300"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            {expanded && !isRenaming && (
              <div className="border-t border-gray-800 px-4 pb-4">
                {workout.exercises.length === 0 ? (
                  <p className="py-4 text-sm text-gray-500">No lifts logged</p>
                ) : (
                  <div className="space-y-4 pt-4">
                    {workout.exercises.map((exercise) => (
                      <HistoryExercise key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => onEdit(workout.id)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Edit workout
                  </button>
                  <button
                    type="button"
                    onClick={() => beginRename(workout)}
                    className="text-sm text-gray-400 hover:text-gray-200"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(workout.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete workout
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryExercise({ exercise }: { exercise: Workout['exercises'][number] }) {
  return (
    <div>
      <h4 className="font-medium text-gray-200">{exercise.name}</h4>
      {exercise.notes?.trim() && (
        <p className="mt-1 text-sm italic text-gray-500">{exercise.notes}</p>
      )}
      <div className="mb-1 mt-3 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        <span className="text-center">Set</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Done</span>
      </div>
      {exercise.sets.map((s, i) => (
        <SetRow
          key={s.id}
          setNumber={i + 1}
          set={s}
          onUpdate={() => {}}
          onRemove={() => {}}
          canRemove={false}
          readOnly
        />
      ))}
    </div>
  );
}
