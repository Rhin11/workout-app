import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExerciseInfo } from '../../constants/exerciseInfo';
import { getExerciseByName, ExerciseDbRequestError, type DbExercise } from '../../services/exerciseDb';
import ExerciseMuscleDiagram from '../exerciseMuscleDiagram';

interface Props {
  exerciseName: string;
  size?: 'sm' | 'md';
}

type View = 'muscles' | 'demo';
type DemoStatus = 'idle' | 'loading' | 'ready' | 'notfound' | 'error';

function InstructionSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-2 space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
          <span className="shrink-0 font-semibold text-indigo-400">{i + 1}.</span>
          <span>{step.replace(/^Step:\d+\s*/i, '')}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ExerciseInfoButton({ exerciseName, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('muscles');
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('idle');
  const [demo, setDemo] = useState<DbExercise | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  // Guards the one-shot demo fetch so toggling state doesn't re-trigger/cancel it.
  const demoRequested = useRef(false);
  const info = getExerciseInfo(exerciseName);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Fetch ExerciseDB data once per popup open — powers Muscles instructions + Demo GIF.
  useEffect(() => {
    if (!open || demoRequested.current) return;
    demoRequested.current = true;
    let cancelled = false;
    void (async () => {
      setDemoStatus('loading');
      setDemoError(null);
      try {
        const match = await getExerciseByName(exerciseName);
        if (cancelled) return;
        if (match && match.gifUrl) {
          setDemo(match);
          setDemoStatus('ready');
        } else {
          setDemoStatus('notfound');
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ExerciseDbRequestError
            ? err.status === 429
              ? 'ExerciseDB rate limit reached — try again in a minute'
              : err.status === 503
                ? 'ExerciseDB is temporarily unavailable — try again shortly'
                : err.message
            : err instanceof Error
              ? err.message
              : 'Unknown error loading demo';
        console.error('[ExerciseDemo] failed for', exerciseName, err);
        setDemoError(message);
        setDemoStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, exerciseName]);

  const openPopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Fresh slate each open: default to Muscles, allow the demo to (re)fetch.
    setView('muscles');
    setDemoStatus('idle');
    setDemo(null);
    setDemoError(null);
    demoRequested.current = false;
    setOpen(true);
  };

  const dim = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  const toggleBtn = (target: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(target)}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        view === target ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
      }`}
      aria-pressed={view === target}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        type="button"
        onClick={openPopup}
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

              {/* Muscles / Demo toggle */}
              <div className="mt-3 inline-flex rounded-lg border border-slate-700/60 bg-slate-800/50 p-0.5">
                {toggleBtn('muscles', 'Muscles')}
                {toggleBtn('demo', 'Demo')}
              </div>

              {view === 'muscles' ? (
                <>
                  <p className="mt-4 text-sm text-slate-400">Muscles worked</p>
                  <div className="mt-3">
                    <ExerciseMuscleDiagram
                      primaryMuscles={info.primaryMuscles}
                      secondaryMuscles={info.secondaryMuscles}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  {demoStatus === 'loading' && (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500/40 border-t-indigo-400" />
                      Loading demo...
                    </div>
                  )}
                  {demoStatus === 'notfound' && (
                    <p className="py-12 text-center text-sm text-slate-400">
                      No demo available for this exercise
                    </p>
                  )}
                  {demoStatus === 'error' && (
                    <p className="py-12 text-center text-sm text-red-400">
                      Couldn't load demo right now
                      {demoError ? (
                        <>
                          <br />
                          <span className="mt-1 block text-xs text-red-400/80">{demoError}</span>
                        </>
                      ) : null}
                    </p>
                  )}
                  {demoStatus === 'ready' && demo && (
                    <>
                      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-white">
                        <img
                          src={demo.gifUrl}
                          alt={`${exerciseName} demonstration`}
                          loading="lazy"
                          className="mx-auto block max-h-80 w-full object-contain"
                        />
                      </div>
                      {demo.name.toLowerCase() !== exerciseName.toLowerCase() && (
                        <p className="mt-2 text-center text-xs capitalize text-slate-500">
                          Demo: {demo.name}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {view === 'muscles' && (
                <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    How to perform
                  </h3>
                  {demoStatus === 'loading' ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500/40 border-t-indigo-400" />
                      Loading instructions...
                    </div>
                  ) : demoStatus === 'ready' && demo && demo.instructions.length > 0 ? (
                    <InstructionSteps steps={demo.instructions} />
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {info.instructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
