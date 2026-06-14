import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExerciseInfo } from '../../constants/exerciseInfo';
import ExerciseMuscleDiagram from '../exerciseMuscleDiagram';

interface Props {
  exerciseName: string;
  size?: 'sm' | 'md';
}

export default function ExerciseInfoButton({ exerciseName, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false);
  const info = getExerciseInfo(exerciseName);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const dim = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-gray-600 font-serif font-bold italic text-gray-400 transition-colors hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300 ${dim}`}
        aria-label={`Info about ${exerciseName}`}
        title="Lift info"
      >
        i
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-8 normal-case"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${exerciseName} information`}
          >
            <div
              className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>

              <h2 className="pr-10 text-lg font-bold text-white">{exerciseName}</h2>
              <p className="mt-1 text-sm text-slate-400">Muscles worked</p>

              <div className="mt-4">
                <ExerciseMuscleDiagram
                  primaryMuscles={info.primaryMuscles}
                  secondaryMuscles={info.secondaryMuscles}
                />
              </div>

              <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  How to perform
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {info.instructions}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
