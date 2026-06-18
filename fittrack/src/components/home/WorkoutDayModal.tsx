import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Workout } from '../../store/workoutStore';
import { computeWorkoutSummary, formatWorkoutVolume } from '../../utils/workoutSummary';

interface Props {
  dateKey: string;
  workouts: Workout[];
  calories: number;
  onClose: () => void;
  onViewWorkout: (id: string) => void;
}

function formatLongDate(dateKey: string): string {
  // dateKey is YYYY-MM-DD in local time; build a local Date to avoid TZ shifts.
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSet(weight: number, reps: number): string {
  return `${weight || 0} × ${reps || 0}`;
}

export default function WorkoutDayModal({
  dateKey,
  workouts,
  calories,
  onClose,
  onViewWorkout,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dayVolume = useMemo(() => {
    let volumeLbs = 0;
    let volumeKg = 0;
    for (const w of workouts) {
      const s = computeWorkoutSummary(w);
      volumeLbs += s.volumeLbs;
      volumeKg += s.volumeKg;
    }
    return formatWorkoutVolume(volumeLbs, volumeKg);
  }, [workouts]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Workouts on ${formatLongDate(dateKey)}`}
    >
      <div
        className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <p className="text-xs uppercase tracking-wide text-slate-500">{formatLongDate(dateKey)}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 pr-10">
          <h2 className="text-lg font-bold text-white">
            {workouts.length === 1 ? workouts[0].name : `${workouts.length} workouts`}
          </h2>
          <span className="text-sm text-slate-400">Total volume {dayVolume}</span>
          {calories > 0 && (
            <span className="text-sm text-slate-400">· {Math.round(calories).toLocaleString()} kcal</span>
          )}
        </div>

        <div className="mt-5 space-y-5">
          {workouts.map((workout) => (
            <div key={workout.id} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              {workouts.length > 1 && (
                <h3 className="mb-2 text-sm font-semibold text-white">{workout.name}</h3>
              )}
              {workout.exercises.length === 0 ? (
                <p className="text-sm text-slate-400">No lifts logged</p>
              ) : (
                <div className="space-y-3">
                  {workout.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <p className="text-sm font-medium text-slate-200">{exercise.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {exercise.sets.map((s) => (
                          <span
                            key={s.id}
                            className="rounded-md border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-xs text-slate-300"
                          >
                            {formatSet(s.weight, s.reps)} {s.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onViewWorkout(workout.id)}
                className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                View full workout →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
