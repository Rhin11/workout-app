interface Props {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export default function MacroRing({ label, current, goal, color, unit = 'g' }: Props) {
  return (
    <div className="flex flex-col items-center p-2">
      <span className="text-2xl font-bold" style={{ color }}>
        {current}
      </span>
      <span className="mt-0.5 text-xs text-gray-400">{label}</span>
      <span className="text-[11px] text-gray-500">
        / {goal}
        {unit}
      </span>
    </div>
  );
}
