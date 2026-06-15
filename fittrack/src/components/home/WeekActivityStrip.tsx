import { useMemo } from 'react';
import type { Workout } from '../../store/workoutStore';
import {
  calculateStreak,
  dayHasActivity,
  getCurrentWeekDays,
} from './weekActivity';

interface Props {
  workouts: Workout[];
  entriesByDate: Record<string, unknown[]>;
  waterByDate: Record<string, unknown[]>;
}

export default function WeekActivityStrip({ workouts, entriesByDate, waterByDate }: Props) {
  const now = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getCurrentWeekDays(now), [now]);

  const streak = useMemo(
    () =>
      calculateStreak(now, (dateKey) =>
        dayHasActivity(dateKey, workouts, entriesByDate, waterByDate),
      ),
    [now, workouts, entriesByDate, waterByDate],
  );

  const streakLabel = streak === 1 ? '1 day streak' : `${streak} day streak`;

  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-100">This week</h2>
        <p className="text-xs text-gray-500">{streak > 0 ? streakLabel : 'No streak yet'}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        {weekDays.map((day) => {
          const active = dayHasActivity(day.dateKey, workouts, entriesByDate, waterByDate);
          return (
            <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  day.isToday ? 'ring-2 ring-[#6C63FF]/50 ring-offset-2 ring-offset-[#141414]' : ''
                } ${
                  active
                    ? 'bg-[#6C63FF] text-white'
                    : 'border border-[#2A2A2A] bg-transparent text-gray-500'
                }`}
                aria-label={`${day.initial}${active ? ', activity logged' : ', no activity'}${
                  day.isToday ? ', today' : ''
                }`}
              >
                {day.initial}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
