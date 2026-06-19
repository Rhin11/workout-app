import type { BarbellSession } from '../store/barbellStore';
import { stickingZone, ZONE_LABEL, type StickingZone } from './barbellAnalysis';

export const UNTAGGED = 'Untagged';

/** A session's effective date for sorting/display (tagged date, else capture time). */
export function sessionDate(session: BarbellSession): string {
  return session.date ?? session.createdAt;
}

/** Group sessions by tagged exercise; untagged sessions fall under "Untagged". */
export function groupByExercise(sessions: BarbellSession[]): Map<string, BarbellSession[]> {
  const groups = new Map<string, BarbellSession[]>();
  for (const session of sessions) {
    const key = session.exerciseName?.trim() || UNTAGGED;
    const list = groups.get(key) ?? [];
    list.push(session);
    groups.set(key, list);
  }
  return groups;
}

/** Distinct exercise names, ordered by most-recent activity first. */
export function exercisesByRecency(sessions: BarbellSession[]): string[] {
  const groups = groupByExercise(sessions);
  return [...groups.entries()]
    .map(([name, list]) => ({
      name,
      latest: Math.max(...list.map((s) => new Date(sessionDate(s)).getTime())),
    }))
    .sort((a, b) => b.latest - a.latest)
    .map((e) => e.name);
}

export interface RecurringStickingInsight {
  zone: StickingZone;
  label: string;
  count: number;
  total: number;
}

/**
 * Across a lift's most recent sessions (up to `window`), find the rep zone where
 * sticking points recur most often. Returns the dominant zone when it appears in
 * at least 2 of the considered sessions, else null.
 */
export function computeRecurringStickingInsight(
  sessions: BarbellSession[],
  window = 4,
): RecurringStickingInsight | null {
  const recent = [...sessions]
    .sort((a, b) => new Date(sessionDate(b)).getTime() - new Date(sessionDate(a)).getTime())
    .slice(0, window);
  if (recent.length < 2) return null;

  const counts: Record<StickingZone, number> = { bottom: 0, mid: 0, lockout: 0 };
  for (const session of recent) {
    // A session "has" a zone if any of its sticking points fall in it (count once).
    const zones = new Set(session.analysis.sticking_points.map((sp) => stickingZone(sp.position_pct)));
    for (const zone of zones) counts[zone] += 1;
  }

  let best: StickingZone | null = null;
  for (const zone of ['bottom', 'mid', 'lockout'] as StickingZone[]) {
    if (best === null || counts[zone] > counts[best]) best = zone;
  }
  if (!best || counts[best] < 2) return null;

  return { zone: best, label: ZONE_LABEL[best], count: counts[best], total: recent.length };
}
