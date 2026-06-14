import { EMPTY_NUTRITION, type Nutrition } from '../constants/nutrition';

export interface FoodResult {
  id: string;
  name: string;
  per100g: Nutrition;
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

  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', trimmed);
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '10');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);

  const data = (await res.json()) as { products?: Record<string, unknown>[] };
  return (data.products ?? []).map(mapProduct);
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
