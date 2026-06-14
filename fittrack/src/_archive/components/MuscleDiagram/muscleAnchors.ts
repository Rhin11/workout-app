import type { MuscleAnchor, MuscleId } from './types';
import { RBH_ANCHORS, rbhToCanvas } from './anatomy/bodyHighlighterPaths';

/** Full diagram canvas (front + back side by side). */
export const FIGURE_W = 800;
export const FIGURE_H = 700;

/** Local viewBox for each figure after RBH scale (100×220 → ~286×629). */
export const ANATOMY_VIEWBOX = {
  front: { width: 286, height: 630 },
  back: { width: 286, height: 630 },
} as const;

/** Position each figure on the white canvas. */
export const FIGURE_TRANSFORMS = {
  front: { x: 50, y: 35 },
  back: { x: 464, y: 35 },
} as const;

export const muscleAnchors: Record<MuscleId, MuscleAnchor> = Object.fromEntries(
  (Object.entries(RBH_ANCHORS) as [MuscleId, (typeof RBH_ANCHORS)[MuscleId]][]).map(
    ([id, { view, x, y }]) => [
      id,
      { view, ...rbhToCanvas(view, x, y, FIGURE_TRANSFORMS[view]) },
    ],
  ),
) as Record<MuscleId, MuscleAnchor>;
