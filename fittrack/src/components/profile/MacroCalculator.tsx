import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMacroStore } from '../../store/macroStore';
import { useProfileStore } from '../../store/profileStore';
import {
  ACTIVITY_OPTIONS,
  DISCLAIMER,
  GOAL_OPTIONS,
  calculateMacros,
  ftInToCm,
  lbsToKg,
  type ActivityLevel,
  type BiologicalSex,
  type MacroCalculatorResult,
  type WeightGoal,
} from '../../utils/macroCalculator';

const inputClass =
  'w-full rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#6C63FF]';
const labelClass = 'mb-1 block text-xs font-medium text-gray-400';

interface Props {
  /** When true, show a close/back control (e.g. opened from Macros goals). */
  embedded?: boolean;
  onClose?: () => void;
  /** Hide the intro blurb when the parent already shows it (e.g. collapsible header). */
  hideIntro?: boolean;
}

export default function MacroCalculator({ embedded = false, onClose, hideIntro = false }: Props) {
  const navigate = useNavigate();
  const units = useProfileStore((s) => s.units);
  const bodyweights = useProfileStore((s) => s.bodyweights);
  const goals = useMacroStore((s) => s.goals);
  const setGoals = useMacroStore((s) => s.setGoals);

  const latestBw = bodyweights[bodyweights.length - 1];

  const [age, setAge] = useState('');
  const [sex, setSex] = useState<BiologicalSex>('male');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<WeightGoal>('maintain');
  const [weight, setWeight] = useState(() =>
    latestBw ? String(latestBw.weight) : '',
  );
  const [goalWeight, setGoalWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  const [result, setResult] = useState<MacroCalculatorResult | null>(null);
  const [draftCal, setDraftCal] = useState('');
  const [draftProtein, setDraftProtein] = useState('');
  const [draftCarbs, setDraftCarbs] = useState('');
  const [draftFat, setDraftFat] = useState('');
  const [applied, setApplied] = useState(false);

  const imperial = units === 'lbs';

  const parsed = useMemo(() => {
    const ageN = Number(age);
    const weightN = Number(weight);
    if (!(ageN > 0) || !(weightN > 0)) return null;

    let heightCmVal = 0;
    if (imperial) {
      const ft = Number(heightFt) || 0;
      const inches = Number(heightIn) || 0;
      if (ft <= 0 && inches <= 0) return null;
      heightCmVal = ftInToCm(ft, inches);
    } else {
      heightCmVal = Number(heightCm);
      if (!(heightCmVal > 0)) return null;
    }

    const weightKg = imperial ? lbsToKg(weightN) : weightN;
    const goalWeightN = Number(goalWeight);
    const goalWeightKg =
      goalWeight.trim() && goalWeightN > 0
        ? imperial
          ? lbsToKg(goalWeightN)
          : goalWeightN
        : undefined;

    return {
      age: ageN,
      weightKg,
      heightCm: heightCmVal,
      sex,
      activity,
      goal,
      goalWeightKg,
    };
  }, [
    age,
    weight,
    heightCm,
    heightFt,
    heightIn,
    imperial,
    sex,
    activity,
    goal,
    goalWeight,
  ]);

  const handleCalculate = () => {
    if (!parsed) return;
    const calc = calculateMacros(parsed);
    setResult(calc);
    setDraftCal(String(calc.targetCalories));
    setDraftProtein(String(calc.proteinG));
    setDraftCarbs(String(calc.carbsG));
    setDraftFat(String(calc.fatG));
    setApplied(false);
  };

  const handleApply = () => {
    const calories = Math.round(Number(draftCal) || 0);
    const protein = Math.round(Number(draftProtein) || 0);
    const carbs = Math.round(Number(draftCarbs) || 0);
    const fat = Math.round(Number(draftFat) || 0);
    if (calories <= 0) return;

    setGoals({
      ...goals,
      calories,
      protein,
      carbs,
      fat,
    });
    setApplied(true);
  };

  return (
    <div className="space-y-4">
      {embedded && onClose && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Macro calculator</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
      )}

      {!hideIntro && (
        <p className="text-sm text-gray-500">
          Estimate a starting point for daily calories and macros based on your stats and goal.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Age</span>
          <input
            type="number"
            min={13}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block col-span-2 sm:col-span-1">
          <span className={labelClass}>Sex (for BMR formula)</span>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as BiologicalSex)}
            className={inputClass}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        {imperial ? (
          <>
            <label className="block">
              <span className={labelClass}>Height (ft)</span>
              <input
                type="number"
                min={0}
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Height (in)</span>
              <input
                type="number"
                min={0}
                max={11}
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                className={inputClass}
              />
            </label>
          </>
        ) : (
          <label className="block col-span-2">
            <span className={labelClass}>Height (cm)</span>
            <input
              type="number"
              min={0}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={inputClass}
            />
          </label>
        )}

        <label className="block">
          <span className={labelClass}>Current weight ({units})</span>
          <input
            type="number"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block col-span-2 sm:col-span-3">
          <span className={labelClass}>Activity level</span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className={inputClass}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block col-span-2 sm:col-span-3">
          <span className={labelClass}>Goal</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as WeightGoal)}
            className={inputClass}
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {goal !== 'maintain' && (
          <label className="block col-span-2 sm:col-span-3">
            <span className={labelClass}>Goal weight ({units}, optional)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={handleCalculate}
        disabled={!parsed}
        className="w-full rounded-lg bg-[#6C63FF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a52e0] disabled:opacity-40"
      >
        Calculate
      </button>

      {result && (
        <div className="space-y-4 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Maintenance (TDEE)</p>
              <p className="text-lg font-semibold text-gray-300">{result.tdee} kcal</p>
              <p className="text-[11px] text-gray-600">BMR ~{result.bmr} kcal</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Recommended target</p>
              <p className="text-lg font-semibold text-[#6C63FF]">{result.targetCalories} kcal</p>
            </div>
          </div>

          {result.notes.map((note) => (
            <p key={note} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
              {note}
            </p>
          ))}

          <p className="text-xs text-gray-500">{DISCLAIMER}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block">
              <span className={labelClass}>Calories</span>
              <input
                type="number"
                min={0}
                value={draftCal}
                onChange={(e) => setDraftCal(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Protein (g)</span>
              <input
                type="number"
                min={0}
                value={draftProtein}
                onChange={(e) => setDraftProtein(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Carbs (g)</span>
              <input
                type="number"
                min={0}
                value={draftCarbs}
                onChange={(e) => setDraftCarbs(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Fat (g)</span>
              <input
                type="number"
                min={0}
                value={draftFat}
                onChange={(e) => setDraftFat(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-[#6C63FF] px-5 py-2 text-sm font-medium text-white hover:bg-[#5a52e0]"
            >
              Apply these as my goals
            </button>
            {applied && (
              <span className="flex items-center text-sm text-green-400">
                Goals updated on Macros page
              </span>
            )}
            {!embedded && (
              <button
                type="button"
                onClick={() => navigate('/macros')}
                className="rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:border-[#6C63FF] hover:text-white"
              >
                Go to Macros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
