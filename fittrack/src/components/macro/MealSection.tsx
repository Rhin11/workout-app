import { useState } from 'react';
import type { FoodEntry, MealType } from '../../store/macroStore';
import FoodEntryRow from './FoodEntryRow';

interface Props {
  meal: MealType;
  entries: FoodEntry[];
  calorieSubtotal: number;
  onRemove: (id: string) => void;
  onAddFood: (meal: MealType) => void;
}

export default function MealSection({ meal, entries, calorieSubtotal, onRemove, onAddFood }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <span className="font-medium text-gray-100">{meal}</span>
        <span className="flex items-center gap-3 text-sm text-gray-400">
          <span>{Math.round(calorieSubtotal)} kcal</span>
          <span className="text-xs">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-4 pb-4">
          {entries.length === 0 ? (
            <p className="py-3 text-sm text-gray-500">No foods logged</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {entries.map((entry) => (
                <FoodEntryRow key={entry.id} entry={entry} onRemove={() => onRemove(entry.id)} />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onAddFood(meal)}
            className="mt-3 w-full rounded-lg border border-dashed border-gray-700 py-2 text-sm text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-300"
          >
            + Add Food
          </button>
        </div>
      )}
    </div>
  );
}
