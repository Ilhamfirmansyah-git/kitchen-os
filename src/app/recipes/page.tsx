"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState, Page, PageHeader } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";
import { TVInput } from "@/components/tv/TVControls";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { OptionPicker } from "@/components/tv/OptionPicker";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { CATEGORIES, CUISINES, MAIN_INGREDIENTS, MEAL_TYPES, RECIPES } from "@/data/recipes";
import { EMPTY_FILTERS, filterRecipes, type RecipeFilters } from "@/lib/recipes/search";
import { DIFFICULTY_LABEL } from "@/lib/format";
import type { Difficulty } from "@/types";

// Kept in memory so filters survive opening a recipe and pressing Back.
let remembered: RecipeFilters = EMPTY_FILTERS;

type PickerKey = "time" | "difficulty" | "ingredient" | "cuisine" | "meal" | null;

const TIME_OPTIONS = [
  { value: null, label: "Any time" },
  { value: 20, label: "Up to 20 min" },
  { value: 30, label: "Up to 30 min" },
  { value: 45, label: "Up to 45 min" },
  { value: 90, label: "Up to 1½ hours" },
];

export default function RecipesPage() {
  const [filters, setFiltersState] = useState<RecipeFilters>(remembered);
  const [picker, setPicker] = useState<PickerKey>(null);
  const setFilters = (patch: Partial<RecipeFilters>) =>
    setFiltersState((f) => {
      const next = { ...f, ...patch };
      remembered = next;
      return next;
    });

  const results = useMemo(() => filterRecipes(RECIPES, filters), [filters]);
  const activeCount =
    (filters.maxMinutes != null ? 1 : 0) +
    (filters.difficulty !== "all" ? 1 : 0) +
    (filters.mainIngredient !== "all" ? 1 : 0) +
    (filters.cuisine !== "all" ? 1 : 0) +
    (filters.mealType !== "all" ? 1 : 0);

  const timeLabel = TIME_OPTIONS.find((o) => o.value === filters.maxMinutes)?.label ?? "Any time";
  const ingLabel = MAIN_INGREDIENTS.find((o) => o.value === filters.mainIngredient)?.label;
  const mealLabel = MEAL_TYPES.find((o) => o.value === filters.mealType)?.label;

  return (
    <Page>
      <PageHeader title="Recipes" subtitle={`${results.length} of ${RECIPES.length} recipes`} />

      <FocusGroup id="recipes-search" className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={28} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden />
          <TVInput
            label="Search recipes by name, ingredient or category"
            placeholder="Search by name, ingredient or category…"
            value={filters.query}
            onChange={(query) => setFilters({ query })}
            focusKey="recipes-search"
            className="pl-16"
          />
        </div>
        {filters.query && (
          <TVButton icon={X} onSelect={() => setFilters({ query: "" })} focusKey="recipes-clear-search">
            Clear
          </TVButton>
        )}
      </FocusGroup>

      <FocusGroup id="recipes-categories" restore className="shelf mt-8" label="Categories">
        <TVButton
          active={filters.category === "all"}
          variant={filters.category === "all" ? "primary" : "secondary"}
          onSelect={() => setFilters({ category: "all" })}
          focusKey="cat-all"
          groupDefault={filters.category === "all"}
        >
          All
        </TVButton>
        {CATEGORIES.map((c) => (
          <TVButton
            key={c}
            active={filters.category === c}
            variant={filters.category === c ? "primary" : "secondary"}
            onSelect={() => setFilters({ category: c })}
            focusKey={`cat-${c}`}
            groupDefault={filters.category === c}
          >
            {c}
          </TVButton>
        ))}
      </FocusGroup>

      <FocusGroup id="recipes-filters" className="mt-2 flex flex-wrap gap-3">
        <TVButton icon={SlidersHorizontal} onSelect={() => setPicker("time")} active={filters.maxMinutes != null} focusKey="filter-time">
          {timeLabel}
        </TVButton>
        <TVButton onSelect={() => setPicker("difficulty")} active={filters.difficulty !== "all"} focusKey="filter-difficulty">
          {filters.difficulty === "all" ? "Any difficulty" : DIFFICULTY_LABEL[filters.difficulty]}
        </TVButton>
        <TVButton onSelect={() => setPicker("ingredient")} active={filters.mainIngredient !== "all"} focusKey="filter-ingredient">
          {ingLabel ?? "Any main ingredient"}
        </TVButton>
        <TVButton onSelect={() => setPicker("cuisine")} active={filters.cuisine !== "all"} focusKey="filter-cuisine">
          {filters.cuisine === "all" ? "Any cuisine" : filters.cuisine}
        </TVButton>
        <TVButton onSelect={() => setPicker("meal")} active={filters.mealType !== "all"} focusKey="filter-meal">
          {mealLabel ?? "Any meal"}
        </TVButton>
        {activeCount > 0 && (
          <TVButton variant="ghost" icon={X} onSelect={() => setFilters({ ...EMPTY_FILTERS, query: filters.query, category: filters.category })} focusKey="filter-reset">
            Reset filters
          </TVButton>
        )}
      </FocusGroup>

      <div className="mt-10">
        {results.length ? (
          <div className="grid grid-cols-4 gap-x-8 gap-y-10">
            {results.map((r, i) => (
              <RecipeCard key={r.slug} recipe={r} autoFocus={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search size={56} aria-hidden />}
            title="No recipes match"
            body="Try another search term or remove a filter."
            action={
              <TVButton variant="primary" onSelect={() => setFilters(EMPTY_FILTERS)} focusKey="recipes-empty-reset">
                Show all recipes
              </TVButton>
            }
          />
        )}
      </div>

      <OptionPicker
        open={picker === "time"}
        title="Cooking time"
        value={filters.maxMinutes}
        options={TIME_OPTIONS}
        onChange={(maxMinutes) => setFilters({ maxMinutes })}
        onClose={() => setPicker(null)}
      />
      <OptionPicker<Difficulty | "all">
        open={picker === "difficulty"}
        title="Difficulty"
        value={filters.difficulty}
        options={[
          { value: "all", label: "Any difficulty" },
          { value: "easy", label: "Easy" },
          { value: "medium", label: "Medium" },
          { value: "hard", label: "Hard" },
        ]}
        onChange={(difficulty) => setFilters({ difficulty })}
        onClose={() => setPicker(null)}
      />
      <OptionPicker
        open={picker === "ingredient"}
        title="Main ingredient"
        value={filters.mainIngredient}
        options={[{ value: "all" as const, label: "Any main ingredient" }, ...MAIN_INGREDIENTS]}
        onChange={(mainIngredient) => setFilters({ mainIngredient })}
        onClose={() => setPicker(null)}
      />
      <OptionPicker
        open={picker === "cuisine"}
        title="Cuisine"
        value={filters.cuisine}
        options={[{ value: "all", label: "Any cuisine" }, ...CUISINES.map((c) => ({ value: c, label: c }))]}
        onChange={(cuisine) => setFilters({ cuisine })}
        onClose={() => setPicker(null)}
      />
      <OptionPicker
        open={picker === "meal"}
        title="Meal type"
        value={filters.mealType}
        options={[{ value: "all" as const, label: "Any meal" }, ...MEAL_TYPES]}
        onChange={(mealType) => setFilters({ mealType })}
        onClose={() => setPicker(null)}
      />
    </Page>
  );
}
