import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Analysis } from '../utils/barbellAnalysis';

export interface BarbellSession {
  id: string;
  createdAt: string;
  /** Data-URL JPEG/PNG snapshot of the lift's first frame. */
  thumbnail: string;
  analysis: Analysis;
  /** Tagged lift (a name from the exercise library). Absent on legacy sessions. */
  exerciseName?: string;
  /** Session date, `YYYY-MM-DD`. Defaults to today; falls back to `createdAt` for display. */
  date?: string;
  /** Optional load context for comparing analyses over time. */
  weight?: number;
  weightUnit?: 'lbs' | 'kg';
}

export type SessionTagPatch = Partial<
  Pick<BarbellSession, 'exerciseName' | 'date' | 'weight' | 'weightUnit'>
>;

interface BarbellState {
  sessions: BarbellSession[];
  addSession: (session: Omit<BarbellSession, 'id' | 'createdAt'>) => BarbellSession;
  updateSession: (id: string, patch: SessionTagPatch) => void;
  removeSession: (id: string) => void;
}

const uid = () => crypto.randomUUID();

export const useBarbellStore = create<BarbellState>()(
  persist(
    (set) => ({
      sessions: [],

      addSession: (session) => {
        const full: BarbellSession = {
          ...session,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sessions: [full, ...state.sessions] }));
        return full;
      },

      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    }),
    { name: 'forge-barbell' },
  ),
);
