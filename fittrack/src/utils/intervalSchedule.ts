import type { Phase, PhaseType } from '../store/conditioningStore';

export const GET_READY_SECONDS = 3;

export type SegmentType = PhaseType | 'ready';

export interface Segment {
  name: string;
  type: SegmentType;
  durationSec: number;
  /** 1-based round this segment belongs to; 0 for the "Get ready" lead-in. */
  round: number;
}

export interface Schedule {
  segments: Segment[];
  /** Cumulative end time (ms) for each segment, same length as `segments`. */
  endsMs: number[];
  totalMs: number;
}

/** Expand phases × rounds into an ordered segment list, prefixed with "Get ready". */
export function buildSchedule(phases: Phase[], rounds: number): Schedule {
  const segments: Segment[] = [
    { name: 'Get ready', type: 'ready', durationSec: GET_READY_SECONDS, round: 0 },
  ];
  for (let r = 1; r <= rounds; r += 1) {
    for (const p of phases) {
      segments.push({ name: p.name, type: p.type, durationSec: p.durationSec, round: r });
    }
  }
  const endsMs: number[] = [];
  let acc = 0;
  for (const seg of segments) {
    acc += seg.durationSec * 1000;
    endsMs.push(acc);
  }
  return { segments, endsMs, totalMs: acc };
}

export interface Located {
  index: number;
  segment: Segment;
  remainingMs: number;
  nextSegment: Segment | null;
  isComplete: boolean;
}

/** Map an elapsed time (ms) onto the schedule. Pure — derived entirely from timestamps. */
export function locate(elapsedMs: number, schedule: Schedule): Located {
  const { segments, endsMs, totalMs } = schedule;
  const clamped = Math.max(0, elapsedMs);
  if (clamped >= totalMs) {
    const lastIndex = segments.length - 1;
    return {
      index: lastIndex,
      segment: segments[lastIndex],
      remainingMs: 0,
      nextSegment: null,
      isComplete: true,
    };
  }
  let index = 0;
  while (index < endsMs.length && clamped >= endsMs[index]) index += 1;
  return {
    index,
    segment: segments[index],
    remainingMs: endsMs[index] - clamped,
    nextSegment: index + 1 < segments.length ? segments[index + 1] : null,
    isComplete: false,
  };
}

/** Total work time (ms) of one pass through the phases × rounds — excludes "Get ready". */
export function totalSessionMs(phases: Phase[], rounds: number): number {
  const perRound = phases.reduce((sum, p) => sum + p.durationSec, 0);
  return perRound * Math.max(1, rounds) * 1000;
}
