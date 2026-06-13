const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export interface FoodResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function searchFood(query: string): Promise<FoodResult[]> {
  // Implemented in Phase 4
  void OPEN_FOOD_FACTS_URL;
  void query;
  return [];
}

export async function lookupBarcode(barcode: string): Promise<FoodResult | null> {
  // Implemented in Phase 4
  void barcode;
  return null;
}
