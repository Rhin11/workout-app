import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Nutrition } from '../constants/nutrition';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  water: number;
}

export type FoodEntry = {
  id: string;
  meal: MealType;
  foodName: string;
  servingGrams: number;
} & Nutrition;

export type WaterEntry = {
  id: string;
  amountOz: number;
};

const ML_PER_OZ = 29.5735;

function migrateWaterEntry(entry: Record<string, unknown>): WaterEntry {
  if (typeof entry.amountOz === 'number') {
    return { id: String(entry.id), amountOz: entry.amountOz };
  }
  const ml = typeof entry.amountMl === 'number' ? entry.amountMl : 0;
  return { id: String(entry.id), amountOz: ml / ML_PER_OZ };
}

function migrateWaterGoal(water: number | undefined): number {
  if (water == null) return 64;
  if (water > 150) return Math.round((water / ML_PER_OZ) * 10) / 10;
  return water;
}

function migrateWaterByDate(
  waterByDate: Record<string, unknown[]> | undefined,
): Record<string, WaterEntry[]> {
  if (!waterByDate) return {};
  return Object.fromEntries(
    Object.entries(waterByDate).map(([date, entries]) => [
      date,
      entries.map((entry) => migrateWaterEntry(entry as Record<string, unknown>)),
    ]),
  );
}

interface MacroState {
  goals: MacroGoals;
  entriesByDate: Record<string, FoodEntry[]>;
  waterByDate: Record<string, WaterEntry[]>;
  setGoals: (goals: MacroGoals) => void;
  addEntry: (date: string, entry: Omit<FoodEntry, 'id'> & { id?: string }) => void;
  removeEntry: (date: string, id: string) => void;
  addWater: (date: string, amountOz: number) => void;
  removeWater: (date: string, id: string) => void;
  getDayEntries: (date: string) => FoodEntry[];
  getDayWaterOz: (date: string) => number;
}

const uid = () => crypto.randomUUID();

const defaultGoals: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  sodium: 2300,
  water: 64,
};

export const useMacroStore = create<MacroState>()(
  persist(
    (set, get) => ({
      goals: defaultGoals,
      entriesByDate: {},
      waterByDate: {},

      setGoals: (goals) => set({ goals }),

      addEntry: (date, entry) =>
        set((state) => {
          const dayEntries = state.entriesByDate[date] ?? [];
          const newEntry: FoodEntry = { ...entry, id: entry.id ?? uid() };
          return {
            entriesByDate: {
              ...state.entriesByDate,
              [date]: [...dayEntries, newEntry],
            },
          };
        }),

      removeEntry: (date, id) =>
        set((state) => ({
          entriesByDate: {
            ...state.entriesByDate,
            [date]: (state.entriesByDate[date] ?? []).filter((e) => e.id !== id),
          },
        })),

      addWater: (date, amountOz) =>
        set((state) => {
          const entries = state.waterByDate[date] ?? [];
          const entry: WaterEntry = { id: uid(), amountOz };
          return {
            waterByDate: {
              ...state.waterByDate,
              [date]: [...entries, entry],
            },
          };
        }),

      removeWater: (date, id) =>
        set((state) => ({
          waterByDate: {
            ...state.waterByDate,
            [date]: (state.waterByDate[date] ?? []).filter((e) => e.id !== id),
          },
        })),

      getDayEntries: (date) => get().entriesByDate[date] ?? [],

      getDayWaterOz: (date) =>
        (get().waterByDate[date] ?? []).reduce((sum, e) => sum + e.amountOz, 0),
    }),
    { name: 'forge-macros',
      merge: (persisted, current) => {
        const saved = persisted as Partial<MacroState> | undefined;
        return {
          ...current,
          ...saved,
          goals: {
            ...defaultGoals,
            ...saved?.goals,
            water: migrateWaterGoal(saved?.goals?.water ?? defaultGoals.water),
          },
          entriesByDate: saved?.entriesByDate ?? current.entriesByDate,
          waterByDate: migrateWaterByDate(
            saved?.waterByDate as Record<string, unknown[]> | undefined,
          ),
        };
      },
    },
  ),
);
