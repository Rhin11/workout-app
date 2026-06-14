export type MuscleRole = 'primary' | 'secondary' | 'stabilizer' | 'inactive';

export type ColorMode = 'byRole' | 'byMuscle';

export type ViewMode = 'front' | 'back' | 'front-back';

export type MuscleId =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
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
  | 'adductors';

export interface MuscleDiagramProps {
  exerciseName?: string;
  primaryMuscles?: MuscleId[];
  secondaryMuscles?: MuscleId[];
  stabilizerMuscles?: MuscleId[];
  instructions?: string;
  colorMode?: ColorMode;
  viewMode?: ViewMode;
  showLegend?: boolean;
  showInvolvedMuscles?: boolean;
  showTooltip?: boolean;
  showInstructions?: boolean;
  interactive?: boolean;
  defaultHighlight?: boolean;
  initialActiveMuscle?: MuscleId | null;
  className?: string;
}

export interface MuscleInfo {
  id: MuscleId;
  label: string;
  shortLabel?: string;
  category: string;
  description: string;
}

export type BodyView = 'front' | 'back';

export interface MuscleAnchor {
  view: BodyView;
  x: number;
  y: number;
}

export interface TooltipState {
  muscleId: MuscleId;
  role: MuscleRole;
  label: string;
  description: string;
  anchor: MuscleAnchor;
}

export interface BodySvgProps {
  activeMuscle: MuscleId | null;
  hoveredRole: MuscleRole | null;
  selectedMuscle: MuscleId | null;
  getMuscleFill: (muscleId: MuscleId) => string;
  getMuscleStroke: (muscleId: MuscleId) => string;
  getMuscleOpacity: (muscleId: MuscleId) => number;
  getMuscleRole: (muscleId: MuscleId) => MuscleRole;
  isMuscleHighlighted: (muscleId: MuscleId) => boolean;
  interactive: boolean;
  onMuscleEnter: (muscleId: MuscleId) => void;
  onMuscleLeave: () => void;
  onMuscleClick: (muscleId: MuscleId) => void;
  onMuscleFocus: (muscleId: MuscleId) => void;
  onMuscleBlur: () => void;
}

export const ALL_MUSCLE_IDS: MuscleId[] = [
  'chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'traps',
  'lats',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lower_back',
  'glutes',
  'quadriceps',
  'hamstrings',
  'calves',
  'adductors',
];
