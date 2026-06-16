import type { MuscleRegionId, MuscleRole } from './types';

const LABEL_TO_REGIONS: Record<string, MuscleRegionId[]> = {
  Chest: ['chest'],
  Back: ['lats', 'lower_back'],
  Shoulders: ['front_delts', 'rear_delts'],
  Biceps: ['biceps'],
  Triceps: ['triceps'],
  Quads: ['quadriceps'],
  Hamstrings: ['hamstrings'],
  Glutes: ['glutes'],
  Calves: ['calves'],
  Abductors: ['abductors'],
  Adductors: ['adductors'],
  Core: ['abs', 'obliques'],
  Traps: ['traps'],
  Forearms: ['forearms'],
};

export function exerciseLabelsToRegions(labels: string[]): MuscleRegionId[] {
  const ids: MuscleRegionId[] = [];
  for (const label of labels) {
    const mapped = LABEL_TO_REGIONS[label];
    if (mapped) ids.push(...mapped);
  }
  return [...new Set(ids)];
}

export function buildMuscleRoleMap(
  primaryMuscles: string[],
  secondaryMuscles: string[],
): Map<MuscleRegionId, MuscleRole> {
  const roles = new Map<MuscleRegionId, MuscleRole>();
  const primary = new Set(exerciseLabelsToRegions(primaryMuscles));
  const secondary = new Set(
    exerciseLabelsToRegions(secondaryMuscles).filter((id) => !primary.has(id)),
  );

  for (const id of primary) roles.set(id, 'primary');
  for (const id of secondary) roles.set(id, 'secondary');

  return roles;
}
