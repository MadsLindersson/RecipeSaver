export type FoodType = 'dinner' | 'breakfast' | 'lunch' | 'dessert' | 'snack' | 'other';

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
  isMain: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  url?: string;
  foodType: FoodType;
  servings: number;
  servingsType: 'servings' | 'pieces';
  ingredients: Ingredient[];
  steps: string[];
  userId: string;
  authorName: string;
  originalUserId?: string;
  originalAuthorName?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

