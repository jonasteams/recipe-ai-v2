// Fix: Define and export all necessary types for the application.
export type Language = 'en' | 'fr' | 'ar';

export type CookMode = 'standard' | 'thermomix';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Nutrition {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
}

export interface Recipe {
  recipeName: string;
  description: string;
  servings: number;
  cookingTime: string;
  nutrition: Nutrition;
  rating: number;
  ingredients: Ingredient[];
  standardInstructions: string[];
  thermomixInstructions: string[];
  imageUrl: string;
}