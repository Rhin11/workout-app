import type { ExerciseInfo } from '../../constants/exerciseInfo';
import type { MuscleId } from './types';

/** Maps legacy exercise muscle group labels to diagram muscle IDs. */
const LEGACY_MUSCLE_MAP: Record<string, MuscleId[]> = {
  Chest: ['chest'],
  Back: ['lats', 'lower_back'],
  Shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  Biceps: ['biceps'],
  Triceps: ['triceps'],
  Quads: ['quadriceps'],
  Hamstrings: ['hamstrings'],
  Glutes: ['glutes'],
  Calves: ['calves'],
  Core: ['abs', 'obliques'],
  Traps: ['traps'],
  Forearms: ['forearms'],
};

const STABILIZER_SPLITS: Record<string, MuscleId[]> = {
  'Back Squat': ['calves', 'adductors'],
  'Front Squat': ['calves', 'adductors'],
  Deadlift: ['calves', 'adductors'],
  'Sumo Deadlift': ['adductors', 'calves'],
  Thruster: ['calves', 'traps'],
};

export function legacyMuscleNamesToIds(names: string[]): MuscleId[] {
  const ids: MuscleId[] = [];
  for (const name of names) {
    const mapped = LEGACY_MUSCLE_MAP[name];
    if (mapped) ids.push(...mapped);
  }
  return [...new Set(ids)];
}

export function exerciseInfoToMuscleDiagram(
  exerciseName: string,
  info: ExerciseInfo,
): {
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  stabilizerMuscles: MuscleId[];
} {
  const primary = legacyMuscleNamesToIds(info.primaryMuscles);
  const secondary = legacyMuscleNamesToIds(info.secondaryMuscles).filter(
    (id) => !primary.includes(id),
  );

  const stabilizerFromSplit = STABILIZER_SPLITS[exerciseName] ?? [];
  const stabilizer = stabilizerFromSplit.filter(
    (id) => !primary.includes(id) && !secondary.includes(id),
  );

  // Back Squat secondary includes Core -> abs/obliques; user spec also lists lower_back.
  if (exerciseName === 'Back Squat' && !secondary.includes('lower_back')) {
    secondary.push('lower_back');
  }

  return { primaryMuscles: primary, secondaryMuscles: secondary, stabilizerMuscles: stabilizer };
}
