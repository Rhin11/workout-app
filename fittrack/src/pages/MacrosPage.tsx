import { useMemo, useState } from 'react';
import WaterGoalModal from '../components/macro/WaterGoalModal';
import WaterTracker, { formatOz } from '../components/macro/WaterTracker';
import AddFoodModal from '../components/macro/AddFoodModal';
import GoalsModal from '../components/macro/GoalsModal';
import MealSection from '../components/macro/MealSection';
import SummaryCard from '../components/macro/SummaryCard';
import { colors } from '../constants/theme';
import { sumNutrition } from '../constants/nutrition';
import { MEALS, useMacroStore, type MealType } from '../store/macroStore';

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftDate(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

function formatDisplayDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MacrosPage() {
  const goals = useMacroStore((s) => s.goals);
  const entriesByDate = useMacroStore((s) => s.entriesByDate);
  const waterByDate = useMacroStore((s) => s.waterByDate);
  const setGoals = useMacroStore((s) => s.setGoals);
  const addEntry = useMacroStore((s) => s.addEntry);
  const removeEntry = useMacroStore((s) => s.removeEntry);
  const addWater = useMacroStore((s) => s.addWater);
  const removeWater = useMacroStore((s) => s.removeWater);

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [waterGoalOpen, setWaterGoalOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<MealType | null>(null);

  const dayEntries = entriesByDate[selectedDate] ?? [];
  const dayWaterEntries = waterByDate[selectedDate] ?? [];
  const waterOz = useMemo(
    () => dayWaterEntries.reduce((sum, e) => sum + e.amountOz, 0),
    [dayWaterEntries],
  );
  const totals = useMemo(() => sumNutrition(dayEntries), [dayEntries]);

  const entriesByMeal = useMemo(() => {
    const map: Record<MealType, typeof dayEntries> = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    };
    for (const entry of dayEntries) {
      map[entry.meal].push(entry);
    }
    return map;
  }, [dayEntries]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 pb-24">
        {/* Date bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200"
            aria-label="Previous day"
          >
            ◀
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-100">{formatDisplayDate(selectedDate)}</p>
            {selectedDate !== toDateKey(new Date()) && (
              <button
                type="button"
                onClick={() => setSelectedDate(toDateKey(new Date()))}
                className="mt-0.5 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Go to today
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200"
            aria-label="Next day"
          >
            ▶
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard
            label="Calories"
            consumed={totals.calories}
            goal={goals.calories}
            unit="kcal"
            color={colors.calories}
            showGear
            onEditGoals={() => setGoalsOpen(true)}
          />
          <SummaryCard
            label="Protein"
            consumed={totals.protein}
            goal={goals.protein}
            unit="g"
            color={colors.protein}
          />
          <SummaryCard
            label="Carbs"
            consumed={totals.carbs}
            goal={goals.carbs}
            unit="g"
            color={colors.carbs}
          />
          <SummaryCard
            label="Fat"
            consumed={totals.fat}
            goal={goals.fat}
            unit="g"
            color={colors.fat}
          />
          <SummaryCard
            label="Sodium"
            consumed={totals.sodium}
            goal={goals.sodium}
            unit="mg"
            color="#94A3B8"
          />
          <SummaryCard
            label="Water"
            consumed={waterOz}
            goal={goals.water}
            unit="oz"
            color={colors.water}
            formatValue={formatOz}
            showGear
            onEditGoals={() => setWaterGoalOpen(true)}
          />
        </div>

        <WaterTracker
          consumedOz={waterOz}
          goalOz={goals.water}
          entries={dayWaterEntries}
          onAdd={(amountOz) => addWater(selectedDate, amountOz)}
          onRemove={(id) => removeWater(selectedDate, id)}
          onEditGoal={() => setWaterGoalOpen(true)}
        />

        {/* Meal sections */}
        <div className="space-y-3">
          {MEALS.map((meal) => {
            const entries = entriesByMeal[meal];
            const subtotal = sumNutrition(entries).calories;
            return (
              <MealSection
                key={meal}
                meal={meal}
                entries={entries}
                calorieSubtotal={subtotal}
                onRemove={(id) => removeEntry(selectedDate, id)}
                onAddFood={setAddMeal}
              />
            );
          })}
        </div>
      </div>

      {/* Sticky daily totals */}
      <div className="sticky bottom-0 border-t border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
          <span className="font-medium text-gray-300">Daily totals</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400">
            <span>
              <span className="text-gray-500">Cal </span>
              <span className="font-medium text-gray-200">{Math.round(totals.calories)}</span>
            </span>
            <span>
              <span className="text-gray-500">Protein </span>
              <span className="font-medium text-gray-200">{totals.protein.toFixed(1)}g</span>
            </span>
            <span>
              <span className="text-gray-500">Carbs </span>
              <span className="font-medium text-gray-200">{totals.carbs.toFixed(1)}g</span>
            </span>
            <span>
              <span className="text-gray-500">Fat </span>
              <span className="font-medium text-gray-200">{totals.fat.toFixed(1)}g</span>
            </span>
            <span>
              <span className="text-gray-500">Water </span>
              <span className="font-medium text-sky-300">{formatOz(waterOz)} oz</span>
            </span>
          </div>
        </div>
      </div>

      {goalsOpen && (
        <GoalsModal goals={goals} onSave={setGoals} onClose={() => setGoalsOpen(false)} />
      )}

      {waterGoalOpen && (
        <WaterGoalModal
          goalOz={goals.water}
          onSave={(water) => setGoals({ ...goals, water })}
          onClose={() => setWaterGoalOpen(false)}
        />
      )}

      {addMeal && (
        <AddFoodModal
          meal={addMeal}
          date={selectedDate}
          onClose={() => setAddMeal(null)}
          onAdd={(entry) => addEntry(selectedDate, entry)}
        />
      )}
    </div>
  );
}
