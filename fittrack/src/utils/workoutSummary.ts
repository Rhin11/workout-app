import { getExerciseInfo } from '../constants/exerciseInfo';
import type { Workout } from '../store/workoutStore';

export interface WorkoutSummaryStats {
  exerciseCount: number;
  setCount: number;
  completedSetCount: number;
  volumeLbs: number;
  volumeKg: number;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleCount: number;
}

function aggregateMuscles(exerciseNames: string[]): Pick<WorkoutSummaryStats, 'primaryMuscles' | 'secondaryMuscles'> {
  const primary = new Set<string>();
  const secondary = new Set<string>();

  for (const name of exerciseNames) {
    const { primaryMuscles, secondaryMuscles } = getExerciseInfo(name);

    for (const muscle of primaryMuscles) {
      primary.add(muscle);
      secondary.delete(muscle);
    }
    for (const muscle of secondaryMuscles) {
      if (!primary.has(muscle)) secondary.add(muscle);
    }
  }

  const sortMuscles = (muscles: Set<string>) =>
    [...muscles].sort((a, b) => a.localeCompare(b));

  return {
    primaryMuscles: sortMuscles(primary),
    secondaryMuscles: sortMuscles(secondary),
  };
}

export function computeWorkoutSummary(workout: Workout): WorkoutSummaryStats {
  const exerciseNames = [...new Set(workout.exercises.map((exercise) => exercise.name))];
  const { primaryMuscles, secondaryMuscles } = aggregateMuscles(exerciseNames);

  let setCount = 0;
  let completedSetCount = 0;
  let volumeLbs = 0;
  let volumeKg = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      setCount += 1;
      if (!set.completed) continue;

      completedSetCount += 1;
      const volume = set.reps * set.weight;
      if (set.unit === 'kg') volumeKg += volume;
      else volumeLbs += volume;
    }
  }

  return {
    exerciseCount: workout.exercises.length,
    setCount,
    completedSetCount,
    volumeLbs,
    volumeKg,
    primaryMuscles,
    secondaryMuscles,
    muscleCount: primaryMuscles.length + secondaryMuscles.length,
  };
}

export function formatWorkoutVolume(volumeLbs: number, volumeKg: number): string {
  const parts: string[] = [];
  if (volumeLbs > 0) parts.push(`${volumeLbs.toLocaleString()} lbs`);
  if (volumeKg > 0) parts.push(`${volumeKg.toLocaleString()} kg`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}
