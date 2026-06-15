import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TodayMacroRings from '../components/home/TodayMacroRings';
import WeekActivityStrip from '../components/home/WeekActivityStrip';
import { colors } from '../constants/theme';
import { sumNutrition } from '../constants/nutrition';
import { useMacroStore } from '../store/macroStore';
import { useWorkoutStore, type Workout } from '../store/workoutStore';

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const day = 86_400_000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) {
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours <= 0) return 'just now';
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months <= 1) return '1 month ago';
  return `${months} months ago`;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMostRecentWorkout(workouts: Workout[]): Workout | null {
  if (workouts.length === 0) return null;
  const finished = workouts.filter((w) => w.finishedAt);
  if (finished.length > 0) {
    return finished.reduce((latest, w) =>
      new Date(w.finishedAt!).getTime() > new Date(latest.finishedAt!).getTime() ? w : latest,
    );
  }
  return workouts[0];
}

interface NavCardProps {
  title: string;
  subtitle: string;
  liveLine: string;
  to: string;
}

function NavCard({ title, subtitle, liveLine, to }: NavCardProps) {
  const navigate = useNavigate();
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
      className="cursor-pointer rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#6C63FF]"
    >
      <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
      <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      <p className="mt-3 text-sm font-medium" style={{ color: colors.primary }}>
        {liveLine}
      </p>
    </div>
  );
}

export default function HomePage() {
  const now = new Date();
  const today = toDateKey(now);

  const goals = useMacroStore((s) => s.goals);
  const entriesByDate = useMacroStore((s) => s.entriesByDate);
  const waterByDate = useMacroStore((s) => s.waterByDate);
  const workouts = useWorkoutStore((s) => s.workouts);

  const todayEntries = entriesByDate[today] ?? [];
  const todayTotals = useMemo(() => sumNutrition(todayEntries), [todayEntries]);
  const consumedCalories = Math.round(todayTotals.calories);
  const waterOz = Math.round(
    (waterByDate[today] ?? []).reduce((sum, e) => sum + e.amountOz, 0),
  );
  const lastWorkout = useMemo(() => getMostRecentWorkout(workouts), [workouts]);

  const dateLine = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const calorieLine = `${consumedCalories.toLocaleString()} / ${goals.calories.toLocaleString()} kcal`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-100">
          {greeting(now.getHours())}
        </h1>
        <p className="mt-1 text-gray-500">{dateLine}</p>
      </header>

      <section className="mt-8 rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
        <div className="flex flex-col divide-y divide-[#2A2A2A] sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="flex-1 py-2 sm:px-5 sm:py-0 sm:first:pl-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Calories</p>
            <p className="mt-1.5 text-gray-100">
              <span className="text-xl font-semibold">{consumedCalories.toLocaleString()}</span>
              <span className="text-gray-500"> / {goals.calories.toLocaleString()} kcal</span>
            </p>
          </div>
          <div className="flex-1 py-2 sm:px-5 sm:py-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Water</p>
            <p className="mt-1.5 text-gray-100">
              <span className="text-xl font-semibold">{waterOz}</span>
              <span className="text-gray-500"> / {goals.water} oz</span>
            </p>
          </div>
          <div className="flex-1 py-2 sm:px-5 sm:py-0 sm:last:pr-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last workout</p>
            {lastWorkout ? (
              <p className="mt-1.5 text-gray-100">
                <span className="font-semibold">{lastWorkout.name}</span>
                <span className="text-gray-500">
                  {' '}
                  · {timeAgo(lastWorkout.finishedAt ?? lastWorkout.date)}
                </span>
              </p>
            ) : (
              <p className="mt-1.5 text-gray-500">No workouts yet</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavCard
          title="Workout"
          subtitle="Log lifts, track volume"
          to="/workout"
          liveLine={
            lastWorkout
              ? `${lastWorkout.name} · ${formatShortDate(lastWorkout.finishedAt ?? lastWorkout.date)}`
              : 'Start your first workout'
          }
        />
        <NavCard
          title="Macros"
          subtitle="Track food and nutrients"
          to="/macros"
          liveLine={calorieLine}
        />
        <NavCard
          title="Barbell Path"
          subtitle="Analyze your bar path"
          to="/barbell"
          liveLine="Record your first lift"
        />
      </section>

      <div className="mt-8 space-y-6 pb-8">
        <WeekActivityStrip
          workouts={workouts}
          entriesByDate={entriesByDate}
          waterByDate={waterByDate}
        />

        <TodayMacroRings
          consumed={{
            calories: todayTotals.calories,
            protein: todayTotals.protein,
            carbs: todayTotals.carbs,
            fat: todayTotals.fat,
            water: waterOz,
          }}
          goals={goals}
        />
      </div>
    </div>
  );
}
