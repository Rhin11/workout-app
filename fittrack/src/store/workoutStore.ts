import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  unit: 'lbs' | 'kg';
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
  finishedAt: string | null;
}

interface WorkoutState {
  workouts: Workout[];
  activeWorkoutId: string | null;
  startWorkout: (name?: string) => void;
  finishWorkout: () => void;
  editWorkout: (id: string) => void;
  renameWorkout: (id: string, name: string) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (name: string) => void;
  removeExercise: (exerciseId: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'unit' | 'completed'>>,
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
}

const uid = () => crypto.randomUUID();

function defaultSet(previous?: WorkoutSet): WorkoutSet {
  return {
    id: uid(),
    reps: previous?.reps ?? 0,
    weight: previous?.weight ?? 0,
    unit: previous?.unit ?? 'lbs',
    completed: false,
  };
}

function updateActiveWorkout(
  workouts: Workout[],
  activeWorkoutId: string | null,
  updater: (workout: Workout) => Workout,
): Workout[] {
  if (!activeWorkoutId) return workouts;
  return workouts.map((w) => (w.id === activeWorkoutId ? updater(w) : w));
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: [],
      activeWorkoutId: null,

      startWorkout: (name) => {
        const workout: Workout = {
          id: uid(),
          name: name?.trim() || 'Workout',
          date: new Date().toISOString(),
          exercises: [],
          finishedAt: null,
        };
        set({
          workouts: [workout, ...get().workouts],
          activeWorkoutId: workout.id,
        });
      },

      finishWorkout: () => {
        const { activeWorkoutId, workouts } = get();
        if (!activeWorkoutId) return;
        set({
          activeWorkoutId: null,
          workouts: workouts.map((w) =>
            w.id === activeWorkoutId ? { ...w, finishedAt: new Date().toISOString() } : w,
          ),
        });
      },

      editWorkout: (id) => {
        const workout = get().workouts.find((w) => w.id === id);
        if (!workout || get().activeWorkoutId) return;
        set({
          activeWorkoutId: id,
          workouts: get().workouts.map((w) =>
            w.id === id ? { ...w, finishedAt: null } : w,
          ),
        });
      },

      renameWorkout: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({
          workouts: get().workouts.map((w) => (w.id === id ? { ...w, name: trimmed } : w)),
        });
      },

      deleteWorkout: (id) => {
        const { activeWorkoutId, workouts } = get();
        set({
          workouts: workouts.filter((w) => w.id !== id),
          activeWorkoutId: activeWorkoutId === id ? null : activeWorkoutId,
        });
      },

      addExercise: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const exercise: Exercise = {
          id: uid(),
          name: trimmed,
          notes: '',
          sets: [defaultSet()],
        };
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: [...w.exercises, exercise],
          })),
        });
      },

      removeExercise: (exerciseId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.filter((e) => e.id !== exerciseId),
          })),
        });
      },

      updateExerciseNotes: (exerciseId, notes) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) => (e.id === exerciseId ? { ...e, notes } : e)),
          })),
        });
      },

      addSet: (exerciseId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              const lastSet = e.sets[e.sets.length - 1];
              return { ...e, sets: [...e.sets, defaultSet(lastSet)] };
            }),
          })),
        });
      },

      updateSet: (exerciseId, setId, updates) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              return {
                ...e,
                sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
              };
            }),
          })),
        });
      },

      removeSet: (exerciseId, setId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) => {
              if (e.id !== exerciseId) return e;
              const sets = e.sets.filter((s) => s.id !== setId);
              return { ...e, sets: sets.length > 0 ? sets : [defaultSet()] };
            }),
          })),
        });
      },
    }),
    { name: 'forge-workouts' },
  ),
);
