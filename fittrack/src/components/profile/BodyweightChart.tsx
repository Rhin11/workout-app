import type { BodyweightEntry } from '../../store/profileStore';

interface Props {
  entries: BodyweightEntry[]; // sorted ascending by date, length >= 2
}

const W = 320;
const H = 120;
const PAD = 10;

/** Minimal SVG line chart of bodyweight over time. */
export default function BodyweightChart({ entries }: Props) {
  const weights = entries.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i / (entries.length - 1)) * (W - 2 * PAD);
  const y = (w: number) => PAD + (1 - (w - min) / span) * (H - 2 * PAD);

  const points = entries.map((e, i) => `${x(i)},${y(e.weight)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Bodyweight over time">
      <polyline points={points} fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {entries.map((e, i) => (
        <circle key={e.id} cx={x(i)} cy={y(e.weight)} r="3" fill="#6C63FF" />
      ))}
    </svg>
  );
}
