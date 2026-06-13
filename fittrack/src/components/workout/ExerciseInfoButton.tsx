import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExerciseInfo } from '../../constants/exerciseInfo';
import ExerciseAnatomyMap from './ExerciseAnatomyMap';

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 normal-case"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${exerciseName} information`}
          >
            <div
              className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>

              <h3 className="pr-8 text-lg font-semibold text-gray-100">{exerciseName}</h3>

              <ExerciseAnatomyMap
                className="mt-4"
                primaryMuscles={info.primaryMuscles}
                secondaryMuscles={info.secondaryMuscles}
              />

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-gray-500">Primary muscles</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {info.primaryMuscles.length > 0 ? (
                      info.primaryMuscles.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-indigo-500/25 px-2.5 py-0.5 text-xs font-medium text-indigo-200"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide text-gray-500">Secondary muscles</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {info.secondaryMuscles.length > 0 ? (
                      info.secondaryMuscles.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-gray-700/60 px-2.5 py-0.5 text-xs font-medium text-gray-300"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wide text-gray-500">How to perform</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-300">{info.instructions}</p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
