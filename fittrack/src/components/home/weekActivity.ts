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

export type MonthCell = {
  dateKey: string;
  dayOfMonth: number;
  isToday: boolean;
  inMonth: boolean;
};

/** A Monday-anchored calendar grid for the given month, padded to full weeks. */
export function getMonthGrid(year: number, month: number, reference: Date = new Date()): MonthCell[] {
  const todayKey = toDateKey(reference);
  const firstDow = new Date(year, month, 1).getDay(); // 0 Sun … 6 Sat
  const lead = firstDow === 0 ? 6 : firstDow - 1; // days before Monday-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;
  const start = new Date(year, month, 1 - lead);

  const cells: MonthCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      dayOfMonth: date.getDate(),
      isToday: dateKey === todayKey,
      inMonth: date.getMonth() === month,
    });
  }
  return cells;
}

/** All workouts whose logged date falls on the given day key. */
export function workoutsOnDate(workouts: Workout[], dateKey: string): Workout[] {
  return workouts.filter((w) => toDateKey(new Date(w.finishedAt ?? w.date)) === dateKey);
}

/** Sum of calories logged on the given day, read defensively from macro entries. */
export function caloriesOnDate(
  entriesByDate: Record<string, unknown[]>,
  dateKey: string,
): number {
  const entries = entriesByDate[dateKey] ?? [];
  return entries.reduce((sum, e) => {
    const cals = (e as { calories?: unknown }).calories;
    return sum + (typeof cals === 'number' ? cals : 0);
  }, 0);
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
