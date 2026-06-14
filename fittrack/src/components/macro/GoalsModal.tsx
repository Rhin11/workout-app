import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MacroGoals } from '../../store/macroStore';

interface Props {
  goals: MacroGoals;
  onSave: (goals: MacroGoals) => void;
  onClose: () => void;
}

const FIELDS: { key: keyof MacroGoals; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'water', label: 'Water', unit: 'oz' },
];

export default function GoalsModal({ goals, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<MacroGoals>(goals);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 normal-case"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit macro goals"
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Daily goals</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {FIELDS.map(({ key, label, unit }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-400">
                {label} ({unit})
              </span>
              <input
                type="number"
                min={0}
                value={draft[key]}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
