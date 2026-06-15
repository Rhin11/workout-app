import { useNavigate } from 'react-router-dom';
import { formatOz } from '../macro/WaterTracker';
import { colors } from '../../constants/theme';
import type { MacroGoals } from '../../store/macroStore';

type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'water';

interface MacroRingConfig {
  key: MacroKey;
  label: string;
  color: string;
  unit: string;
  format: (value: number) => string;
}

const RING_CONFIG: MacroRingConfig[] = [
  {
    key: 'calories',
    label: 'Calories',
    color: colors.calories,
    unit: 'kcal',
    format: (v) => Math.round(v).toLocaleString(),
  },
  {
    key: 'protein',
    label: 'Protein',
    color: colors.protein,
    unit: 'g',
    format: (v) => String(Math.round(v)),
  },
  {
    key: 'carbs',
    label: 'Carbs',
    color: colors.carbs,
    unit: 'g',
    format: (v) => String(Math.round(v)),
  },
  {
    key: 'fat',
    label: 'Fat',
    color: colors.fat,
    unit: 'g',
    format: (v) => String(Math.round(v)),
  },
  {
    key: 'water',
    label: 'Water',
    color: colors.water,
    unit: ' oz',
    format: (v) => formatOz(v),
  },
];

interface RingProps {
  consumed: number;
  goal: number;
  color: string;
  label: string;
  unit: string;
  format: (value: number) => string;
}

function MacroProgressRing({ consumed, goal, color, label, unit, format }: RingProps) {
  const size = 88;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-100">{format(consumed)}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-gray-400">{label}</p>
      <p className="text-[11px] text-gray-500">
        {format(consumed)} / {format(goal)}
        {unit}
      </p>
    </div>
  );
}

interface Props {
  consumed: Record<MacroKey, number>;
  goals: MacroGoals;
}

export default function TodayMacroRings({ consumed, goals }: Props) {
  const navigate = useNavigate();

  return (
    <section
      role="link"
      tabIndex={0}
      onClick={() => navigate('/macros')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/macros');
        }
      }}
      className="cursor-pointer rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 transition duration-200 hover:border-[#6C63FF]"
    >
      <h2 className="mb-5 text-sm font-semibold text-gray-100">Today&apos;s macros</h2>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {RING_CONFIG.map(({ key, label, color, unit, format }) => (
          <MacroProgressRing
            key={key}
            consumed={consumed[key]}
            goal={goals[key]}
            color={color}
            label={label}
            unit={unit}
            format={format}
          />
        ))}
      </div>
    </section>
  );
}
