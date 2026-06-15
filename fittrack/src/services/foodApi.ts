import { EMPTY_NUTRITION, type Nutrition } from '../constants/nutrition';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY as string | undefined;

const DATA_TYPE_RANK: Record<string, number> = {
  Foundation: 0,
  'SR Legacy': 1,
  'Survey (FNDDS)': 2,
  Branded: 3,
};

interface UsdaNutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

function dataTypeRank(dataType: string | undefined): number {
  if (!dataType) return 4;
  return DATA_TYPE_RANK[dataType] ?? 4;
}

/**
 * A branded entry whose description is a single generic all-caps word (e.g.
 * "BEEF", "CHICKEN") carries no useful identifying detail — hide it.
 */
function isLowQualityBranded(dataType: string | undefined, description: string): boolean {
  if (dataType !== 'Branded') return false;
  const trimmed = description.trim();
  if (/\s|,/.test(trimmed)) return false; // has detail (multiple words / clauses)
  return /[A-Z]/.test(trimmed) && trimmed === trimmed.toUpperCase();
}

function parseUsdaNutrients(foodNutrients: UsdaNutrient[] | undefined): Nutrition {
  if (!foodNutrients) return { ...EMPTY_NUTRITION };

  const lookup = new Map<string, number>();
  for (const item of foodNutrients) {
    if (item.nutrientNumber != null) {
      lookup.set(String(item.nutrientNumber), num(item.value));
    }
  }

  const get = (code: string) => lookup.get(code) ?? 0;

  const calories = get('208');
  const protein = get('203');
  const carbs = get('205');
  const fiber = get('291');
  const sugar = get('269');
  const fat = get('204');
  const saturatedFat = get('606');
  const transFat = get('605');
  const unsaturatedFat = Math.max(0, fat - saturatedFat - transFat);

  return {
    calories,
    protein,
    carbs,
    fiber,
    sugar,
    fat,
    saturatedFat,
    unsaturatedFat,
    transFat,
    sodium: get('307'),
    cholesterol: get('601'),
    potassium: get('306'),
    vitaminD: get('328'),
    calcium: get('301'),
    iron: get('303'),
  };
}

export interface FoodResult {
  id: string;
  name: string;
  per100g: Nutrition;
  /** Present only when the source provides serving size info (USDA). */
  serving?: { grams: number; label: string };
  /** USDA dataType ("Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"). */
  dataType?: string;
  /** Brand owner, for Branded USDA entries. */
  brandOwner?: string;
}

/** Build serving info from USDA servingSize / unit / household text, if usable. */
function parseUsdaServing(food: {
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
}): FoodResult['serving'] {
  const size = num(food.servingSize);
  if (size <= 0) return undefined;

  const unit = (food.servingSizeUnit ?? '').trim().toLowerCase();
  let grams: number;
  if (unit === 'g' || unit === 'grm' || unit === 'gram') {
    grams = size;
  } else if (unit === 'ml' || unit === 'mlt') {
    grams = size; // approximate 1 ml ≈ 1 g
  } else {
    return undefined;
  }
  if (grams <= 0) return undefined;

  const rounded = Math.round(grams);
  const household = food.householdServingFullText?.trim();
  const label = household ? `${household}, ${rounded}g` : `${rounded}g`;
  return { grams, label };
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
}

/** OFF stores sodium, cholesterol, potassium, calcium, iron per 100g in grams. */
function gramsToMg(value: unknown): number {
  return num(value) * 1000;
}

function parseNutriments(nutriments: Record<string, unknown> | undefined): Nutrition {
  if (!nutriments) return { ...EMPTY_NUTRITION };

  const calories = num(nutriments['energy-kcal_100g']) || num(nutriments['energy-kcal']) || 0;
  const protein = num(nutriments.proteins_100g);
  const carbs = num(nutriments.carbohydrates_100g);
  const fiber = num(nutriments.fiber_100g);
  const sugar = num(nutriments.sugars_100g);
  const fat = num(nutriments.fat_100g);
  const saturatedFat = num(nutriments['saturated-fat_100g']);
  const transFat = num(nutriments['trans-fat_100g']);
  const unsaturatedFat = Math.max(0, fat - saturatedFat - transFat);

  return {
    calories,
    protein,
    carbs,
    fiber,
    sugar,
    fat,
    saturatedFat,
    unsaturatedFat,
    transFat,
    sodium: gramsToMg(nutriments.sodium_100g),
    cholesterol: gramsToMg(nutriments.cholesterol_100g),
    potassium: gramsToMg(nutriments.potassium_100g),
    vitaminD: num(nutriments['vitamin-d_100g']),
    calcium: gramsToMg(nutriments.calcium_100g),
    iron: gramsToMg(nutriments.iron_100g),
  };
}

function mapProduct(product: Record<string, unknown>): FoodResult {
  const id = String(product.code ?? product._id ?? crypto.randomUUID());
  const name = String(product.product_name ?? product.product_name_en ?? 'Unknown food');
  const per100g = parseNutriments(product.nutriments as Record<string, unknown> | undefined);
  return { id, name, per100g };
}

export function scaleNutrition(per100g: Nutrition, grams: number): Nutrition {
  const factor = grams / 100;
  const scaled = { ...EMPTY_NUTRITION };
  for (const key of Object.keys(per100g) as (keyof Nutrition)[]) {
    scaled[key] = per100g[key] * factor;
  }
  return scaled;
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!USDA_API_KEY) {
    throw new Error('Missing VITE_USDA_API_KEY');
  }

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', trimmed);
  // Over-fetch so filtering/dedup still leaves a full list before the 15 cap.
  url.searchParams.set('pageSize', '50');
  url.searchParams.set('api_key', USDA_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);

  const data = (await res.json()) as {
    foods?: Array<{
      fdcId: number;
      description: string;
      dataType?: string;
      brandOwner?: string;
      foodNutrients?: UsdaNutrient[];
      servingSize?: number;
      servingSizeUnit?: string;
      householdServingFullText?: string;
    }>;
  };

  const ranked = (data.foods ?? [])
    .filter((food) => !isLowQualityBranded(food.dataType, food.description))
    .map((food) => ({
      rank: dataTypeRank(food.dataType),
      result: {
        id: String(food.fdcId),
        name: food.description,
        per100g: parseUsdaNutrients(food.foodNutrients),
        serving: parseUsdaServing(food),
        dataType: food.dataType,
        brandOwner: food.brandOwner?.trim() || undefined,
      } satisfies FoodResult,
    }));

  // Stable sort by dataType rank (preserves USDA relevance order within a tier).
  ranked.sort((a, b) => a.rank - b.rank);

  // Deduplicate by description, keeping the first (highest-ranked) occurrence.
  const seen = new Set<string>();
  const deduped: FoodResult[] = [];
  for (const { result } of ranked) {
    const key = result.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(result);
  }

  return deduped.slice(0, 15);
}

export async function lookupBarcode(barcode: string): Promise<FoodResult | null> {
  const trimmed = barcode.trim();
  if (!trimmed) return null;

  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(trimmed)}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);

  const data = (await res.json()) as { status: number; product?: Record<string, unknown> };
  if (data.status === 0 || !data.product) return null;

  return mapProduct(data.product);
}
