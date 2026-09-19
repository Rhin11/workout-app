/**
 * Set numbering shared by the active workout view and workout history.
 *
 * Warm-up sets are labeled W1, W2, ... in the order they appear; working
 * sets are numbered 1, 2, 3, ... counting only non-warm-up sets. This keeps
 * the numbering stable regardless of how many warm-ups precede the working
 * sets, and matches the convention used by Hevy/Strong.
 */
export function setLabel(sets: { isWarmup?: boolean }[], index: number): string {
  const target = sets[index];
  if (!target) return String(index + 1);

  if (target.isWarmup) {
    const warmupPosition = sets.slice(0, index + 1).filter((s) => s.isWarmup).length;
    return `W${warmupPosition}`;
  }

  const workingPosition = sets.slice(0, index + 1).filter((s) => !s.isWarmup).length;
  return String(workingPosition);
}
