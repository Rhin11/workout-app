import type { MuscleGroupFilter } from '../../constants/exercises';

/** Muscle path IDs — front view uses f-*, back view uses b-* */
export const MUSCLE_PATH_MAP: Record<MuscleGroupFilter, readonly string[]> = {
  Chest: ['f-pec-up-l', 'f-pec-up-r', 'f-pec-lo-l', 'f-pec-lo-r'],
  Back: [
    'b-lat-up-l',
    'b-lat-up-r',
    'b-lat-lo-l',
    'b-lat-lo-r',
    'b-erector',
    'b-er-l',
    'b-er-r',
  ],
  Shoulders: ['f-delt-l', 'f-delt-r', 'b-delt-l', 'b-delt-r'],
  Biceps: ['f-bicep-l', 'f-bicep-r'],
  Triceps: ['b-tri-l', 'b-tri-r'],
  Quads: ['f-quad-l', 'f-quad-r', 'f-rect-fem', 'f-vast-med-l', 'f-vast-med-r'],
  Hamstrings: ['b-ham-l', 'b-ham-r', 'b-ham-in-l', 'b-ham-in-r'],
  Glutes: ['b-glute-l', 'b-glute-r'],
  Calves: ['f-shin-l', 'f-shin-r', 'b-calf-l', 'b-calf-r'],
  Core: [
    'f-abs-1l',
    'f-abs-1r',
    'f-abs-2l',
    'f-abs-2r',
    'f-abs-3l',
    'f-abs-3r',
    'f-obl-l',
    'f-obl-r',
  ],
  Traps: ['f-trap-l', 'f-trap-r', 'b-trap-up', 'b-trap-mid'],
  Forearms: ['f-fore-l', 'f-fore-r', 'b-fore-l', 'b-fore-r'],
  'Full Body': [],
};

export function activePathIds(muscles: MuscleGroupFilter[], allPathIds: string[]): Set<string> {
  const specific = muscles.filter((m) => m !== 'Full Body');
  const groups = specific.length > 0 ? specific : muscles;

  if (groups.includes('Full Body')) {
    return new Set(allPathIds);
  }

  const ids = new Set<string>();
  for (const muscle of groups) {
    for (const pathId of MUSCLE_PATH_MAP[muscle] ?? []) {
      ids.add(pathId);
    }
  }
  return ids;
}

export function pathIdsForMuscleNames(names: string[]): Set<string> {
  const ids = new Set<string>();
  for (const name of names) {
    const paths = MUSCLE_PATH_MAP[name as MuscleGroupFilter];
    if (!paths) continue;
    for (const pathId of paths) ids.add(pathId);
  }
  return ids;
}
