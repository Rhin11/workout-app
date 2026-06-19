import { useMemo } from 'react';
import type { BarbellSession } from '../../store/barbellStore';
import { computeRecurringStickingInsight, sessionDate } from '../../utils/barbellTrends';

interface Props {
  exerciseName: string;
  /** All sessions for this lift (any order). */
  sessions: BarbellSession[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatWeight(session: BarbellSession): string {
  if (session.weight == null) return '—';
  return `${session.weight} ${session.weightUnit ?? 'lbs'}`;
}

const SPARK_W = 240;
const SPARK_H = 44;
const PAD = 6;

/** Minimal sparkline mirroring BodyweightChart, with the latest value highlighted. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (SPARK_W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (SPARK_H - 2 * PAD);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const lastIdx = values.length - 1;

  return (
    <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(lastIdx)} cy={y(values[lastIdx])} r="3" fill={color} />
    </svg>
  );
}

function MetricTrend({ label, values, unit, color }: {
  label: string;
  values: number[];
  unit: string;
  color: string;
}) {
  const latest = values[values.length - 1];
  const prev = values.length >= 2 ? values[values.length - 2] : null;
  const delta = prev != null ? latest - prev : null;

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {delta != null && (
          <span className={`text-xs ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-gray-100">
        <span className="text-lg font-semibold">{latest.toFixed(2)}</span>
        <span className="ml-1 text-xs text-gray-500">{unit}</span>
      </p>
      <div className="mt-2">
        <Sparkline values={values} color={color} />
      </div>
    </div>
  );
}

export default function LiftTrend({ exerciseName, sessions }: Props) {
  // Chronological (oldest → newest) for trend lines.
  const chrono = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(sessionDate(a)).getTime() - new Date(sessionDate(b)).getTime(),
      ),
    [sessions],
  );
  const insight = useMemo(() => computeRecurringStickingInsight(sessions), [sessions]);

  const avgSeries = chrono.map((s) => s.analysis.avg_speed);
  const peakSeries = chrono.map((s) => s.analysis.peak_speed);
  const hasTrend = chrono.length >= 2;

  // Most-recent-first for the per-session rows.
  const rows = [...chrono].reverse();

  return (
    <div className="mb-4 space-y-4">
      {insight && (
        <div className="rounded-lg border border-[#6C63FF]/50 bg-[#6C63FF]/10 p-3">
          <p className="text-sm text-gray-100">
            <span className="mr-1.5">📌</span>
            Sticking point <span className="font-semibold">{insight.label}</span> in{' '}
            <span className="font-semibold">
              {insight.count} of your last {insight.total}
            </span>{' '}
            {exerciseName} analyses.
          </p>
        </div>
      )}

      {hasTrend && (
        <div className="grid grid-cols-2 gap-3">
          <MetricTrend label="Avg speed" values={avgSeries} unit="m/s" color="#6C63FF" />
          <MetricTrend label="Peak speed" values={peakSeries} unit="m/s" color="#38BDF8" />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#2A2A2A]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2A2A] text-[0.65rem] uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Weight</th>
              <th className="px-3 py-2 text-right font-medium">Avg</th>
              <th className="px-3 py-2 text-right font-medium">Peak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-[#1f1f1f] last:border-0">
                <td className="px-3 py-2 text-gray-300">{formatDate(sessionDate(s))}</td>
                <td className="px-3 py-2 text-right text-gray-300">{formatWeight(s)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-300">
                  {s.analysis.avg_speed.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-300">
                  {s.analysis.peak_speed.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
