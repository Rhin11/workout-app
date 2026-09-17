import { colors } from '../constants/theme';

export interface PlateDef {
  weight: number;
  label: string;
  color: string;
  textColor: string;
}

export const LB_BAR = 45;
export const KG_BAR = 20;

/** Pound plates in IWF bumper colors (45 red … 1.25 silver). */
export const LB_PLATES: PlateDef[] = [
  { weight: 45, label: '45', color: colors.plateRed, textColor: colors.text },
  { weight: 35, label: '35', color: colors.plateBlue, textColor: colors.text },
  { weight: 25, label: '25', color: colors.plateYellow, textColor: '#1A1A1A' },
  { weight: 10, label: '10', color: colors.plateGreen, textColor: colors.text },
  { weight: 5, label: '5', color: colors.plateWhite, textColor: '#1A1A1A' },
  { weight: 2.5, label: '2.5', color: colors.plateBlack, textColor: colors.text },
  { weight: 1.25, label: '1.25', color: colors.plateSilver, textColor: '#1A1A1A' },
];

/** Kilogram IWF plates: 25 red, 20 blue, 15 yellow, 10 green, 5 white, 2.5 black, 1.25 silver. */
export const KG_PLATES: PlateDef[] = [
  { weight: 25, label: '25', color: colors.plateRed, textColor: colors.text },
  { weight: 20, label: '20', color: colors.plateBlue, textColor: colors.text },
  { weight: 15, label: '15', color: colors.plateYellow, textColor: '#1A1A1A' },
  { weight: 10, label: '10', color: colors.plateGreen, textColor: colors.text },
  { weight: 5, label: '5', color: colors.plateWhite, textColor: '#1A1A1A' },
  { weight: 2.5, label: '2.5', color: colors.plateBlack, textColor: colors.text },
  { weight: 1.25, label: '1.25', color: colors.plateSilver, textColor: '#1A1A1A' },
];

export function barWeight(unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? KG_BAR : LB_BAR;
}

export function platesForUnit(unit: 'lbs' | 'kg'): PlateDef[] {
  return unit === 'kg' ? KG_PLATES : LB_PLATES;
}

const tick = (n: number) => Math.round(n * 4);

/** Greedy load from the inside out (one side). Remainder is leftover that cannot be plated. */
export function loadPerSide(
  total: number,
  unit: 'lbs' | 'kg',
): { plates: PlateDef[]; remainder: number; bar: number } {
  const bar = barWeight(unit);
  const defs = platesForUnit(unit);
  if (total < bar) return { plates: [], remainder: Math.max(0, total), bar };

  let remaining = tick((total - bar) / 2);
  const plates: PlateDef[] = [];
  for (const def of defs) {
    const size = tick(def.weight);
    const count = Math.floor(remaining / size);
    for (let i = 0; i < count; i += 1) plates.push(def);
    remaining -= count * size;
  }
  return { plates, remainder: remaining / 4, bar };
}

export function loadedTotal(plates: PlateDef[], unit: 'lbs' | 'kg'): number {
  const side = plates.reduce((sum, p) => sum + p.weight, 0);
  return barWeight(unit) + side * 2;
}

/** Add one plate per side (or load the bar first if the current weight is below bar). */
export function addPlate(total: number, unit: 'lbs' | 'kg', plate: number): number {
  const bar = barWeight(unit);
  const base = total < bar ? bar : total;
  return roundWeight(base + plate * 2);
}

/** Remove one plate of this size from each side, never dropping below the bar. */
export function removePlate(total: number, unit: 'lbs' | 'kg', plate: number): number {
  const bar = barWeight(unit);
  const { plates } = loadPerSide(total, unit);
  const idx = plates.findIndex((p) => p.weight === plate);
  if (idx === -1) return total < bar ? total : Math.max(bar, total);
  const next = plates.filter((_, i) => i !== idx);
  return loadedTotal(next, unit);
}

export function roundWeight(n: number): number {
  return Math.round(n * 4) / 4;
}
