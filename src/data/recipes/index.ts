import type { MainIngredient, MealType, Recipe, RecipeCategory } from "@/types";
import { asianRecipes } from "./asian";
import { worldRecipes } from "./world";

export const RECIPES: Recipe[] = [...asianRecipes, ...worldRecipes];

const BY_SLUG = new Map(RECIPES.map((r) => [r.slug, r]));
export const getRecipe = (slug: string): Recipe | undefined => BY_SLUG.get(slug);

export const CATEGORIES: RecipeCategory[] = [
  "Indonesian",
  "Japanese",
  "Korean",
  "Chinese",
  "Western",
  "Italian",
  "Breakfast",
  "Dessert",
  "Drinks",
  "Baking",
];

export const MAIN_INGREDIENTS: { value: MainIngredient; label: string }[] = [
  { value: "chicken", label: "Chicken" },
  { value: "beef", label: "Beef" },
  { value: "seafood", label: "Seafood" },
  { value: "egg", label: "Egg" },
  { value: "tofu", label: "Tofu" },
  { value: "vegetables", label: "Vegetables" },
  { value: "rice", label: "Rice" },
  { value: "noodles", label: "Noodles" },
  { value: "pasta", label: "Pasta" },
  { value: "flour", label: "Flour & dough" },
  { value: "fruit", label: "Fruit" },
  { value: "dairy", label: "Dairy" },
  { value: "coffee", label: "Coffee" },
];

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "dessert", label: "Dessert" },
  { value: "drink", label: "Drink" },
];

export const CUISINES: string[] = Array.from(new Set(RECIPES.map((r) => r.cuisine))).sort();

export const totalMinutes = (r: Recipe) => r.preparationMinutes + r.cookingMinutes;

/** Deterministic "recipe of the day" so the hero changes daily but not on every render. */
export function recipeOfTheDay(ts: number, offset = 0): Recipe {
  const day = Math.floor(ts / 86_400_000);
  return RECIPES[(day * 7 + offset) % RECIPES.length];
}
