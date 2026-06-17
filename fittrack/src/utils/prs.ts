import type { Workout } from '../store/workoutStore';

export interface LiftAttempt {
  /** ISO date of the workout the attempt came from. */
  date: string;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  e1rm: number;
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  date: string;
  e1rm: number;
  /** Best attempt per workout, newest first. */
  history: LiftAttempt[];
}

/** Epley estimated 1-rep max. */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

// Plain barbell staples lead the PR list, in this order; everything else follows by e1RM.
const COMPOUND_RANK: Record<string, number> = {
  'back squat': 0,
  squat: 0,
  'bench press': 1,
  deadlift: 2,
  'overhead press': 3,
  'barbell overhead press': 3,
};

function compoundRank(name: string): number {
  return COMPOUND_RANK[name.trim().toLowerCase()] ?? Number.POSITIVE_INFINITY;
}

/** Is `a` a better single set than `b`? Heavier wins; ties broken by more reps. */
function better(a: { weight: number; reps: number }, b: { weight: number; reps: number }): boolean {
  return a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps);
}

/**
 * Compute personal records across all logged workouts. Considers every completed
 * set with positive weight and reps, grouped by exercise name.
 */
export function computePRs(workouts: Workout[]): PersonalRecord[] {
  // exercise name -> { best set, per-workout best attempts }
  const byExercise = new Map<
    string,
    { best: LiftAttempt; attempts: Map<string, LiftAttempt> }
  >();

  for (const workout of workouts) {
    const date = workout.finishedAt ?? workout.date;
    for (const exercise of workout.exercises) {
      for (const s of exercise.sets) {
        if (!s.completed || s.weight <= 0 || s.reps <= 0) continue;
        const attempt: LiftAttempt = {
          date,
          weight: s.weight,
          reps: s.reps,
          unit: s.unit,
          e1rm: epley(s.weight, s.reps),
        };
        const entry = byExercise.get(exercise.name);
        if (!entry) {
          byExercise.set(exercise.name, {
            best: attempt,
            attempts: new Map([[workout.id, attempt]]),
          });
          continue;
        }
        if (better(attempt, entry.best)) entry.best = attempt;
        const prev = entry.attempts.get(workout.id);
        if (!prev || better(attempt, prev)) entry.attempts.set(workout.id, attempt);
      }
    }
  }

  const records: PersonalRecord[] = [];
  for (const [exercise, { best, attempts }] of byExercise) {
    records.push({
      exercise,
      weight: best.weight,
      reps: best.reps,
      unit: best.unit,
      date: best.date,
      e1rm: best.e1rm,
      history: [...attempts.values()].sort((a, b) => b.date.localeCompare(a.date)),
    });
  }

  records.sort((a, b) => {
    const ra = compoundRank(a.exercise);
    const rb = compoundRank(b.exercise);
    if (ra !== rb) return ra - rb;
    return b.e1rm - a.e1rm;
  });

  return records;
}
