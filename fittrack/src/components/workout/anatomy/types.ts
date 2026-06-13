export type RegionId =
  | 'chest'
  | 'abs'
  | 'shoulders-f'
  | 'biceps'
  | 'forearms-f'
  | 'quads'
  | 'calves-f'
  | 'traps'
  | 'back'
  | 'shoulders-b'
  | 'triceps'
  | 'forearms-b'
  | 'glutes'
  | 'hamstrings'
  | 'calves-b'
  | 'lower-back';

export type FigureKey = 'front' | 'back';

export interface MusclePath {
  id: string;
  region: RegionId;
  d: string;
}

export interface FigureTemplate {
  key: FigureKey;
  translate: [number, number];
  muscles: MusclePath[];
  bodyParts: MusclePath[];
  /** White fascia / tendon separation lines */
  wireLines: string[];
  /** Dark red interior fiber lines */
  fiberLines: string[];
  /** Outer body contour */
  outline: string;
}
