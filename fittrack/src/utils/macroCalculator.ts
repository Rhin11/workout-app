export type BiologicalSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
export type WeightGoal = 'lose' | 'maintain' | 'gain';

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { value: 'light', label: 'Lightly active', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately active', multiplier: 1.55 },
  { value: 'very_active', label: 'Very active', multiplier: 1.725 },
  { value: 'athlete', label: 'Athlete', multiplier: 1.9 },
];

export const GOAL_OPTIONS: { value: WeightGoal; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain weight / muscle' },
];

export const DISCLAIMER =
  'These are general estimates, not medical or dietary advice. For personalized guidance, consult a registered dietitian or doctor.';

const LB_PER_KG = 2.2046226218;
const CAL_FLOOR_MALE = 1500;
const CAL_FLOOR_FEMALE = 1200;
const LOSE_DEFICIT = 400;
const GAIN_SURPLUS = 325;
const PROTEIN_G_PER_LB = 0.8;
const FAT_PCT = 0.25;

export interface MacroCalculatorInput {
  age: number;
  weightKg: number;
  heightCm: number;
  sex: BiologicalSex;
  activity: ActivityLevel;
  goal: WeightGoal;
  goalWeightKg?: number;
}

export interface MacroCalculatorResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes: string[];
}

export function lbsToKg(lbs: number): number {
  return lbs / LB_PER_KG;
}

export function kgToLbs(kg: number): number {
  return kg * LB_PER_KG;
}

export function ftInToCm(ft: number, inches: number): number {
  return ft * 30.48 + inches * 2.54;
}

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);
  return { ft, inches: inches === 12 ? 0 : inches };
}

function activityMultiplier(activity: ActivityLevel): number {
  return ACTIVITY_OPTIONS.find((o) => o.value === activity)?.multiplier ?? 1.2;
}

export function computeBmr(weightKg: number, heightCm: number, age: number, sex: BiologicalSex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

export function calculateMacros(input: MacroCalculatorInput): MacroCalculatorResult {
  const notes: string[] = [];
  const bmr = Math.round(computeBmr(input.weightKg, input.heightCm, input.age, input.sex));
  const tdee = Math.round(bmr * activityMultiplier(input.activity));

  let targetCalories = tdee;
  if (input.goal === 'lose') targetCalories = tdee - LOSE_DEFICIT;
  else if (input.goal === 'gain') targetCalories = tdee + GAIN_SURPLUS;

  const floor = input.sex === 'male' ? CAL_FLOOR_MALE : CAL_FLOOR_FEMALE;
  if (targetCalories < floor) {
    targetCalories = floor;
    notes.push(
      `Your calculated target was below ${floor} kcal. We've set ${floor} kcal as a safer starting point — faster loss usually isn't sustainable or recommended.`,
    );
  }

  if (input.goalWeightKg != null && input.goalWeightKg > 0) {
    const goalBmi = computeBmi(input.goalWeightKg, input.heightCm);
    if (goalBmi > 0 && goalBmi < 18.5) {
      notes.push(
        'Your goal weight may be on the low side for your height. If you have questions about a healthy target, a registered dietitian or doctor can help you find what works for you.',
      );
    }
  }

  const weightLbs = input.weightKg * LB_PER_KG;
  const proteinG = Math.round(weightLbs * PROTEIN_G_PER_LB);
  const proteinKcal = proteinG * 4;
  const fatKcal = Math.round(targetCalories * FAT_PCT);
  const fatG = Math.round(fatKcal / 9);
  const carbsKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    notes,
  };
}
