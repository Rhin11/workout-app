export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
  fat: number;
  saturatedFat: number;
  unsaturatedFat: number;
  transFat: number;
  sodium: number;
  cholesterol: number;
  potassium: number;
  vitaminD: number;
  calcium: number;
  iron: number;
};

export const NUTRITION_FIELDS: { key: keyof Nutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g' },
  { key: 'unsaturatedFat', label: 'Unsaturated fat', unit: 'g' },
  { key: 'transFat', label: 'Trans fat', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
];

export const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fiber: 0,
  sugar: 0,
  fat: 0,
  saturatedFat: 0,
  unsaturatedFat: 0,
  transFat: 0,
  sodium: 0,
  cholesterol: 0,
  potassium: 0,
  vitaminD: 0,
  calcium: 0,
  iron: 0,
};

export function sumNutrition(entries: Nutrition[]): Nutrition {
  const total = { ...EMPTY_NUTRITION };
  for (const entry of entries) {
    for (const { key } of NUTRITION_FIELDS) {
      total[key] += entry[key];
    }
  }
  return total;
}

export function formatNutritionValue(key: keyof Nutrition, value: number): string {
  if (key === 'calories') return Math.round(value).toString();
  if (key === 'sodium' || key === 'cholesterol' || key === 'potassium' || key === 'calcium' || key === 'iron') {
    return Math.round(value).toString();
  }
  if (key === 'vitaminD') return value.toFixed(1);
  return value.toFixed(1);
}
