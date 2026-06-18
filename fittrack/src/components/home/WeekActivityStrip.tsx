import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Workout } from '../../store/workoutStore';
import WorkoutDayModal from './WorkoutDayModal';
import {
  calculateStreak,
  caloriesOnDate,
  dayHasActivity,
  getCurrentWeekDays,
  getMonthGrid,
  workoutsOnDate,
} from './weekActivity';

interface Props {
  workouts: Workout[];
  entriesByDate: Record<string, unknown[]>;
  waterByDate: Record<string, unknown[]>;
}

const MONTH_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export default function WeekActivityStrip({ workouts, entriesByDate, waterByDate }: Props) {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getCurrentWeekDays(now), [now]);

  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => ({
    year: now.getFullYear(),
    month: now.getMonth(),
  }));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthCells = useMemo(
    () => getMonthGrid(viewMonth.year, viewMonth.month, now),
    [viewMonth, now],
  );

  const streak = useMemo(
    () =>
      calculateStreak(now, (dateKey) =>
        dayHasActivity(dateKey, workouts, entriesByDate, waterByDate),
      ),
    [now, workouts, entriesByDate, waterByDate],
  );

  const streakLabel = streak === 1 ? '1 day streak' : `${streak} day streak`;

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) =>
    setViewMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const selectedWorkouts = selectedDate ? workoutsOnDate(workouts, selectedDate) : [];

  const handleViewWorkout = (id: string) => {
    setSelectedDate(null);
    navigate('/workout', { state: { viewWorkoutId: id } });
  };

  const openDay = (dateKey: string) => {
    if (workoutsOnDate(workouts, dateKey).length > 0) setSelectedDate(dateKey);
  };

  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-100">This week</h2>
        <div className="flex items-baseline gap-3">
          <p className="text-xs text-gray-500">{streak > 0 ? streakLabel : 'No streak yet'}</p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[#6C63FF] transition-colors hover:text-[#8b84ff]"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide month' : 'View month'}
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
          </button>
        </div>
      </div>

      {!expanded ? (
        <div className="flex items-center justify-between gap-2">
          {weekDays.map((day) => {
            const active = dayHasActivity(day.dateKey, workouts, entriesByDate, waterByDate);
            const tappable = workoutsOnDate(workouts, day.dateKey).length > 0;
            return (
              <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
                <DayCell
                  label={day.initial}
                  active={active}
                  isToday={day.isToday}
                  tappable={tappable}
                  onClick={() => openDay(day.dateKey)}
                  ariaLabel={`${day.initial}${active ? ', activity logged' : ', no activity'}${
                    day.isToday ? ', today' : ''
                  }${tappable ? ', view workout' : ''}`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2A2A2A] text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-white"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="text-sm font-medium text-gray-200">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#2A2A2A] text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-white"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {MONTH_LABELS.map((label, i) => (
              <div key={i} className="text-center text-[0.65rem] font-medium uppercase text-gray-600">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((cell, i) => {
              if (!cell.inMonth) {
                return <div key={`pad-${i}`} aria-hidden="true" />;
              }
              const active = dayHasActivity(cell.dateKey, workouts, entriesByDate, waterByDate);
              const tappable = workoutsOnDate(workouts, cell.dateKey).length > 0;
              return (
                <div key={cell.dateKey} className="flex justify-center">
                  <DayCell
                    label={String(cell.dayOfMonth)}
                    active={active}
                    isToday={cell.isToday}
                    tappable={tappable}
                    onClick={() => openDay(cell.dateKey)}
                    ariaLabel={`${monthLabel} ${cell.dayOfMonth}${
                      active ? ', activity logged' : ', no activity'
                    }${cell.isToday ? ', today' : ''}${tappable ? ', view workout' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && selectedWorkouts.length > 0 && (
        <WorkoutDayModal
          dateKey={selectedDate}
          workouts={selectedWorkouts}
          calories={caloriesOnDate(entriesByDate, selectedDate)}
          onClose={() => setSelectedDate(null)}
          onViewWorkout={handleViewWorkout}
        />
      )}
    </section>
  );
}

interface DayCellProps {
  label: string;
  active: boolean;
  isToday: boolean;
  tappable: boolean;
  onClick: () => void;
  ariaLabel: string;
}

function DayCell({ label, active, isToday, tappable, onClick, ariaLabel }: DayCellProps) {
  const base =
    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors';
  const ring = isToday ? 'ring-2 ring-[#6C63FF]/50 ring-offset-2 ring-offset-[#141414]' : '';
  const fill = active
    ? 'bg-[#6C63FF] text-white'
    : 'border border-[#2A2A2A] bg-transparent text-gray-500';
  const interactive = tappable ? 'cursor-pointer hover:ring-2 hover:ring-[#6C63FF]/40' : '';

  if (!tappable) {
    return (
      <div className={`${base} ${ring} ${fill}`} aria-label={ariaLabel}>
        {label}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${ring} ${fill} ${interactive}`}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}
