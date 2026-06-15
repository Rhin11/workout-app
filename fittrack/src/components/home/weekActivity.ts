import type { Workout } from '../../store/workoutStore';

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type WeekDay = {
  dateKey: string;
  initial: string;
  isToday: boolean;
};

const WEEK_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function getCurrentWeekDays(reference: Date = new Date()): WeekDay[] {
  const d = new Date(reference);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayKey = toDateKey(reference);

  return WEEK_INITIALS.map((initial, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = toDateKey(date);
    return { dateKey, initial, isToday: dateKey === todayKey };
  });
}

export function workoutLoggedOnDate(workouts: Workout[], dateKey: string): boolean {
  return workouts.some((w) => {
    const iso = w.finishedAt ?? w.date;
    return toDateKey(new Date(iso)) === dateKey;
  });
}

export function macrosTrackedOnDate(
  entriesByDate: Record<string, unknown[]>,
  waterByDate: Record<string, unknown[]>,
  dateKey: string,
): boolean {
  return (entriesByDate[dateKey]?.length ?? 0) > 0 || (waterByDate[dateKey]?.length ?? 0) > 0;
}

export function dayHasActivity(
  dateKey: string,
  workouts: Workout[],
  entriesByDate: Record<string, unknown[]>,
  waterByDate: Record<string, unknown[]>,
): boolean {
  return (
    workoutLoggedOnDate(workouts, dateKey) ||
    macrosTrackedOnDate(entriesByDate, waterByDate, dateKey)
  );
}

export function calculateStreak(
  reference: Date,
  hasActivity: (dateKey: string) => boolean,
): number {
  let streak = 0;
  const cursor = new Date(reference);
  cursor.setHours(0, 0, 0, 0);

  while (hasActivity(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
