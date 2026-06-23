import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Units = 'lbs' | 'kg';

/** Default "main lifts" featured at the top of Personal Records (user-editable). */
export const DEFAULT_MAIN_LIFTS = ['Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

export interface BodyweightEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  weight: number;
  unit: Units;
}

interface ProfileState {
  displayName: string;
  photoDataUrl: string | null;
  units: Units;
  bodyweights: BodyweightEntry[];
  /** Exercise names featured at the top of Personal Records. */
  mainLifts: string[];
  setDisplayName: (name: string) => void;
  setPhoto: (dataUrl: string | null) => void;
  setUnits: (units: Units) => void;
  addBodyweight: (date: string, weight: number) => void;
  removeBodyweight: (id: string) => void;
  setMainLifts: (lifts: string[]) => void;
}

const uid = () => crypto.randomUUID();

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      displayName: '',
      photoDataUrl: null,
      units: 'lbs',
      bodyweights: [],
      mainLifts: DEFAULT_MAIN_LIFTS,

      setDisplayName: (name) => set({ displayName: name }),
      setPhoto: (dataUrl) => set({ photoDataUrl: dataUrl }),
      setUnits: (units) => set({ units }),

      addBodyweight: (date, weight) => {
        if (!date || !(weight > 0)) return;
        const entry: BodyweightEntry = { id: uid(), date, weight, unit: get().units };
        // Keep one entry per date (latest wins), sorted ascending by date.
        const rest = get().bodyweights.filter((b) => b.date !== date);
        set({ bodyweights: [...rest, entry].sort((a, b) => a.date.localeCompare(b.date)) });
      },

      removeBodyweight: (id) =>
        set({ bodyweights: get().bodyweights.filter((b) => b.id !== id) }),

      setMainLifts: (lifts) => {
        // Dedupe case-insensitively, preserve order, drop blanks.
        const seen = new Set<string>();
        const cleaned: string[] = [];
        for (const lift of lifts) {
          const name = lift.trim();
          const key = name.toLowerCase();
          if (!name || seen.has(key)) continue;
          seen.add(key);
          cleaned.push(name);
        }
        set({ mainLifts: cleaned });
      },
    }),
    { name: 'forge-profile' },
  ),
);
