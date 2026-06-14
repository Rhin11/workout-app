import type { MuscleId, MuscleRole } from './types';

export const roleColors: Record<MuscleRole, string> = {
  primary: '#6366F1',
  secondary: '#F59E0B',
  stabilizer: '#10B981',
  inactive: '#F8FAFC',
};

export const muscleColors: Record<MuscleId, string> = {
  chest: '#EF4444',
  front_delts: '#F97316',
  side_delts: '#F59E0B',
  rear_delts: '#A855F7',
  traps: '#6366F1',
  lats: '#06B6D4',
  biceps: '#8B5CF6',
  triceps: '#3B82F6',
  forearms: '#14B8A6',
  abs: '#F59E0B',
  obliques: '#84CC16',
  lower_back: '#F59E0B',
  glutes: '#6366F1',
  quadriceps: '#6366F1',
  hamstrings: '#F59E0B',
  calves: '#10B981',
  adductors: '#10B981',
};

export const MUSCLE_FILL_DEFAULT = '#ffffff';
export const MUSCLE_STROKE = '#111827';
export const MUSCLE_STROKE_ACTIVE = '#0f172a';
export const DIAGRAM_BG = '#FFFFFF';

export function getSoftColor(hex: string, mix = 0.72): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * mix);
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}

export function darkenColor(hex: string, amount = 0.15): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darken = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
}
