import type { MusclePath } from './types';

/** Back view — local space 160×300, center x=80 */
export const MALE_BACK_MUSCLES: MusclePath[] = [
  { id: 'b-trap-up', region: 'traps', d: 'M80 32 L64 42 L80 56 L96 42 Z' },
  { id: 'b-trap-mid', region: 'traps', d: 'M68 56 L92 56 L90 64 L70 64 Z' },
  { id: 'b-delt-l', region: 'shoulders-b', d: 'M68 40 L54 48 L50 62 L58 74 L68 70 L72 54 Z' },
  { id: 'b-delt-r', region: 'shoulders-b', d: 'M92 40 L106 48 L110 62 L102 74 L92 70 L88 54 Z' },
  { id: 'b-lat-up-l', region: 'back', d: 'M68 58 L58 70 L60 86 L70 94 L76 80 L74 64 Z' },
  { id: 'b-lat-up-r', region: 'back', d: 'M92 58 L102 70 L100 86 L90 94 L84 80 L86 64 Z' },
  { id: 'b-lat-lo-l', region: 'back', d: 'M60 92 L56 106 L62 118 L72 114 L74 98 Z' },
  { id: 'b-lat-lo-r', region: 'back', d: 'M100 92 L104 106 L98 118 L88 114 L86 98 Z' },
  { id: 'b-erector', region: 'lower-back', d: 'M74 92 L86 92 L84 128 L76 128 Z' },
  { id: 'b-er-l', region: 'lower-back', d: 'M72 100 L76 100 L75 120 L71 120 Z' },
  { id: 'b-er-r', region: 'lower-back', d: 'M84 100 L88 100 L87 120 L83 120 Z' },
  { id: 'b-tri-l', region: 'triceps', d: 'M50 62 L44 72 L42 90 L48 98 L56 94 L60 76 L56 64 Z' },
  { id: 'b-tri-r', region: 'triceps', d: 'M110 62 L116 72 L118 90 L112 98 L104 94 L100 76 L104 64 Z' },
  { id: 'b-fore-l', region: 'forearms-b', d: 'M44 98 L40 110 L38 130 L44 146 L52 144 L56 124 L54 100 Z' },
  { id: 'b-fore-r', region: 'forearms-b', d: 'M116 98 L120 110 L122 130 L116 146 L108 144 L104 124 L106 100 Z' },
  { id: 'b-glute-l', region: 'glutes', d: 'M66 132 L60 144 L64 160 L76 164 L80 152 L78 136 Z' },
  { id: 'b-glute-r', region: 'glutes', d: 'M94 132 L100 144 L96 160 L84 164 L80 152 L82 136 Z' },
  { id: 'b-ham-l', region: 'hamstrings', d: 'M60 164 L56 190 L60 224 L72 228 L78 200 L74 166 Z' },
  { id: 'b-ham-r', region: 'hamstrings', d: 'M100 164 L104 190 L100 224 L88 228 L82 200 L86 166 Z' },
  { id: 'b-ham-in-l', region: 'hamstrings', d: 'M72 168 L78 168 L76 214 L70 214 Z' },
  { id: 'b-ham-in-r', region: 'hamstrings', d: 'M88 168 L82 168 L84 214 L90 214 Z' },
  { id: 'b-calf-l', region: 'calves-b', d: 'M60 232 L56 256 L62 280 L72 284 L78 260 L74 234 Z' },
  { id: 'b-calf-r', region: 'calves-b', d: 'M100 232 L104 256 L98 280 L88 284 L82 260 L86 234 Z' },
];

export const MALE_BACK_BODY: MusclePath[] = [
  { id: 'b-head', region: 'traps', d: 'M80 8 C72 8 66 16 66 26 C66 32 72 38 80 38 C88 38 94 32 94 26 C94 16 88 8 80 8 Z' },
  { id: 'b-hand-l', region: 'forearms-b', d: 'M38 146 L34 154 L36 160 L44 158 L48 150 Z' },
  { id: 'b-hand-r', region: 'forearms-b', d: 'M122 146 L126 154 L124 160 L116 158 L112 150 Z' },
  { id: 'b-foot-l', region: 'calves-b', d: 'M64 284 L60 294 L66 302 L76 300 L78 286 Z' },
  { id: 'b-foot-r', region: 'calves-b', d: 'M96 284 L100 294 L94 302 L84 300 L82 286 Z' },
];

export const MALE_BACK_WIRE: string[] = [
  'M80 32 L80 128',
  'M68 56 L92 56',
  'M74 92 L86 92',
  'M72 100 L88 100',
  'M66 132 L94 132',
  'M60 164 L100 164',
  'M72 228 L88 228',
  'M80 152 L80 284',
];

export const MALE_BACK_FIBER: string[] = [];

export const MALE_BACK_OUTLINE = '';
