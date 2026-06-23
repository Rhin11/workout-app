import { useState } from 'react';
import ModalShell from './ModalShell';
import ExercisePicker from '../workout/ExercisePicker';
import { DEFAULT_MAIN_LIFTS } from '../../store/profileStore';

interface Props {
  /** Current main lifts. */
  mainLifts: string[];
  /** Exercise names the user has actually logged (for quick-add chips). */
  loggedExercises: string[];
  /** Commit a new main-lifts selection (persisted by the parent). */
  onChange: (lifts: string[]) => void;
  onClose: () => void;
}

const has = (list: string[], name: string) =>
  list.some((l) => l.trim().toLowerCase() === name.trim().toLowerCase());

/**
 * Editor for the featured "main lifts". Pick from the exercise library (or add a
 * custom name) via the shared ExercisePicker, quick-add from already-logged
 * lifts, and remove via the selected chips. Changes commit live to the parent.
 */
export default function MainLiftsModal({ mainLifts, loggedExercises, onChange, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>(mainLifts);

  const commit = (next: string[]) => {
    setSelected(next);
    onChange(next);
  };

  const add = (name: string) => {
    const clean = name.trim();
    if (!clean || has(selected, clean)) return;
    commit([...selected, clean]);
  };

  const remove = (name: string) => {
    commit(selected.filter((l) => l !== name));
  };

  // Logged lifts not yet featured — one tap to add.
  const quickAdd = loggedExercises.filter((name) => !has(selected, name));

  return (
    <ModalShell title="Edit main lifts" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Featured at the top of Personal Records. Search the library or add a custom lift below.
        </p>

        {/* Current selection */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Main lifts ({selected.length})
          </p>
          {selected.length === 0 ? (
            <p className="text-sm text-gray-500">No main lifts selected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selected.map((lift) => (
                <span
                  key={lift}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/40 bg-[#6C63FF]/10 py-1 pl-3 pr-2 text-sm text-gray-100"
                >
                  {lift}
                  <button
                    type="button"
                    onClick={() => remove(lift)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-[#6C63FF]/30 hover:text-white"
                    aria-label={`Remove ${lift}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {selected.length === 0 ||
          selected.some((l) => !has(DEFAULT_MAIN_LIFTS, l)) ||
          DEFAULT_MAIN_LIFTS.some((l) => !has(selected, l)) ? (
            <button
              type="button"
              onClick={() => commit(DEFAULT_MAIN_LIFTS)}
              className="mt-2 text-xs text-gray-500 hover:text-[#6C63FF]"
            >
              Reset to default
            </button>
          ) : null}
        </div>

        {/* Quick-add from logged lifts */}
        {quickAdd.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              From your logged lifts
            </p>
            <div className="flex flex-wrap gap-2">
              {quickAdd.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => add(name)}
                  className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs text-gray-400 transition-colors hover:border-[#6C63FF] hover:text-[#6C63FF]"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Library search / custom add */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Add from library
          </p>
          <ExercisePicker onSelect={add} addedExercises={selected} />
        </div>
      </div>
    </ModalShell>
  );
}
