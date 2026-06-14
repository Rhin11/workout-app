interface Props {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  color: string;
  onEditGoals?: () => void;
  showGear?: boolean;
  formatValue?: (value: number) => string;
}

export default function SummaryCard({
  label,
  consumed,
  goal,
  unit,
  color,
  onEditGoals,
  showGear,
  formatValue,
}: Props) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        {showGear && onEditGoals && (
          <button
            type="button"
            onClick={onEditGoals}
            className="text-sm text-gray-500 hover:text-indigo-400"
            aria-label="Edit goals"
            title="Edit goals"
          >
            ⚙
          </button>
        )}
      </div>
      <p className="text-lg font-semibold text-gray-100">
        {fmt(consumed)}
        <span className="text-sm font-normal text-gray-500"> / {fmt(goal)} {unit}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
