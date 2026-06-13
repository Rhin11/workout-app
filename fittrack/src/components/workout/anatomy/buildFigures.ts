import { MALE_BACK_BODY, MALE_BACK_FIBER, MALE_BACK_MUSCLES, MALE_BACK_OUTLINE, MALE_BACK_WIRE } from './maleBack';
import {
  MALE_FRONT_BODY,
  MALE_FRONT_FIBER,
  MALE_FRONT_MUSCLES,
  MALE_FRONT_OUTLINE,
  MALE_FRONT_WIRE,
} from './maleFront';
import type { FigureTemplate } from './types';

export const FIGURES: FigureTemplate[] = [
  {
    key: 'back',
    translate: [28, 14],
    muscles: MALE_BACK_MUSCLES,
    bodyParts: MALE_BACK_BODY,
    wireLines: MALE_BACK_WIRE,
    fiberLines: MALE_BACK_FIBER,
    outline: MALE_BACK_OUTLINE,
  },
  {
    key: 'front',
    translate: [208, 14],
    muscles: MALE_FRONT_MUSCLES,
    bodyParts: MALE_FRONT_BODY,
    wireLines: MALE_FRONT_WIRE,
    fiberLines: MALE_FRONT_FIBER,
    outline: MALE_FRONT_OUTLINE,
  },
];

export const ALL_MUSCLES = FIGURES.flatMap((f) => f.muscles);

export const FIGURE_W = 396;
export const FIGURE_H = 300;

export const COLORS = {
  bg: '#fafafa',
  line: '#8a3232',
  bodyFill: '#ddd8dc',
  muscleFill: '#c44e4e',
  muscleStroke: '#8a3232',
  fascia: '#f7f4f4',
  activeFill: '#6366f1',
  activeStroke: '#4338ca',
  activeBright: '#818cf8',
} as const;
