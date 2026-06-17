import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Units = 'lbs' | 'kg';

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
  setDisplayName: (name: string) => void;
  setPhoto: (dataUrl: string | null) => void;
  setUnits: (units: Units) => void;
  addBodyweight: (date: string, weight: number) => void;
  removeBodyweight: (id: string) => void;
}

const uid = () => crypto.randomUUID();

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      displayName: '',
      photoDataUrl: null,
      units: 'lbs',
      bodyweights: [],

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
    }),
    { name: 'forge-profile' },
  ),
);
