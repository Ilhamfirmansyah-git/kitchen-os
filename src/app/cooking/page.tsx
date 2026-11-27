"use client";

import { ChefHat, Play, Trash2 } from "lucide-react";
import { EmptyState, Page, PageHeader, Section } from "@/components/layout/Page";
import { Focusable } from "@/components/tv/Focusable";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { TVButton } from "@/components/tv/TVButton";
import { RecipeArt } from "@/components/recipes/RecipeArt";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RECIPES, getRecipe, totalMinutes } from "@/data/recipes";
import { clearSession, useCooked, useSessions } from "@/lib/storage/stores";
import { progressFraction, sessionElapsed } from "@/lib/cooking/session";
import { formatDuration } from "@/lib/timers/timers";
import { relativeTime } from "@/lib/format";
import { useNow } from "@/hooks/useNow";

export default function CookingHubPage() {
  const sessions = useSessions();
  const cooked = useCooked();
  const now = useNow(30_000);
  const unfinished = Object.values(sessions)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((s) => ({ s, r: getRecipe(s.recipeSlug) }))
    .filter((x) => !!x.r);
  const quick = RECIPES.filter((r) => totalMinutes(r) <= 25).slice(0, 8);

  return (
    <Page>
      <PageHeader title="Cooking" subtitle="Pick up where you left off, or start something quick." />

      <Section title="Unfinished sessions" className="mt-0">
        {unfinished.length ? (
          <div className="flex flex-col gap-4">
            {unfinished.map(({ s, r }, i) => (
              <FocusGroup key={s.recipeSlug} id={`session-${s.recipeSlug}`} className="flex items-center gap-4">
                <Focusable
                  href={`/cooking/${r!.slug}`}
                  focusKey={`session-${r!.slug}`}
                  autoFocus={i === 0}
                  className="tv-row flex flex-1 items-center gap-6 p-4!"
                  ariaLabel={`Resume ${r!.name}`}
                >
                  <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-[0.75rem]">
                    <RecipeArt recipe={r!} iconSize={40} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[1.75rem] font-bold">{r!.name}</div>
                    <div className="text-[1.25rem] text-[var(--text-secondary)]">
                      Step {s.stepIndex + 1} of {r!.steps.length} · {formatDuration(sessionElapsed(s, now))} · updated{" "}
                      {relativeTime(s.updatedAt, now)}
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-[var(--primary)]" style={{ width: `${progressFraction(s, r!.steps.length) * 100}%` }} />
                    </div>
                  </div>
                  <Play size={32} className="text-[var(--primary)]" aria-hidden />
                </Focusable>
                <TVButton
                  iconOnly
                  size="lg"
                  variant="danger"
                  icon={Trash2}
                  ariaLabel={`Discard session for ${r!.name}`}
                  onSelect={() => clearSession(s.recipeSlug)}
                  focusKey={`session-del-${r!.slug}`}
                />
              </FocusGroup>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ChefHat size={56} aria-hidden />}
            title="Nothing on the stove"
            body="Start Cooking Mode from any recipe. Your step and cooking time are saved automatically."
            action={
              <TVButton variant="primary" href="/recipes" autoFocus focusKey="cooking-browse">
                Browse recipes
              </TVButton>
            }
          />
        )}
      </Section>

      {cooked.length > 0 && (
        <Section title="Recently cooked">
          <FocusGroup id="cooking-recent" restore className="shelf">
            {cooked.slice(0, 10).map((h) => {
              const r = getRecipe(h.slug);
              return r ? <RecipeCard key={h.slug} recipe={r} className="w-[22rem]" focusKey={`cooked-${h.slug}`} /> : null;
            })}
          </FocusGroup>
        </Section>
      )}

      <Section title="Ready in 25 minutes or less">
        <FocusGroup id="cooking-quick" restore className="shelf">
          {quick.map((r) => (
            <RecipeCard key={r.slug} recipe={r} className="w-[22rem]" focusKey={`quick-${r.slug}`} />
          ))}
        </FocusGroup>
      </Section>
    </Page>
  );
}
