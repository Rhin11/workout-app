import { useEffect, useRef } from 'react';
import { useRestTimer } from '../../store/restTimerStore';
import { formatMMSS } from '../../utils/time';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = audioCtx ?? new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Prime/resume audio within a user gesture so the chime can fire later. */
function primeAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function playChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  // Two short ascending beeps.
  [
    { t: 0, freq: 784 },
    { t: 0.22, freq: 1047 },
  ].forEach(({ t, freq }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.3, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.2);
  });
}

export default function RestTimerBar() {
  const activeExerciseId = useRestTimer((s) => s.activeExerciseId);
  const exerciseName = useRestTimer((s) => s.exerciseName);
  const totalSeconds = useRestTimer((s) => s.totalSeconds);
  const remainingSeconds = useRestTimer((s) => s.remainingSeconds);
  const paused = useRestTimer((s) => s.paused);
  const finished = useRestTimer((s) => s.finished);
  const tick = useRestTimer((s) => s.tick);
  const adjust = useRestTimer((s) => s.adjust);
  const togglePause = useRestTimer((s) => s.togglePause);
  const dismiss = useRestTimer((s) => s.dismiss);

  const active = activeExerciseId !== null;
  const playedRef = useRef(false);

  // Drive the countdown; ticks off an absolute timestamp so background
  // throttling can't desync it. Re-tick when the tab becomes visible again.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(tick, 250);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, tick]);

  // Resume audio when a timer starts (we're shortly after the click that
  // completed/added the set, so the gesture is still active).
  useEffect(() => {
    if (active) primeAudio();
  }, [active]);

  // Chime + vibrate once on completion.
  useEffect(() => {
    if (finished && !playedRef.current) {
      playedRef.current = true;
      playChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    if (!finished) playedRef.current = false;
  }, [finished]);

  if (!active) return null;

  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;

  const ctrlBtn =
    'flex h-9 items-center justify-center rounded-lg border border-[#2A2A2A] px-3 text-sm font-medium text-gray-300 transition-colors hover:border-[#6C63FF] hover:text-white disabled:opacity-40';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2A2A2A] bg-[#141414]/95 backdrop-blur">
      {/* Progress bar (depletes as time runs out) */}
      <div className="h-1 w-full bg-[#2A2A2A]">
        <div
          className="h-full transition-[width] duration-200 ease-linear"
          style={{
            width: `${finished ? 100 : progress * 100}%`,
            backgroundColor: finished ? '#22c55e' : '#6C63FF',
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs uppercase tracking-wide text-gray-500">
            {finished ? 'Rest complete' : paused ? 'Paused' : 'Resting'} · {exerciseName}
          </p>
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: finished ? '#22c55e' : '#FFFFFF' }}
          >
            {finished ? "Rest complete" : formatMMSS(remainingSeconds)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => adjust(-15)} className={ctrlBtn} disabled={finished}>
            −15s
          </button>
          <button type="button" onClick={() => adjust(15)} className={ctrlBtn}>
            +15s
          </button>
          {!finished && (
            <button type="button" onClick={togglePause} className={ctrlBtn}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 items-center justify-center rounded-lg bg-[#6C63FF] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0]"
          >
            {finished ? 'Done' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
