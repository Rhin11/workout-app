/** Format a non-negative number of seconds as M:SS (e.g. 90 -> "1:30"). */
export function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
