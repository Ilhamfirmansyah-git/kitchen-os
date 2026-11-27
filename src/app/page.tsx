"use client";

import { BookOpen, ChefHat, CirclePlay, Clock, Gauge, Lightbulb, Play, Settings, Sparkles, Timer, Users } from "lucide-react";
import { Page, Section } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";
import { Focusable } from "@/components/tv/Focusable";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { RecipeArt } from "@/components/recipes/RecipeArt";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RECIPES, getRecipe, recipeOfTheDay, totalMinutes } from "@/data/recipes";
import { useNow } from "@/hooks/useNow";
import { useHydrated } from "@/lib/storage/store";
import { useSessions, useSettings, useViewed } from "@/lib/storage/stores";
import { DIFFICULTY_LABEL, formatClock, formatDate, formatMinutes, greeting } from "@/lib/format";
import { progressFraction } from "@/lib/cooking/session";
import { formatDuration } from "@/lib/timers/timers";
import { sessionElapsed } from "@/lib/cooking/session";

const TIPS = [
  "Use day-old, chilled rice for fried rice — fresh rice steams and clumps.",
  "Salt pasta water generously; it is the only chance to season the pasta itself.",
  "Pat meat dry before searing. Moisture is the enemy of a golden crust.",
  "Toast whole spices in a dry pan for a minute to wake up their aroma.",
  "Let roasted meat rest for a few minutes so the juices settle before slicing.",
  "Add miso off the boil; boiling dulls its flavour.",
  "A splash of starchy pasta water turns oil and cheese into a glossy sauce.",
];

