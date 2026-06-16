import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PhaseType = 'work' | 'rest';

export interface Phase {
  id: string;
  name: string;
  durationSec: number;
  type: PhaseType;
}

export interface Circuit {
  id: string;
  name: string;
  phases: Phase[];
  rounds: number;
}

export const MIN_PHASE_SECONDS = 5;
export const PHASE_STEP = 5;
export const MIN_ROUNDS = 1;

interface Draft {
  phases: Phase[];
  rounds: number;
}

interface ConditioningState {
  draft: Draft;
  savedCircuits: Circuit[];
  /** When set, save updates this circuit instead of creating a new one. */
  editingCircuitId: string | null;
  addPhase: () => void;
  updatePhase: (id: string, patch: Partial<Omit<Phase, 'id'>>) => void;
  removePhase: (id: string) => void;
  movePhase: (id: string, direction: 'up' | 'down') => void;
  setRounds: (rounds: number) => void;
  resetDraft: () => void;
  saveCircuit: (name: string) => void;
  loadCircuit: (id: string) => void;
  startEditCircuit: (id: string) => void;
  cancelEdit: () => void;
  deleteCircuit: (id: string) => void;
}

const uid = () => crypto.randomUUID();

function newPhase(): Phase {
  return { id: uid(), name: 'Work', durationSec: 30, type: 'work' };
}

const emptyDraft = (): Draft => ({ phases: [], rounds: MIN_ROUNDS });

export const useConditioningStore = create<ConditioningState>()(
  persist(
    (set, get) => ({
      draft: emptyDraft(),
      savedCircuits: [],
      editingCircuitId: null,

      addPhase: () =>
        set((state) => ({ draft: { ...state.draft, phases: [...state.draft.phases, newPhase()] } })),

      updatePhase: (id, patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            phases: state.draft.phases.map((p) =>
              p.id === id
                ? {
                    ...p,
                    ...patch,
                    durationSec:
                      patch.durationSec != null
                        ? Math.max(MIN_PHASE_SECONDS, Math.round(patch.durationSec))
                        : p.durationSec,
                  }
                : p,
            ),
          },
        })),

      removePhase: (id) =>
        set((state) => ({
          draft: { ...state.draft, phases: state.draft.phases.filter((p) => p.id !== id) },
        })),

      movePhase: (id, direction) =>
        set((state) => {
          const phases = [...state.draft.phases];
          const i = phases.findIndex((p) => p.id === id);
          if (i === -1) return state;
          const j = direction === 'up' ? i - 1 : i + 1;
          if (j < 0 || j >= phases.length) return state;
          [phases[i], phases[j]] = [phases[j], phases[i]];
          return { draft: { ...state.draft, phases } };
        }),

      setRounds: (rounds) =>
        set((state) => ({
          draft: { ...state.draft, rounds: Math.max(MIN_ROUNDS, Math.round(rounds) || MIN_ROUNDS) },
        })),

      resetDraft: () => set({ draft: emptyDraft() }),

      saveCircuit: (name) => {
        const trimmed = name.trim();
        const { draft, editingCircuitId } = get();
        if (!trimmed || draft.phases.length === 0) return;

        if (editingCircuitId) {
          set((state) => ({
            editingCircuitId: null,
            savedCircuits: state.savedCircuits.map((c) =>
              c.id === editingCircuitId
                ? {
                    ...c,
                    name: trimmed,
                    phases: draft.phases.map((p) => ({ ...p })),
                    rounds: draft.rounds,
                  }
                : c,
            ),
          }));
          return;
        }

        const circuit: Circuit = {
          id: uid(),
          name: trimmed,
          phases: draft.phases.map((p) => ({ ...p })),
          rounds: draft.rounds,
        };
        set((state) => ({ savedCircuits: [circuit, ...state.savedCircuits] }));
      },

      loadCircuit: (id) => {
        const circuit = get().savedCircuits.find((c) => c.id === id);
        if (!circuit) return;
        set({
          editingCircuitId: null,
          draft: {
            rounds: circuit.rounds,
            phases: circuit.phases.map((p) => ({ ...p, id: uid() })),
          },
        });
      },

      startEditCircuit: (id) => {
        const circuit = get().savedCircuits.find((c) => c.id === id);
        if (!circuit) return;
        set({
          editingCircuitId: id,
          draft: {
            rounds: circuit.rounds,
            phases: circuit.phases.map((p) => ({ ...p })),
          },
        });
      },

      cancelEdit: () => set({ editingCircuitId: null, draft: emptyDraft() }),

      deleteCircuit: (id) =>
        set((state) => ({
          editingCircuitId: state.editingCircuitId === id ? null : state.editingCircuitId,
          savedCircuits: state.savedCircuits.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'forge-conditioning',
      partialize: (state) => ({
        draft: state.draft,
        savedCircuits: state.savedCircuits,
      }),
    },
  ),
);
