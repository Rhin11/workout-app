/**
 * Muscle diagram SVG integration guide
 * =====================================
 *
 * Workflow:
 *   1. Commission or license professional front/back anatomy line art.
 *   2. In Figma / Illustrator, name each muscle layer group to match MuscleId.
 *   3. Export as SVG with no embedded fill colors (or set fills to #ffffff).
 *   4. Paste path elements into the matching <g data-muscle="..."> in FrontBodySvg
 *      or BackBodySvg, OR replace src/assets/anatomy/anatomy-front.svg and
 *      anatomy-back.svg then copy groups into the React wrappers.
 *   5. Update muscleAnchors.ts with anchor points on the real artwork.
 *
 * Rules:
 *   - Do NOT hand-draw placeholder anatomy paths in this codebase.
 *   - Bilateral muscles: left + right paths in ONE data-muscle group.
 *   - Remove hardcoded fill/stroke from imported paths; React supplies styles.
 *   - Static layers (head, neck, hands, feet, outer contour, fascia) are
 *     non-interactive and use CSS classes staticLayer / fasciaLine.
 *   - Internal detail lines: className={styles.fasciaLine}, fill="none".
 */

import type { MuscleId } from './types';

/** Front-view interactive muscle groups (paste paths under each id). */
export const FRONT_INTERACTIVE_MUSCLES: MuscleId[] = [
  'chest',
  'front_delts',
  'side_delts',
  'biceps',
  'forearms',
  'abs',
  'obliques',
  'quadriceps',
  'adductors',
  'calves',
];

/** Back-view interactive muscle groups (paste paths under each id). */
export const BACK_INTERACTIVE_MUSCLES: MuscleId[] = [
  'traps',
  'rear_delts',
  'side_delts',
  'triceps',
  'forearms',
  'lats',
  'lower_back',
  'glutes',
  'hamstrings',
  'calves',
];

/** Expected asset files — replace with licensed artwork. */
export const ANATOMY_ASSET_PATHS = {
  front: 'src/assets/anatomy/anatomy-front.svg',
  back: 'src/assets/anatomy/anatomy-back.svg',
} as const;

/**
 * Per-muscle grouping requirements for SVG export.
 * Group names in the design file should match data-muscle values.
 */
export const musclePathRequirements: Record<MuscleId, string> = {
  chest:
    "Group left and right pectoral paths under data-muscle='chest'. Include upper/lower pec separations as fascia lines, not separate interactive groups.",
  front_delts:
    "Group anterior deltoid paths (both sides) under data-muscle='front_delts'.",
  side_delts:
    "Group lateral deltoid paths (both sides). Appears on front and back views — duplicate group in each SVG.",
  rear_delts:
    "Group posterior deltoid paths (both sides) under data-muscle='rear_delts'.",
  traps:
    "Group upper trapezius paths (both sides) under data-muscle='traps'. Back view only.",
  lats:
    "Group latissimus dorsi paths (both sides) under data-muscle='lats'.",
  biceps:
    "Group biceps brachii paths (both sides) under data-muscle='biceps'. Front view.",
  triceps:
    "Group triceps paths (both sides) under data-muscle='triceps'. Back view.",
  forearms:
    "Group forearm flexor/extensor regions (both sides) under data-muscle='forearms'.",
  abs:
    "Group rectus abdominis segments (both sides of midline) under data-muscle='abs'.",
  obliques:
    "Group external oblique paths (both sides) under data-muscle='obliques'.",
  lower_back:
    "Group erector spinae / lower back paths under data-muscle='lower_back'.",
  glutes:
    "Group gluteus maximus paths (both sides) under data-muscle='glutes'.",
  quadriceps:
    "Group all front-thigh quad paths (rectus femoris, vastus lateralis/medialis) under data-muscle='quadriceps'.",
  hamstrings:
    "Group posterior thigh paths (both sides) under data-muscle='hamstrings'.",
  calves:
    "Group calf / lower-leg paths for the relevant view under data-muscle='calves'.",
  adductors:
    "Group inner-thigh adductor paths (both sides) under data-muscle='adductors'. Front view.",
};
