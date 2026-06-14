import type { MuscleId } from './types';

/** Muscles that share the same SVG geometry on a given view. */
export const MUSCLE_EQUIVALENTS: Partial<Record<MuscleId, MuscleId[]>> = {
  front_delts: ['side_delts'],
  side_delts: ['front_delts'],
};

export function expandMuscleId(muscleId: MuscleId): MuscleId[] {
  const equivalents = MUSCLE_EQUIVALENTS[muscleId] ?? [];
  return [muscleId, ...equivalents];
}

export function musclesMatch(a: MuscleId, b: MuscleId): boolean {
  return expandMuscleId(a).includes(b);
}
