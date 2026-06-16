// Shared WebAudio cues for timers. Lazily creates a single AudioContext and
// degrades silently if WebAudio is unavailable or blocked.

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = audioCtx ?? new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Resume the audio context. Call within a user gesture so later cues can fire. */
export function primeAudio(): void {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, peak = 0.3): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short single beep for a phase transition. */
export function playBeep(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  tone(ctx, 880, ctx.currentTime, 0.18);
}

/** Distinct ascending three-tone chime for whole-session completion. */
export function playCompleteChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  [
    { f: 660, t: 0 },
    { f: 880, t: 0.18 },
    { f: 1320, t: 0.36 },
  ].forEach(({ f, t }) => tone(ctx, f, now + t, 0.3));
}