export default function HomePage() {
  const hydrated = useHydrated();
  const now = useNow(15_000);
  const settings = useSettings();
  const sessions = useSessions();
  const viewed = useViewed();

  const featured = recipeOfTheDay(now);
  const inspiration = recipeOfTheDay(now, 11);
  const tip = TIPS[Math.floor(now / 86_400_000) % TIPS.length];

  const unfinished = Object.values(sessions)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((s) => ({ s, r: getRecipe(s.recipeSlug) }))
    .filter((x): x is { s: typeof x.s; r: NonNullable<typeof x.r> } => !!x.r);
  const resume = unfinished[0];

  const viewedSlugs = new Set(viewed.map((v) => v.slug));
  const recommended = [
    ...RECIPES.filter((r) => r.slug !== featured.slug && !viewedSlugs.has(r.slug)),
    ...RECIPES.filter((r) => viewedSlugs.has(r.slug) && r.slug !== featured.slug),
  ]
    .sort((a, b) => ((a.hue * 7 + Math.floor(now / 86_400_000)) % 13) - ((b.hue * 7 + Math.floor(now / 86_400_000)) % 13))
    .slice(0, 10);

  const name = settings.userName.trim();

  return (
    <Page className="pt-10">
      {/* A. Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[1.375rem] text-[var(--text-secondary)]" suppressHydrationWarning>
            {hydrated ? formatDate(now) : " "}
          </div>
          <h1 className="font-display text-[3.25rem] font-extrabold leading-tight tracking-tight" suppressHydrationWarning>
            {hydrated ? greeting(now) : "Welcome"}
            {name ? `, ${name}` : ""}.
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="font-display text-[3.5rem] font-bold tabular-nums" suppressHydrationWarning aria-label="Current time">
            {hydrated ? formatClock(now, settings.clockFormat) : "--:--"}
          </div>
          <TVButton iconOnly icon={Settings} href="/settings" ariaLabel="Settings" focusKey="home-settings" />
        </div>
      </header>

      {/* B. Hero */}
      <section className="relative h-[32rem] overflow-hidden rounded-[1.5rem] border border-[var(--border)]" aria-label="Featured recipe">
        <RecipeArt recipe={featured} variant="hero" iconSize={96} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141715] via-[#141715]/85 to-transparent" />
        <div className="relative flex h-full max-w-[52rem] flex-col justify-center px-14">
          <div className="text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Recipe of the day</div>
          <h2 className="mt-3 font-display text-[4rem] font-extrabold leading-[1.02] tracking-tight">{featured.name}</h2>
          <p className="mt-4 line-clamp-2 text-[1.5rem] leading-snug text-[var(--text-secondary)]">{featured.description}</p>
          <div className="mt-5 flex gap-8 text-[1.375rem]">
            <span className="inline-flex items-center gap-2">
              <Clock size={24} aria-hidden /> {formatMinutes(totalMinutes(featured))}
            </span>
            <span className="inline-flex items-center gap-2">
              <Gauge size={24} aria-hidden /> {DIFFICULTY_LABEL[featured.difficulty]}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={24} aria-hidden /> Serves {featured.defaultServings}
            </span>
          </div>
          <FocusGroup id="home-hero" className="mt-8 flex gap-4">
            <TVButton variant="primary" size="lg" icon={ChefHat} href={`/cooking/${featured.slug}`} autoFocus focusKey="hero-start">
              Start Cooking
            </TVButton>
            <TVButton size="lg" icon={BookOpen} href={`/recipes/${featured.slug}`} focusKey="hero-view">
              View Recipe
            </TVButton>
          </FocusGroup>
        </div>
      </section>

      {/* C. Continue cooking */}
      {resume && (
        <Section title="Continue Cooking" aside={unfinished.length > 1 ? `${unfinished.length} unfinished` : undefined}>
          <Focusable
            href={`/cooking/${resume.r.slug}`}
            focusKey="home-resume"
            className="tv-row flex w-full items-center gap-8 p-5!"
            ariaLabel={`Resume ${resume.r.name}, step ${resume.s.stepIndex + 1} of ${resume.r.steps.length}`}
          >
            <div className="relative h-28 w-48 shrink-0 overflow-hidden rounded-[0.75rem]">
              <RecipeArt recipe={resume.r} iconSize={44} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[1.875rem] font-bold">{resume.r.name}</div>
              <div className="mt-1 text-[1.25rem] text-[var(--text-secondary)]">
                Step {resume.s.stepIndex + 1} of {resume.r.steps.length} · {formatDuration(sessionElapsed(resume.s, now))} cooking
                · {resume.s.servings} servings
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{ width: `${Math.round(progressFraction(resume.s, resume.r.steps.length) * 100)}%` }}
                />
              </div>
            </div>
            <span className="tv-button tv-button--primary inline-flex h-16 items-center gap-3 px-8 text-[1.375rem] font-semibold">
              <Play size={24} aria-hidden /> Resume
            </span>
          </Focusable>
        </Section>
      )}

      {/* D. Recommended */}
      <Section title="Recommended for You">
        <FocusGroup id="home-recommended" restore className="shelf" label="Recommended recipes">
          {recommended.map((r, i) => (
            <RecipeCard key={r.slug} recipe={r} className="w-[22rem]" focusKey={`home-rec-${r.slug}`} groupDefault={i === 0} />
          ))}
        </FocusGroup>
      </Section>

      {/* E. Quick actions */}
      <Section title="Quick Actions">
        <FocusGroup id="home-quick" className="grid grid-cols-4 gap-6">
          {[
            { href: "/recipes", icon: BookOpen, label: "Explore Recipes", sub: `${RECIPES.length} recipes` },
            { href: "/ai-chef", icon: Sparkles, label: "AI Chef", sub: "Ask anything" },
            { href: "/timer", icon: Timer, label: "Kitchen Timer", sub: "Multiple timers" },
            { href: "/videos", icon: CirclePlay, label: "Watch Videos", sub: "Cooking tutorials" },
          ].map((a) => (
            <Focusable key={a.href} href={a.href} focusKey={`quick-${a.href}`} className="tv-row flex h-40 flex-col justify-between p-6!">
              <a.icon size={40} strokeWidth={1.75} className="text-[var(--primary)]" aria-hidden />
              <span>
                <span className="block font-display text-[1.625rem] font-bold">{a.label}</span>
                <span className="block text-[1.125rem] text-[var(--text-secondary)]">{a.sub}</span>
              </span>
            </Focusable>
          ))}
        </FocusGroup>
      </Section>

      {/* F. Daily inspiration */}
      <Section title="Daily Inspiration">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          <div className="flex gap-6 rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-8">
            <Lightbulb size={44} strokeWidth={1.75} className="shrink-0 text-[var(--accent)]" aria-hidden />
            <div>
              <div className="text-[1.125rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Kitchen tip</div>
              <p className="mt-2 text-[1.625rem] leading-snug">{tip}</p>
            </div>
          </div>
          <Focusable href={`/recipes/${inspiration.slug}`} focusKey="home-inspiration" className="tv-row flex items-center gap-6 p-6!">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[0.75rem]">
              <RecipeArt recipe={inspiration} iconSize={40} />
            </div>
            <span>
              <span className="block text-[1.125rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Tonight, try
              </span>
              <span className="block font-display text-[1.75rem] font-bold leading-tight">{inspiration.name}</span>
              <span className="block text-[1.125rem] text-[var(--text-secondary)]">{formatMinutes(totalMinutes(inspiration))}</span>
            </span>
          </Focusable>
        </div>
      </Section>
    </Page>
  );
}
