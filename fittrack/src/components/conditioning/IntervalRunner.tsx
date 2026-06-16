import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Phase } from '../../store/conditioningStore';
import { buildSchedule, locate } from '../../utils/intervalSchedule';
import { playBeep, playCompleteChime, primeAudio } from '../../utils/sound';
import { formatMMSS } from '../../utils/time';

interface Props {
  phases: Phase[];
  rounds: number;
  onExit: () => void;
}

const COLORS: Record<string, string> = {
  ready: '#6B7280',
  work: '#6C63FF',
  rest: '#3B82F6',
  complete: '#22c55e',
};

const RING_RADIUS = 85;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
}

export default function IntervalRunner({ phases, rounds, onExit }: Props) {
  const schedule = useMemo(() => buildSchedule(phases, rounds), [phases, rounds]);

  const accumulatedMs = useRef(0);
  const anchorAt = useRef<number | null>(null);
  const running = useRef(false);
  const prevIndex = useRef(0);
  const completed = useRef(false);

  const [, setNow] = useState(0);
  const forceRender = () => setNow(Date.now());

  const elapsed = () =>
    accumulatedMs.current + (running.current && anchorAt.current != null ? Date.now() - anchorAt.current : 0);

  // Auto-start on mount; drive re-renders off timestamps (not tick counting).
  useEffect(() => {
    primeAudio();
    anchorAt.current = Date.now();
    running.current = true;
    const id = window.setInterval(forceRender, 200);
    const onVisible = () => forceRender();
    document.addEventListener('visibilitychange', onVisible);
    forceRender();
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Escape closes (stops/resets), mirroring the info popup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const located = locate(elapsed(), schedule);

  // Transition / completion cues.
  useEffect(() => {
    if (located.isComplete) {
      if (!completed.current) {
        completed.current = true;
        running.current = false;
        playCompleteChime();
        vibrate([200, 100, 200]);
      }
      return;
    }
    if (located.index > prevIndex.current) {
      prevIndex.current = located.index;
      playBeep();
      vibrate(200);
    }
  }, [located.index, located.isComplete]);

  const isPaused = !running.current && !located.isComplete;

  const pauseResume = () => {
    if (located.isComplete) return;
    if (running.current) {
      accumulatedMs.current = elapsed();
      anchorAt.current = null;
      running.current = false;
    } else {
      anchorAt.current = Date.now();
      running.current = true;
    }
    forceRender();
  };

  const skip = () => {
    if (located.isComplete) return;
    accumulatedMs.current = schedule.endsMs[located.index];
    anchorAt.current = running.current ? Date.now() : null;
    forceRender();
  };

  const segType = located.isComplete ? 'complete' : located.segment.type;
  const ringColor = COLORS[segType] ?? '#6B7280';
  const remainingSec = Math.max(0, Math.ceil(located.remainingMs / 1000));
  const fraction = located.isComplete
    ? 1
    : Math.max(0, Math.min(1, located.remainingMs / (located.segment.durationSec * 1000)));
  const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);
  const bigValue = located.isComplete ? 'Done' : String(remainingSec);

  const heading = located.isComplete
    ? 'Session complete'
    : located.segment.type === 'ready'
      ? 'Get ready'
      : located.segment.name;

  const roundLine =
    located.isComplete || located.segment.type === 'ready'
      ? ''
      : `Round ${located.segment.round} of ${rounds}`;

  const nextLine = located.isComplete
    ? ''
    : located.nextSegment
      ? `Next: ${located.nextSegment.name} ${formatMMSS(located.nextSegment.durationSec)}`
      : 'Next: Finish';

  const ctrlBtn =
    'rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-[#6C63FF] hover:text-white';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Interval timer"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onExit}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A] text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          aria-label="Stop and close"
        >
          ×
        </button>

        <p className="px-10 text-center text-xl font-bold text-gray-100">{heading}</p>
        <p className="mt-0.5 h-5 text-center text-xs font-medium uppercase tracking-widest text-gray-500">
          {roundLine}
        </p>

        {/* Circular depleting ring */}
        <div className="relative mx-auto mt-3 aspect-square w-56">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={RING_RADIUS} fill="none" stroke="#2A2A2A" strokeWidth="12" />
            <circle
              cx="100"
              cy="100"
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold leading-none tabular-nums text-gray-100"
              style={{ fontSize: located.isComplete ? '2.5rem' : '4.5rem' }}
            >
              {bigValue}
            </span>
          </div>
        </div>

        <p className="mt-3 h-6 text-center text-sm text-gray-400">{nextLine}</p>

        <div className="mt-4 flex items-center justify-center gap-2">
          {located.isComplete ? (
            <button type="button" onClick={onExit} className={ctrlBtn}>
              Back to builder
            </button>
          ) : (
            <>
              <button type="button" onClick={pauseResume} className={ctrlBtn}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" onClick={skip} className={ctrlBtn}>
                Skip
              </button>
              <button type="button" onClick={onExit} className={ctrlBtn}>
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
