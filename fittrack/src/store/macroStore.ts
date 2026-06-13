import { create } from 'zustand';

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroState {
  goals: MacroGoals;
  setGoals: (goals: MacroGoals) => void;
}

export const useMacroStore = create<MacroState>((set) => ({
  goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  setGoals: (goals) => set({ goals }),
}));
