import type { Analysis } from '../../utils/barbellAnalysis';

interface Props {
  analysis: Analysis;
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-gray-100">
        <span className="text-xl font-semibold">{value}</span>
        {unit && <span className="ml-1 text-xs text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}

export default function StatsRow({ analysis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Reps" value={String(analysis.rep_count)} />
      <StatCard label="Avg speed" value={analysis.avg_speed.toFixed(2)} unit="m/s" />
      <StatCard label="Peak speed" value={analysis.peak_speed.toFixed(2)} unit="m/s" />
      <StatCard label="Time under tension" value={analysis.time_under_tension_s.toFixed(1)} unit="s" />
    </div>
  );
}
