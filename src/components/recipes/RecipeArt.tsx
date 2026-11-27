"use client";

import { useState } from "react";
import {
  Beef,
  Cake,
  Coffee,
  CookingPot,
  Croissant,
  Drumstick,
  Egg,
  Fish,
  Milk,
  Salad,
  Soup,
  Wheat,
  Citrus,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { MainIngredient, Recipe } from "@/types";
import { cn } from "@/lib/cn";

const ICONS: Record<MainIngredient, LucideIcon> = {
  chicken: Drumstick,
  beef: Beef,
  pork: UtensilsCrossed,
  seafood: Fish,
  egg: Egg,
  tofu: Soup,
  vegetables: Salad,
  rice: CookingPot,
  noodles: Soup,
  pasta: Wheat,
  flour: Croissant,
  fruit: Citrus,
  dairy: Milk,
  coffee: Coffee,
};

interface Props {
  recipe: Pick<Recipe, "name" | "hue" | "mainIngredient" | "image" | "category">;
  className?: string;
  iconSize?: number;
  /** Large hero variant pushes the icon to the right. */
  variant?: "card" | "hero";
}

/**
 * Shows the recipe photo when one is configured; otherwise a generated,
 * on-brand artwork (no stock or fake photography is bundled).
 */
export function RecipeArt({ recipe, className, iconSize = 72, variant = "card" }: Props) {
  const [failed, setFailed] = useState(false);
  const h = recipe.hue;
  const Icon = recipe.category === "Dessert" ? Cake : ICONS[recipe.mainIngredient] ?? UtensilsCrossed;

  if (recipe.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={recipe.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
      />
    );
  }

  const focal = variant === "hero" ? "72% 45%" : "50% 42%";
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at ${focal}, hsl(${h} 42% 34%) 0%, hsl(${h} 26% 19%) 45%, #151816 100%)`,
      }}
    >
      {/* plate */}
      <div
        className="absolute rounded-full"
        style={{
          left: variant === "hero" ? "72%" : "50%",
          top: variant === "hero" ? "45%" : "42%",
          width: variant === "hero" ? "34%" : "58%",
          aspectRatio: "1",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, hsl(${h} 30% 88% / 0.16) 0%, hsl(${h} 30% 88% / 0.08) 58%, transparent 59%, transparent 66%, hsl(${h} 30% 88% / 0.12) 67%, transparent 70%)`,
        }}
      />
      <Icon
        size={variant === "hero" ? iconSize * 2.2 : iconSize}
        strokeWidth={1.25}
        className="absolute"
        style={{
          left: variant === "hero" ? "72%" : "50%",
          top: variant === "hero" ? "45%" : "42%",
          transform: "translate(-50%, -50%)",
          color: `hsl(${h} 45% 82% / 0.85)`,
        }}
      />
    </div>
  );
}
