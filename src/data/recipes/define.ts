import type { CookingStep, Ingredient, Recipe, Unit } from "@/types";

/** Compact authoring helpers so recipe files stay readable. */

export type IngredientTuple = [id: string, name: string, quantity: number, unit: Unit, notes?: string];

export interface StepInput {
  /** Short title shown in Cooking Mode. */
  t: string;
  /** Instruction. Use {t:180} for a Celsius temperature. */
  i: string;
  min?: number;
  sec?: number;
  uses?: string[];
  tip?: string;
}

export type RecipeInput = Omit<Recipe, "id" | "ingredients" | "steps"> & {
  ingredients: IngredientTuple[];
  steps: StepInput[];
  optional?: string[];
};

export function defineRecipe(input: RecipeInput): Recipe {
  const { optional = [], ...rest } = input;
  const ingredients: Ingredient[] = input.ingredients.map(([id, name, quantity, unit, notes]) => ({
    id,
    name,
    quantity,
    unit,
    ...(notes ? { notes } : {}),
    ...(optional.includes(id) ? { optional: true } : {}),
  }));
  const ids = new Set(ingredients.map((i) => i.id));
  const steps: CookingStep[] = input.steps.map((s, idx) => {
    const durationSeconds = (s.min ?? 0) * 60 + (s.sec ?? 0);
    (s.uses ?? []).forEach((u) => {
      if (!ids.has(u)) throw new Error(`Recipe ${input.slug}: step ${idx + 1} uses unknown ingredient "${u}"`);
    });
    return {
      id: `${input.slug}-s${idx + 1}`,
      order: idx + 1,
      title: s.t,
      instruction: s.i,
      ...(durationSeconds > 0 ? { durationSeconds } : {}),
      ...(s.uses?.length ? { ingredientIds: s.uses } : {}),
      ...(s.tip ? { tip: s.tip } : {}),
    };
  });
  return { ...rest, id: input.slug, ingredients, steps };
}
