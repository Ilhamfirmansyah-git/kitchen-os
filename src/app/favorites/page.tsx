"use client";

import { Heart, History } from "lucide-react";
import { EmptyState, Page, PageHeader, Section } from "@/components/layout/Page";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { TVButton } from "@/components/tv/TVButton";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { getRecipe } from "@/data/recipes";
import { cookedStore, useCooked, useFavorites, useSessions, useViewed, viewedStore } from "@/lib/storage/stores";
import type { Recipe } from "@/types";

const toRecipes = (slugs: string[]) => slugs.map(getRecipe).filter((r): r is Recipe => !!r);

export default function FavoritesPage() {
  const favorites = toRecipes(useFavorites());
  const viewed = toRecipes(useViewed().map((h) => h.slug));
  const cooked = toRecipes(useCooked().map((h) => h.slug));
  const sessions = useSessions();
  const unfinished = Object.values(sessions)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((s) => ({ s, r: getRecipe(s.recipeSlug) }))
    .filter((x): x is { s: typeof x.s; r: Recipe } => !!x.r);

  return (
    <Page>
      <PageHeader title="Favorites" subtitle="Your saved recipes and cooking history, stored on this TV." />

      <Section title="Saved recipes" className="mt-0" aside={favorites.length ? `${favorites.length} saved` : undefined}>
        {favorites.length ? (
          <div className="grid grid-cols-4 gap-x-8 gap-y-10">
            {favorites.map((r, i) => (
              <RecipeCard key={r.slug} recipe={r} autoFocus={i === 0} focusKey={`fav-${r.slug}`} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={56} aria-hidden />}
            title="No favorites yet"
            body="Open a recipe and choose Save to keep it here."
            action={
              <TVButton variant="primary" href="/recipes" autoFocus focusKey="fav-browse">
                Browse recipes
              </TVButton>
            }
          />
        )}
      </Section>

      {unfinished.length > 0 && (
        <Section title="Unfinished — resume cooking">
          <FocusGroup id="fav-unfinished" restore className="shelf">
            {unfinished.map(({ s, r }) => (
              <RecipeCard
                key={r.slug}
                recipe={r}
                className="w-[22rem]"
                focusKey={`fav-unf-${r.slug}`}
                progressLabel={`Step ${s.stepIndex + 1}/${r.steps.length}`}
              />
            ))}
          </FocusGroup>
          <p className="mt-2 text-[1.125rem] text-[var(--text-secondary)]">Open a recipe, then choose Resume to continue where you stopped.</p>
        </Section>
      )}

      <Section
        title="Recently cooked"
        aside={
          cooked.length ? (
            <TVButton variant="ghost" onSelect={() => cookedStore.reset()} focusKey="clear-cooked">
              Clear
            </TVButton>
          ) : undefined
        }
      >
        {cooked.length ? (
          <FocusGroup id="fav-cooked" restore className="shelf">
            {cooked.map((r) => (
              <RecipeCard key={r.slug} recipe={r} className="w-[22rem]" focusKey={`fav-cooked-${r.slug}`} />
            ))}
          </FocusGroup>
        ) : (
          <p className="text-[1.375rem] text-[var(--text-secondary)]">Finish a recipe in Cooking Mode and it appears here.</p>
        )}
      </Section>

      <Section
        title="Recently viewed"
        aside={
          viewed.length ? (
            <TVButton variant="ghost" onSelect={() => viewedStore.reset()} focusKey="clear-viewed">
              Clear
            </TVButton>
          ) : undefined
        }
      >
        {viewed.length ? (
          <FocusGroup id="fav-viewed" restore className="shelf">
            {viewed.map((r) => (
              <RecipeCard key={r.slug} recipe={r} className="w-[22rem]" focusKey={`fav-viewed-${r.slug}`} />
            ))}
          </FocusGroup>
        ) : (
          <div className="flex items-center gap-3 text-[1.375rem] text-[var(--text-secondary)]">
            <History size={24} aria-hidden /> Recipes you open will show up here.
          </div>
        )}
      </Section>
    </Page>
  );
}
