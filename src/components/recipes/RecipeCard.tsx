"use client";

import { Clock, Gauge, Heart, Users } from "lucide-react";
import type { Recipe } from "@/types";
import { TVCard } from "@/components/tv/TVCard";
import { RecipeArt } from "./RecipeArt";
import { totalMinutes } from "@/data/recipes";
import { DIFFICULTY_LABEL, formatMinutes } from "@/lib/format";
import { useFavorites } from "@/lib/storage/stores";
import { cn } from "@/lib/cn";

interface Props {
  recipe: Recipe;
  focusKey?: string;
  autoFocus?: boolean;
  groupDefault?: boolean;
  className?: string;
  progressLabel?: string;
}

export function RecipeMeta({ recipe, className }: { recipe: Recipe; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-5 gap-y-1", className)}>
      <span className="inline-flex items-center gap-1.5">
        <Clock size={18} aria-hidden /> {formatMinutes(totalMinutes(recipe))}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Gauge size={18} aria-hidden /> {DIFFICULTY_LABEL[recipe.difficulty]}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users size={18} aria-hidden /> {recipe.defaultServings}
      </span>
    </span>
  );
}

export function RecipeCard({ recipe, focusKey, autoFocus, groupDefault, className, progressLabel }: Props) {
  const favorites = useFavorites();
  const fav = favorites.includes(recipe.slug);
  return (
    <TVCard
      href={`/recipes/${recipe.slug}`}
      focusKey={focusKey ?? `recipe-${recipe.slug}`}
      autoFocus={autoFocus}
      groupDefault={groupDefault}
      className={className}
      title={recipe.name}
      ariaLabel={`${recipe.name}, ${formatMinutes(totalMinutes(recipe))}, ${DIFFICULTY_LABEL[recipe.difficulty]}, serves ${recipe.defaultServings}`}
      media={<RecipeArt recipe={recipe} />}
      badge={
        <span className="flex gap-2">
          <span className="chip">{recipe.category}</span>
          {fav && (
            <span className="chip" aria-label="Favorite">
              <Heart size={16} className="fill-[var(--danger)] text-[var(--danger)]" aria-hidden />
            </span>
          )}
          {progressLabel && <span className="chip bg-[var(--primary)]! text-[#16201a]!">{progressLabel}</span>}
        </span>
      }
      meta={<RecipeMeta recipe={recipe} />}
    />
  );
}
