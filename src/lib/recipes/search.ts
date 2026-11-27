import type { Difficulty, MainIngredient, MealType, Recipe, RecipeCategory } from "@/types";
import { totalMinutes } from "@/data/recipes";

export interface RecipeFilters {
  query: string;
  category: RecipeCategory | "all";
  maxMinutes: number | null; // null = any
  difficulty: Difficulty | "all";
  mainIngredient: MainIngredient | "all";
  cuisine: string | "all";
  mealType: MealType | "all";
}

export const EMPTY_FILTERS: RecipeFilters = {
  query: "",
  category: "all",
  maxMinutes: null,
  difficulty: "all",
  mainIngredient: "all",
  cuisine: "all",
  mealType: "all",
};

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ");

/** Searches name, description, category, cuisine, tags and ingredient names. Every word must match. */
export function matchesQuery(recipe: Recipe, query: string): boolean {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalise(
    [
      recipe.name,
      recipe.description,
      recipe.category,
      recipe.cuisine,
      recipe.mainIngredient,
      ...(recipe.tags ?? []),
      ...recipe.ingredients.map((i) => i.name),
    ].join(" "),
  );
  return words.every((w) => hay.includes(w));
}

export function filterRecipes(recipes: Recipe[], f: RecipeFilters): Recipe[] {
  return recipes.filter(
    (r) =>
      (f.category === "all" || r.category === f.category) &&
      (f.maxMinutes == null || totalMinutes(r) <= f.maxMinutes) &&
      (f.difficulty === "all" || r.difficulty === f.difficulty) &&
      (f.mainIngredient === "all" || r.mainIngredient === f.mainIngredient) &&
      (f.cuisine === "all" || r.cuisine === f.cuisine) &&
      (f.mealType === "all" || r.mealTypes.includes(f.mealType)) &&
      matchesQuery(r, f.query),
  );
}

/** Ranks recipes by how many of the given ingredients they use (for "what can I cook with…"). */
export function recipesForIngredients(recipes: Recipe[], ingredients: string[]): { recipe: Recipe; matched: string[] }[] {
  const wanted = ingredients.map(normalise).map((s) => s.trim()).filter(Boolean);
  if (!wanted.length) return [];
  return recipes
    .map((recipe) => {
      const names = recipe.ingredients.map((i) => normalise(i.name));
      const matched = wanted.filter((w) => names.some((n) => n.includes(w) || n.includes(w.replace(/s$/, ""))));
      return { recipe, matched };
    })
    .filter((r) => r.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || totalMinutes(a.recipe) - totalMinutes(b.recipe));
}
