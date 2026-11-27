"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, CirclePlay, Clock, Flame, Gauge, Heart, Info, Play, Users, UtensilsCrossed } from "lucide-react";
import { getRecipe, totalMinutes } from "@/data/recipes";
import { RecipeArt } from "./RecipeArt";
import { TVButton } from "@/components/tv/TVButton";
import { TVStepper } from "@/components/tv/TVControls";
import { Focusable } from "@/components/tv/Focusable";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { DIFFICULTY_LABEL, formatMinutes } from "@/lib/format";
import { formatIngredient, renderInstruction } from "@/lib/recipes/units";
import { recordViewed, saveSession, toggleFavorite, useFavorites, useSessions, useSettings } from "@/lib/storage/stores";
import { newSession } from "@/lib/cooking/session";
import { getVideo } from "@/data/videos";
import { timestamp } from "@/lib/cn";

export function RecipeDetail({ slug }: { slug: string }) {
  const recipe = getRecipe(slug)!;
  const router = useRouter();
  const settings = useSettings();
  const favorites = useFavorites();
  const sessions = useSessions();
  const session = sessions[slug];
  const [servings, setServings] = useState(recipe.defaultServings);
  const fav = favorites.includes(slug);
  const video = recipe.videoId ? getVideo(recipe.videoId) : undefined;

  useEffect(() => {
    recordViewed(slug);
  }, [slug]);

  const startAt = (stepIndex: number) => {
    const s = newSession(recipe, servings, timestamp());
    saveSession({ ...s, stepIndex });
    router.push(`/cooking/${slug}`);
  };

  const ingredientsById = new Map(recipe.ingredients.map((i) => [i.id, i]));

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative h-[34rem] overflow-hidden">
        <RecipeArt recipe={recipe} variant="hero" iconSize={110} />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
        <div className="relative flex h-full max-w-[60rem] flex-col justify-center px-14">
          <div className="text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
            {recipe.cuisine === recipe.category ? recipe.cuisine : `${recipe.cuisine} · ${recipe.category}`}
          </div>
          <h1 className="mt-2 font-display text-[4rem] font-extrabold leading-[1.02] tracking-tight">{recipe.name}</h1>
          <p className="mt-4 text-[1.5rem] leading-snug text-[var(--text-secondary)]">{recipe.description}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-[1.375rem]">
            <Fact icon={<Clock size={24} />} label="Prep" value={formatMinutes(recipe.preparationMinutes)} />
            <Fact icon={<Flame size={24} />} label="Cook" value={recipe.cookingMinutes ? formatMinutes(recipe.cookingMinutes) : "No cooking"} />
            <Fact icon={<Clock size={24} />} label="Total" value={formatMinutes(totalMinutes(recipe))} />
            <Fact icon={<Gauge size={24} />} label="Difficulty" value={DIFFICULTY_LABEL[recipe.difficulty]} />
          </dl>
        </div>
      </section>

      <div className="px-14">
        <FocusGroup id="recipe-actions" className="relative z-10 -mt-4 flex flex-wrap items-center gap-4">
          {session ? (
            <>
              <TVButton variant="primary" size="lg" icon={Play} href={`/cooking/${slug}`} autoFocus focusKey="detail-resume">
                Resume · Step {session.stepIndex + 1}
              </TVButton>
              <TVButton size="lg" icon={ChefHat} onSelect={() => startAt(0)} focusKey="detail-restart">
                Start over
              </TVButton>
            </>
          ) : (
            <TVButton variant="primary" size="lg" icon={ChefHat} onSelect={() => startAt(0)} autoFocus focusKey="detail-start">
              Start Cooking
            </TVButton>
          )}
          <TVButton
            size="lg"
            icon={Heart}
            active={fav}
            onSelect={() => toggleFavorite(slug)}
            focusKey="detail-fav"
            ariaLabel={fav ? "Remove from favorites" : "Add to favorites"}
          >
            {fav ? "Saved" : "Save"}
          </TVButton>
          {video && (
            <TVButton size="lg" icon={CirclePlay} href={`/videos/${video.id}`} focusKey="detail-video">
              Watch video
            </TVButton>
          )}
          <div className="ml-auto flex items-center gap-5 rounded-[1rem] bg-[var(--surface)] py-2 pl-6 pr-2">
            <span className="inline-flex items-center gap-2 text-[1.375rem] font-semibold">
              <Users size={24} aria-hidden /> Servings
            </span>
            <TVStepper label="servings" value={servings} min={1} max={16} onChange={setServings} focusKey="detail-servings" />
          </div>
        </FocusGroup>
        {servings !== recipe.defaultServings && (
          <p className="mt-3 text-[1.125rem] text-[var(--text-secondary)]">
            Quantities scaled from {recipe.defaultServings} to {servings} servings. Cooking times may need small adjustments for larger batches.
          </p>
        )}

        <div className="mt-12 grid grid-cols-[36rem_minmax(0,1fr)] gap-14">
          {/* Ingredients + equipment */}
          <aside>
            <h2 className="font-display text-[2.125rem] font-bold">Ingredients</h2>
            <ul className="mt-5 divide-y divide-[var(--border)] rounded-[1rem] border border-[var(--border)] bg-[var(--surface)]">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-baseline justify-between gap-6 px-6 py-4">
                  <span className="text-[1.375rem] leading-snug">
                    {ing.name}
                    {ing.optional && <span className="text-[var(--text-secondary)]"> (optional)</span>}
                    {ing.notes && <span className="block text-[1.125rem] text-[var(--text-secondary)]">{ing.notes}</span>}
                  </span>
                  <span className="shrink-0 text-right text-[1.375rem] font-semibold tabular-nums text-[var(--primary)]">
                    {formatIngredient(ing, servings, recipe.defaultServings, settings.measurement)}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-[2.125rem] font-bold">Equipment</h2>
            <ul className="mt-5 space-y-3">
              {recipe.equipment.map((e) => (
                <li key={e} className="flex items-center gap-4 text-[1.375rem]">
                  <UtensilsCrossed size={22} className="text-[var(--text-secondary)]" aria-hidden /> {e}
                </li>
              ))}
            </ul>

            <div className="mt-12 flex gap-4 rounded-[1rem] border border-[var(--border)] p-6 text-[1.125rem] text-[var(--text-secondary)]">
              <Info size={24} className="shrink-0" aria-hidden />
              {recipe.nutrition ? (
                <span>
                  About {recipe.nutrition.calories} kcal per serving (source: {recipe.nutrition.source}).
                </span>
              ) : (
                <span>Nutrition information is not shown because verified data is not available for this recipe.</span>
              )}
            </div>
          </aside>

          {/* Steps */}
          <section>
            <h2 className="font-display text-[2.125rem] font-bold">
              Preparation <span className="text-[var(--text-secondary)]">· {recipe.steps.length} steps</span>
            </h2>
            <FocusGroup id="recipe-steps" className="mt-5 flex flex-col gap-4" label="Steps">
              {recipe.steps.map((step, idx) => (
                <Focusable
                  key={step.id}
                  focusKey={`step-${step.id}`}
                  onSelect={() => startAt(idx)}
                  className="tv-row flex w-full gap-6 text-left"
                  ariaLabel={`Step ${idx + 1}: ${step.title}. Press OK to start cooking from this step.`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] font-display text-[1.5rem] font-bold text-[var(--primary)]">
                    {idx + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[1.625rem] font-bold">{step.title}</span>
                    <span className="mt-1 block text-[1.375rem] leading-relaxed text-[var(--text-secondary)]">
                      {renderInstruction(step.instruction, settings.temperatureUnit)}
                    </span>
                    {(step.durationSeconds || step.ingredientIds?.length) && (
                      <span className="mt-3 flex flex-wrap gap-2">
                        {step.durationSeconds ? (
                          <span className="chip bg-white/8!">
                            <Clock size={16} aria-hidden /> {formatMinutes(Math.max(1, Math.round(step.durationSeconds / 60)))}
                          </span>
                        ) : null}
                        {step.ingredientIds?.slice(0, 4).map((id) => (
                          <span key={id} className="chip bg-white/8! font-normal!">
                            {ingredientsById.get(id)?.name}
                          </span>
                        ))}
                        {(step.ingredientIds?.length ?? 0) > 4 && (
                          <span className="chip bg-white/8! font-normal!">+{(step.ingredientIds?.length ?? 0) - 4} more</span>
                        )}
                      </span>
                    )}
                  </span>
                </Focusable>
              ))}
            </FocusGroup>
          </section>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--text-secondary)]" aria-hidden>
        {icon}
      </span>
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
