import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  goalOz: number;
  onSave: (goalOz: number) => void;
  onClose: () => void;
}

export default function WaterGoalModal({ goalOz, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(String(goalOz));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const value = Number(draft);
    if (value > 0) {
      onSave(value);
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 normal-case"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit water goal"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Water goal</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-400">Daily goal (oz)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            autoFocus
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </label>

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
