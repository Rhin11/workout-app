import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Analysis } from '../utils/barbellAnalysis';

export interface BarbellSession {
  id: string;
  createdAt: string;
  /** Data-URL JPEG/PNG snapshot of the lift's first frame. */
  thumbnail: string;
  analysis: Analysis;
}

interface BarbellState {
  sessions: BarbellSession[];
  addSession: (session: Omit<BarbellSession, 'id' | 'createdAt'>) => BarbellSession;
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

      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
    }),
    { name: 'forge-barbell' },
  ),
);
