import { create } from 'zustand';

/**
 * Transient (non-persisted) state for the single global rest timer.
 *
 * The countdown is driven off an absolute `endsAt` timestamp rather than a
 * decrementing counter, so it stays accurate even when the tab is backgrounded
 * and `setInterval` is throttled. `tick()` recomputes `remainingSeconds` from
 * the timestamp; the UI calls it on an interval and on visibility changes.
 */
interface RestTimerState {
  activeExerciseId: string | null;
  exerciseName: string;
  totalSeconds: number;
  remainingSeconds: number;
  /** Epoch ms when the timer reaches zero; null while paused or finished. */
  endsAt: number | null;
  paused: boolean;
  finished: boolean;

  start: (exerciseId: string, exerciseName: string, seconds: number) => void;
  tick: () => void;
  adjust: (delta: number) => void;
  togglePause: () => void;
  dismiss: () => void;
}

const cleared = {
  activeExerciseId: null,
  exerciseName: '',
  totalSeconds: 0,
  remainingSeconds: 0,
  endsAt: null,
  paused: false,
  finished: false,
} as const;

export const useRestTimer = create<RestTimerState>((set, get) => ({
  ...cleared,

  start: (exerciseId, exerciseName, seconds) => {
    if (seconds <= 0) return;
    set({
      activeExerciseId: exerciseId,
      exerciseName,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      paused: false,
      finished: false,
    });
  },

  tick: () => {
    const { activeExerciseId, paused, finished, endsAt } = get();
    if (activeExerciseId === null || paused || finished || endsAt === null) return;
    const remainingMs = endsAt - Date.now();
    if (remainingMs <= 0) {
      set({ remainingSeconds: 0, finished: true, endsAt: null });
    } else {
      set({ remainingSeconds: Math.ceil(remainingMs / 1000) });
    }
  },

  adjust: (delta) => {
    const { activeExerciseId, paused, remainingSeconds, totalSeconds, endsAt } = get();
    if (activeExerciseId === null) return;
    const current = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : remainingSeconds;
    const newRemaining = Math.max(0, current + delta);
    const newTotal = Math.max(totalSeconds, newRemaining);
    if (newRemaining === 0) {
      set({ remainingSeconds: 0, totalSeconds: newTotal, finished: true, endsAt: null });
      return;
    }
    set({
      remainingSeconds: newRemaining,
      totalSeconds: newTotal,
      finished: false,
      endsAt: paused ? null : Date.now() + newRemaining * 1000,
    });
  },

  togglePause: () => {
    const { activeExerciseId, paused, finished, remainingSeconds, endsAt } = get();
    if (activeExerciseId === null || finished) return;
    if (paused) {
      set({ paused: false, endsAt: Date.now() + remainingSeconds * 1000 });
    } else {
      const remaining = endsAt
        ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
        : remainingSeconds;
      set({ paused: true, endsAt: null, remainingSeconds: remaining });
    }
  },

  dismiss: () => set({ ...cleared }),
}));
