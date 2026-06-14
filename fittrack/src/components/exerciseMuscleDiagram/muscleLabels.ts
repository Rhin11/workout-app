import type { MuscleGroup } from './assets/muscleMapTypes';

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Chest',
  BACK_UPPER: 'Upper Back',
  BACK_LOWER: 'Lower Back',
  TRAPEZIUS: 'Traps',
  RHOMBOIDS: 'Rhomboids',
  LATS: 'Lats',
  SHOULDERS_FRONT: 'Front Delts',
  SHOULDERS_SIDE: 'Side Delts',
  SHOULDERS_REAR: 'Rear Delts',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  CORE: 'Abs',
  OBLIQUES: 'Obliques',
  GLUTES: 'Glutes',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  CALVES: 'Calves',
  HIP_FLEXORS: 'Hip Flexors',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
};

export function getMuscleGroupLabel(group: MuscleGroup): string {
  return MUSCLE_GROUP_LABELS[group];
}
