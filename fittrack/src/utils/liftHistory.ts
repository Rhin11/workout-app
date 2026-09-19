import { useMemo } from 'react';
import { useWorkoutStore, type Workout, type WorkoutSet } from '../store/workoutStore';

export interface HistoricSet {
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
}

export interface LiftSession {
  workoutId: string;
  date: string;
  sets: HistoricSet[];
}

export type LiftTrend = 'more' | 'less' | 'same';

const LB_PER_KG = 2.2046226218;
const WEIGHT_EPS = 0.26;

export function toLbs(weight: number, unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? weight * LB_PER_KG : weight;
}

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function historicWorkingSets(sets: WorkoutSet[], requireCompleted: boolean): HistoricSet[] {
  return sets
    .filter((s) => {
      if (s.isWarmup) return false;
      if (s.weight <= 0 || s.reps <= 0) return false;
      if (requireCompleted && !s.completed) return false;
      return true;
    })
    .map((s) => ({ weight: s.weight, reps: s.reps, unit: s.unit }));
}

export function previousLiftSessions(
  workouts: Workout[],
  exerciseName: string,
  excludeWorkoutId: string | null,
): LiftSession[] {
  const sessions: LiftSession[] = [];
  for (const workout of workouts) {
    if (workout.id === excludeWorkoutId) continue;
    for (const exercise of workout.exercises) {
      if (!namesMatch(exercise.name, exerciseName)) continue;
      const sets = historicWorkingSets(exercise.sets, true);
      if (sets.length === 0) continue;
      sessions.push({
        workoutId: workout.id,
        date: workout.finishedAt ?? workout.date,
        sets,
      });
      break;
    }
  }
  sessions.sort((a, b) => b.date.localeCompare(a.date));
  return sessions;
}

function volumeLbs(sets: HistoricSet[]): number {
  return sets.reduce((sum, s) => sum + toLbs(s.weight, s.unit) * s.reps, 0);
}

function bestSet(sets: HistoricSet[]): HistoricSet | null {
  if (sets.length === 0) return null;
  return sets.reduce((best, s) => {
    const w = toLbs(s.weight, s.unit);
    const bw = toLbs(best.weight, best.unit);
    if (w > bw + WEIGHT_EPS) return s;
    if (Math.abs(w - bw) <= WEIGHT_EPS && s.reps > best.reps) return s;
    return best;
  });
}

/** Compare current working sets to the last logged session. */
export function compareToLast(current: HistoricSet[], last: HistoricSet[]): LiftTrend | null {
  if (current.length === 0 || last.length === 0) return null;
  const curBest = bestSet(current);
  const lastBest = bestSet(last);
  if (!curBest || !lastBest) return null;

  const curW = toLbs(curBest.weight, curBest.unit);
  const lastW = toLbs(lastBest.weight, lastBest.unit);
  if (curW > lastW + WEIGHT_EPS) return 'more';
  if (curW < lastW - WEIGHT_EPS) return 'less';
  if (curBest.reps > lastBest.reps) return 'more';
  if (curBest.reps < lastBest.reps) return 'less';

  const curVol = volumeLbs(current);
  const lastVol = volumeLbs(last);
  if (current.length < last.length && curVol + WEIGHT_EPS < lastVol) return null;
  if (curVol > lastVol + WEIGHT_EPS) return 'more';
  if (curVol < lastVol - WEIGHT_EPS) return 'less';
  return 'same';
}

export function formatSetList(sets: HistoricSet[]): string {
  return sets.map((s) => `${s.weight}×${s.reps}`).join(' · ');
}

export function formatSessionDate(iso: string): string {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export interface LiftHistoryView {
  last: LiftSession | null;
  older: LiftSession[];
  trend: LiftTrend | null;
  lastWorkingSets: HistoricSet[];
}

export function useLiftHistory(exerciseName: string, currentSets: WorkoutSet[]): LiftHistoryView {
  const workouts = useWorkoutStore((s) => s.workouts);
  const activeWorkoutId = useWorkoutStore((s) => s.activeWorkoutId);

  return useMemo(() => {
    const sessions = previousLiftSessions(workouts, exerciseName, activeWorkoutId);
    const last = sessions[0] ?? null;
    const older = sessions.slice(1, 8);
    const current = historicWorkingSets(currentSets, false);
    return {
      last,
      older,
      trend: last ? compareToLast(current, last.sets) : null,
      lastWorkingSets: last?.sets ?? [],
    };
  }, [workouts, activeWorkoutId, exerciseName, currentSets]);
}
