import type { MusclePath } from './types';

/**
 * Front view — local space 160×300, center x=80.
 * Symmetric, shared edges between adjacent muscles to avoid gaps.
 */
export const MALE_FRONT_MUSCLES: MusclePath[] = [
  { id: 'f-trap-l', region: 'traps', d: 'M72 38 L68 46 L70 52 L76 50 Z' },
  { id: 'f-trap-r', region: 'traps', d: 'M88 38 L92 46 L90 52 L84 50 Z' },
  { id: 'f-delt-l', region: 'shoulders-f', d: 'M68 40 L54 48 L50 62 L58 74 L68 70 L72 54 Z' },
  { id: 'f-delt-r', region: 'shoulders-f', d: 'M92 40 L106 48 L110 62 L102 74 L92 70 L88 54 Z' },
  { id: 'f-pec-up-l', region: 'chest', d: 'M80 40 L64 44 L60 58 L68 72 L78 70 L80 54 Z' },
  { id: 'f-pec-up-r', region: 'chest', d: 'M80 40 L96 44 L100 58 L92 72 L82 70 L80 54 Z' },
  { id: 'f-pec-lo-l', region: 'chest', d: 'M78 70 L70 74 L68 84 L74 90 L80 86 L80 70 Z' },
  { id: 'f-pec-lo-r', region: 'chest', d: 'M82 70 L90 74 L92 84 L86 90 L80 86 L80 70 Z' },
  { id: 'f-abs-1l', region: 'abs', d: 'M74 94 L80 94 L80 102 L74 102 Z' },
  { id: 'f-abs-1r', region: 'abs', d: 'M80 94 L86 94 L86 102 L80 102 Z' },
  { id: 'f-abs-2l', region: 'abs', d: 'M74 104 L80 104 L80 112 L74 112 Z' },
  { id: 'f-abs-2r', region: 'abs', d: 'M80 104 L86 104 L86 112 L80 112 Z' },
  { id: 'f-abs-3l', region: 'abs', d: 'M74 114 L80 114 L80 122 L74 122 Z' },
  { id: 'f-abs-3r', region: 'abs', d: 'M80 114 L86 114 L86 122 L80 122 Z' },
  { id: 'f-obl-l', region: 'abs', d: 'M64 96 L58 108 L56 122 L64 126 L70 114 L68 98 Z' },
  { id: 'f-obl-r', region: 'abs', d: 'M96 96 L102 108 L104 122 L96 126 L90 114 L92 98 Z' },
  { id: 'f-bicep-l', region: 'biceps', d: 'M52 62 L46 72 L44 90 L52 98 L60 94 L64 76 L60 64 Z' },
  { id: 'f-bicep-r', region: 'biceps', d: 'M108 62 L114 72 L116 90 L108 98 L100 94 L96 76 L100 64 Z' },
  { id: 'f-fore-l', region: 'forearms-f', d: 'M46 98 L42 110 L40 130 L46 146 L54 144 L58 124 L56 100 Z' },
  { id: 'f-fore-r', region: 'forearms-f', d: 'M114 98 L118 110 L120 130 L114 146 L106 144 L102 124 L104 100 Z' },
  { id: 'f-quad-l', region: 'quads', d: 'M72 126 L62 134 L60 174 L66 210 L76 216 L80 178 L78 130 Z' },
  { id: 'f-quad-r', region: 'quads', d: 'M88 126 L98 134 L100 174 L94 210 L84 216 L80 178 L82 130 Z' },
  { id: 'f-rect-fem', region: 'quads', d: 'M76 128 L84 128 L82 208 L78 208 Z' },
  { id: 'f-vast-med-l', region: 'quads', d: 'M66 168 L62 196 L68 208 L72 178 Z' },
  { id: 'f-vast-med-r', region: 'quads', d: 'M94 168 L98 196 L92 208 L88 178 Z' },
  { id: 'f-shin-l', region: 'calves-f', d: 'M66 216 L64 240 L68 270 L76 278 L80 254 L78 220 Z' },
  { id: 'f-shin-r', region: 'calves-f', d: 'M94 216 L96 240 L92 270 L84 278 L80 254 L82 220 Z' },
];

export const MALE_FRONT_BODY: MusclePath[] = [
  { id: 'f-head', region: 'traps', d: 'M80 8 C72 8 66 16 66 26 C66 32 72 38 80 38 C88 38 94 32 94 26 C94 16 88 8 80 8 Z' },
  { id: 'f-hand-l', region: 'forearms-f', d: 'M40 146 L36 154 L38 160 L46 158 L50 150 Z' },
  { id: 'f-hand-r', region: 'forearms-f', d: 'M120 146 L124 154 L122 160 L114 158 L110 150 Z' },
  { id: 'f-foot-l', region: 'calves-f', d: 'M68 278 L64 288 L70 296 L80 294 L82 282 Z' },
  { id: 'f-foot-r', region: 'calves-f', d: 'M92 278 L96 288 L90 296 L80 294 L78 282 Z' },
];

/** Internal fascia only — no duplicate outer contour */
export const MALE_FRONT_WIRE: string[] = [
  'M80 40 L80 122',
  'M60 58 L100 58',
  'M80 54 L68 72',
  'M80 54 L92 72',
  'M74 94 L86 94',
  'M74 104 L86 104',
  'M74 114 L86 114',
  'M62 134 L98 134',
  'M66 210 L94 210',
  'M80 216 L80 278',
];

export const MALE_FRONT_FIBER: string[] = [];

export const MALE_FRONT_OUTLINE = '';
