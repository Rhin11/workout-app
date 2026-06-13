export interface FoodLogModel {
  id: string;
  userId: string;
  date: Date;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  grams: number;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}
