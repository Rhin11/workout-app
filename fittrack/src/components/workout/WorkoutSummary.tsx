import { useMemo } from 'react';
import ExerciseMuscleDiagram from '../exerciseMuscleDiagram';
import type { Workout } from '../../store/workoutStore';
import { computeWorkoutSummary, formatWorkoutVolume } from '../../utils/workoutSummary';

interface Props {
  workout: Workout;
  className?: string;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-gray-100">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
    </div>
  );
}

function MuscleChip({ label, role }: { label: string; role: 'primary' | 'secondary' }) {
  const styles =
    role === 'primary'
      ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
      : 'border-amber-500/35 bg-amber-500/10 text-amber-100';

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}

export default function WorkoutSummary({ workout, className }: Props) {
  const summary = useMemo(() => computeWorkoutSummary(workout), [workout]);

  if (workout.exercises.length === 0) return null;

  const volume = formatWorkoutVolume(summary.volumeLbs, summary.volumeKg);
  const setsLabel =
    summary.completedSetCount === summary.setCount
      ? String(summary.setCount)
      : `${summary.completedSetCount}/${summary.setCount}`;

  return (
    <section className={`overflow-hidden rounded-xl border border-gray-800 bg-gray-900 ${className ?? ''}`}>
      <div className="border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Workout summary</h2>
        <p className="mt-0.5 text-xs text-gray-500">Muscles and volume across all lifts in this session</p>
      </div>

      <div className="border-b border-gray-800 bg-white px-4 py-3">
        <ExerciseMuscleDiagram
          primaryMuscles={summary.primaryMuscles}
          secondaryMuscles={summary.secondaryMuscles}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <StatCard
          label="Lifts"
          value={String(summary.exerciseCount)}
          detail={summary.exerciseCount === 1 ? 'exercise' : 'exercises'}
        />
        <StatCard
          label="Sets"
          value={setsLabel}
          detail={summary.completedSetCount > 0 ? 'completed' : 'logged'}
        />
        <StatCard label="Volume" value={volume} detail="completed sets" />
        <StatCard
          label="Muscles"
          value={String(summary.muscleCount)}
          detail={`${summary.primaryMuscles.length} primary · ${summary.secondaryMuscles.length} secondary`}
        />
      </div>

      {(summary.primaryMuscles.length > 0 || summary.secondaryMuscles.length > 0) && (
        <div className="space-y-3 border-t border-gray-800 px-4 py-3">
          {summary.primaryMuscles.length > 0 && (
            <div>
              <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-indigo-300/80">
                Primary
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.primaryMuscles.map((muscle) => (
                  <MuscleChip key={muscle} label={muscle} role="primary" />
                ))}
              </div>
            </div>
          )}
          {summary.secondaryMuscles.length > 0 && (
            <div>
              <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-amber-200/80">
                Secondary
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.secondaryMuscles.map((muscle) => (
                  <MuscleChip key={muscle} label={muscle} role="secondary" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
