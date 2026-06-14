/** Vendored from https://github.com/Jsplice/MuscleMap (MIT) — see LICENSE-MuscleMap */

export type MuscleGroup =
  | 'CHEST'
  | 'BACK_UPPER'
  | 'BACK_LOWER'
  | 'TRAPEZIUS'
  | 'RHOMBOIDS'
  | 'LATS'
  | 'SHOULDERS_FRONT'
  | 'SHOULDERS_SIDE'
  | 'SHOULDERS_REAR'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'CORE'
  | 'OBLIQUES'
  | 'GLUTES'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'CALVES'
  | 'HIP_FLEXORS'
  | 'ADDUCTORS'
  | 'ABDUCTORS';

export type BodySide = 'LEFT' | 'RIGHT' | 'CENTER';

export type MusclePath = {
  group: MuscleGroup;
  side: Extract<BodySide, 'LEFT' | 'CENTER'>;
  d: string;
  id?: string;
};

export type OutlinePath = {
  id: string;
  side: Extract<BodySide, 'LEFT' | 'CENTER'>;
  d: string;
};

export type BodyView = 'FRONT' | 'BACK';

export type BodyDiagram = {
  id: string;
  sex?: 'MALE' | 'FEMALE';
  view: BodyView;
  viewBox: string;
  centerX: number;
  regionBox?: Record<string, string>;
  outline: OutlinePath[];
  muscles: MusclePath[];
};
