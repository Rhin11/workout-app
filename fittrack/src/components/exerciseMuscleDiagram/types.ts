export type MuscleRegionId =
  | 'chest'
  | 'front_delts'
  | 'rear_delts'
  | 'traps'
  | 'lats'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'glutes'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'adductors'
  | 'abductors';

export type MuscleRole = 'primary' | 'secondary' | 'inactive';

export interface ExerciseMuscleDiagramProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  className?: string;
}
