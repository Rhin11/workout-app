import { useState } from 'react';
import { formatNutritionValue, NUTRITION_FIELDS } from '../../constants/nutrition';
import type { FoodEntry } from '../../store/macroStore';

interface Props {
  entry: FoodEntry;
  onRemove: () => void;
}

export default function FoodEntryRow({ entry, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-medium text-gray-100">{entry.foodName}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {entry.servingGrams}g · {Math.round(entry.calories)} cal · {entry.protein.toFixed(1)}g
            protein · {entry.carbs.toFixed(1)}g carbs · {entry.fat.toFixed(1)}g fat
          </p>
        </button>
        <span className="shrink-0 text-xs text-gray-500">{expanded ? '▲' : '▼'}</span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-800 hover:text-red-400"
          aria-label={`Remove ${entry.foodName}`}
        >
          ×
        </button>
      </div>

      {expanded && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {NUTRITION_FIELDS.map(({ key, label, unit }) => (
            <div key={key}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm text-gray-200">
                {formatNutritionValue(key, entry[key])} {unit}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
