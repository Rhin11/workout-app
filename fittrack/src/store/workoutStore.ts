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
  /** Rest time between sets, in seconds. Used when the exercise is NOT in a superset. */
  restSeconds: number;
  /** Whether the rest timer auto-starts on set completion. On by default. */
  restEnabled?: boolean;
  /** When set, this exercise belongs to a superset group with this id. */
  supersetId?: string;
  sets: WorkoutSet[];
}

/** A superset: 2+ exercises performed back-to-back with one shared rest time. */
export interface SupersetGroup {
  id: string;
  restSeconds: number;
  /** Whether the shared rest timer auto-starts on set completion. Off by default. */
  restEnabled?: boolean;
}

export const DEFAULT_REST_SECONDS = 90;
export const MIN_REST_SECONDS = 0;
export const MAX_REST_SECONDS = 300;

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
  supersetGroups: SupersetGroup[];
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
  addExerciseToSuperset: (name: string, supersetId: string) => void;
  removeExercise: (exerciseId: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  setExerciseRest: (exerciseId: string, restSeconds: number) => void;
  setExerciseRestEnabled: (exerciseId: string, enabled: boolean) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'unit' | 'completed'>>,
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  // Supersets
  createSuperset: (exerciseIds: string[]) => void;
  addToSuperset: (exerciseId: string, supersetId: string) => void;
  removeFromSuperset: (exerciseId: string) => void;
  setSupersetRest: (supersetId: string, restSeconds: number) => void;
  setSupersetRestEnabled: (supersetId: string, enabled: boolean) => void;
  addSupersetRound: (supersetId: string) => void;
  removeSupersetRound: (supersetId: string, roundIndex: number) => void;
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

/** Number of rounds (= max set count) across a set of grouped exercises. */
function groupRounds(members: Exercise[]): number {
  return members.reduce((max, e) => Math.max(max, e.sets.length), 0);
}

/** Pad an exercise's sets up to `rounds`, copying the last set's values. */
function padSets(exercise: Exercise, rounds: number): Exercise {
  if (exercise.sets.length >= rounds) return exercise;
  const sets = [...exercise.sets];
  while (sets.length < rounds) sets.push(defaultSet(sets[sets.length - 1]));
  return { ...exercise, sets };
}

/** Reorder so each superset's members are contiguous, anchored at first appearance. */
function reorderGrouped(exercises: Exercise[]): Exercise[] {
  const result: Exercise[] = [];
  const handled = new Set<string>();
  for (const e of exercises) {
    if (handled.has(e.id)) continue;
    if (e.supersetId) {
      for (const m of exercises) {
        if (m.supersetId === e.supersetId && !handled.has(m.id)) {
          result.push(m);
          handled.add(m.id);
        }
      }
    } else {
      result.push(e);
      handled.add(e.id);
    }
  }
  return result;
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
          supersetGroups: [],
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
          restSeconds: DEFAULT_REST_SECONDS,
          restEnabled: true,
          sets: [defaultSet()],
        };
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: [...w.exercises, exercise],
          })),
        });
      },

      addExerciseToSuperset: (name, supersetId) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const groups = w.supersetGroups ?? [];
            if (!groups.some((g) => g.id === supersetId)) return w;
            const members = w.exercises.filter((e) => e.supersetId === supersetId);
            if (members.length === 0) return w;
            const rounds = groupRounds(members);
            const exercise = padSets(
              {
                id: uid(),
                name: trimmed,
                notes: '',
                restSeconds: DEFAULT_REST_SECONDS,
                restEnabled: true,
                supersetId,
                sets: [defaultSet()],
              },
              rounds,
            );
            return {
              ...w,
              exercises: reorderGrouped([...w.exercises, exercise]),
            };
          }),
        });
      },

      removeExercise: (exerciseId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const removed = w.exercises.find((e) => e.id === exerciseId);
            let exercises = w.exercises.filter((e) => e.id !== exerciseId);
            let groups = w.supersetGroups ?? [];
            // If this drops a group below 2 members, dissolve it.
            if (removed?.supersetId) {
              const gid = removed.supersetId;
              if (exercises.filter((e) => e.supersetId === gid).length < 2) {
                exercises = exercises.map((e) =>
                  e.supersetId === gid ? { ...e, supersetId: undefined } : e,
                );
                groups = groups.filter((g) => g.id !== gid);
              }
            }
            return { ...w, exercises, supersetGroups: groups };
          }),
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

      setExerciseRest: (exerciseId, restSeconds) => {
        const clamped = Math.max(MIN_REST_SECONDS, Math.min(MAX_REST_SECONDS, restSeconds));
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) =>
              e.id === exerciseId ? { ...e, restSeconds: clamped } : e,
            ),
          })),
        });
      },

      setExerciseRestEnabled: (exerciseId, enabled) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) =>
              e.id === exerciseId ? { ...e, restEnabled: enabled } : e,
            ),
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

      createSuperset: (exerciseIds) => {
        if (exerciseIds.length < 2) return;
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const idSet = new Set(exerciseIds);
            const members = exerciseIds
              .map((id) => w.exercises.find((e) => e.id === id))
              .filter((e): e is Exercise => Boolean(e) && !e!.supersetId);
            if (members.length < 2) return w;

            const groupId = uid();
            const rounds = groupRounds(members);
            // Assign group id + normalize rounds, keeping members in the selected order.
            const orderedMembers = members.map((m) =>
              padSets({ ...m, supersetId: groupId }, rounds),
            );
            const nonMembers = w.exercises.filter((e) => !idSet.has(e.id));
            // Insert the group block at the first member's original position.
            const firstIndex = Math.min(
              ...members.map((m) => w.exercises.findIndex((e) => e.id === m.id)),
            );
            const insertAt = w.exercises
              .slice(0, firstIndex)
              .filter((e) => !idSet.has(e.id)).length;
            const exercises = [
              ...nonMembers.slice(0, insertAt),
              ...orderedMembers,
              ...nonMembers.slice(insertAt),
            ];
            const group: SupersetGroup = {
              id: groupId,
              restSeconds: DEFAULT_REST_SECONDS,
              restEnabled: true,
            };
            return { ...w, exercises, supersetGroups: [...(w.supersetGroups ?? []), group] };
          }),
        });
      },

      addToSuperset: (exerciseId, supersetId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const groups = w.supersetGroups ?? [];
            if (!groups.some((g) => g.id === supersetId)) return w;
            const target = w.exercises.find((e) => e.id === exerciseId);
            if (!target || target.supersetId) return w;
            const members = w.exercises.filter((e) => e.supersetId === supersetId);
            if (members.length === 0) return w;
            const rounds = Math.max(groupRounds(members), target.sets.length);
            const exercises = reorderGrouped(
              w.exercises.map((e) => {
                if (e.id === exerciseId) return padSets({ ...e, supersetId }, rounds);
                if (e.supersetId === supersetId) return padSets(e, rounds);
                return e;
              }),
            );
            return { ...w, exercises };
          }),
        });
      },

      removeFromSuperset: (exerciseId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const target = w.exercises.find((e) => e.id === exerciseId);
            if (!target?.supersetId) return w;
            const gid = target.supersetId;
            let exercises = w.exercises.map((e) =>
              e.id === exerciseId ? { ...e, supersetId: undefined } : e,
            );
            let groups = w.supersetGroups ?? [];
            // Dissolve the group if fewer than 2 members remain.
            if (exercises.filter((e) => e.supersetId === gid).length < 2) {
              exercises = exercises.map((e) =>
                e.supersetId === gid ? { ...e, supersetId: undefined } : e,
              );
              groups = groups.filter((g) => g.id !== gid);
            }
            return { ...w, exercises: reorderGrouped(exercises), supersetGroups: groups };
          }),
        });
      },

      setSupersetRest: (supersetId, restSeconds) => {
        const clamped = Math.max(MIN_REST_SECONDS, Math.min(MAX_REST_SECONDS, restSeconds));
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            supersetGroups: (w.supersetGroups ?? []).map((g) =>
              g.id === supersetId ? { ...g, restSeconds: clamped } : g,
            ),
          })),
        });
      },

      setSupersetRestEnabled: (supersetId, enabled) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            supersetGroups: (w.supersetGroups ?? []).map((g) =>
              g.id === supersetId ? { ...g, restEnabled: enabled } : g,
            ),
          })),
        });
      },

      addSupersetRound: (supersetId) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => ({
            ...w,
            exercises: w.exercises.map((e) =>
              e.supersetId === supersetId
                ? { ...e, sets: [...e.sets, defaultSet(e.sets[e.sets.length - 1])] }
                : e,
            ),
          })),
        });
      },

      removeSupersetRound: (supersetId, roundIndex) => {
        set({
          workouts: updateActiveWorkout(get().workouts, get().activeWorkoutId, (w) => {
            const members = w.exercises.filter((e) => e.supersetId === supersetId);
            if (groupRounds(members) <= 1) return w;
            return {
              ...w,
              exercises: w.exercises.map((e) =>
                e.supersetId === supersetId
                  ? { ...e, sets: e.sets.filter((_, i) => i !== roundIndex) }
                  : e,
              ),
            };
          }),
        });
      },
    }),
    { name: 'forge-workouts' },
  ),
);
