"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import type { CookingSession, Recipe } from "@/types";
import { TVButton } from "@/components/tv/TVButton";
import { TVModal } from "@/components/tv/TVModal";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { useBackHandler, useMediaKeys } from "@/components/tv/TVNavigationProvider";
import { RecipeArt } from "@/components/recipes/RecipeArt";
import { useTimers } from "@/contexts/TimerContext";
import { clearSession, recordCooked, saveSession, sessionsStore, useSessions, useSettings } from "@/lib/storage/stores";
import { useHydrated } from "@/lib/storage/store";
import { goToStep, newSession, pauseSession, resumeSession, sessionElapsed } from "@/lib/cooking/session";
import { formatDuration, remainingMs } from "@/lib/timers/timers";
import { formatIngredient, renderInstruction } from "@/lib/recipes/units";
import { focusElement } from "@/lib/navigation/engine";
import { useNow } from "@/hooks/useNow";
import { cn, timestamp } from "@/lib/cn";

const HEARTBEAT_MS = 15_000;
const STALE_MS = 60_000;

export function CookingView({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const settings = useSettings();
  const sessions = useSessions();
  const session = sessions[recipe.slug];
  const [completed, setCompleted] = useState<{ elapsed: number } | null>(null);
  const [confirm, setConfirm] = useState<"exit" | "restart" | null>(null);
  const now = useNow(session?.runningSince != null ? 1000 : 5000);
  const timersApi = useTimers();
  const nextRef = useRef<HTMLElement>(null);
  const total = recipe.steps.length;

  /* ---------- Create or revive the session on entry ---------- */
  useEffect(() => {
    if (!hydrated || completed) return;
    const existing = sessionsStore.get()[recipe.slug];
    const t = timestamp();
    if (!existing) {
      saveSession(newSession(recipe, recipe.defaultServings, t));
      return;
    }
    // If the app was closed while the clock ran, don't count the time away.
    if (existing.runningSince != null && t - existing.updatedAt > STALE_MS) {
      saveSession({
        ...existing,
        elapsedMs: existing.elapsedMs + Math.max(0, existing.updatedAt - existing.runningSince),
        runningSince: t,
      });
    }
  }, [hydrated, recipe, completed]);

  /* ---------- Move focus onto the completion screen ---------- */
  useEffect(() => {
    if (!completed) return;
    const t = window.setTimeout(() => focusElement(document.querySelector<HTMLElement>('[data-focus-key="done-home"]')), 30);
    return () => window.clearTimeout(t);
  }, [completed]);

  /* ---------- Heartbeat keeps elapsed time honest across reloads ---------- */
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = sessionsStore.get()[recipe.slug];
      if (s && s.runningSince != null) saveSession(s);
    }, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [recipe.slug]);

  const update = useCallback(
    (fn: (s: CookingSession) => CookingSession) => {
      const s = sessionsStore.get()[recipe.slug];
      if (s) saveSession(fn(s));
    },
    [recipe.slug],
  );

  const paused = session?.runningSince == null;
  const stepIndex = Math.min(session?.stepIndex ?? 0, total - 1);
  const step = recipe.steps[stepIndex];
  const servings = session?.servings ?? recipe.defaultServings;
  const isLast = stepIndex === total - 1;

  const recipeTimers = timersApi.timers.filter((t) => t.source?.recipeSlug === recipe.slug);
  const stepTimer = recipeTimers.find((t) => t.source?.stepId === step.id);

  const togglePause = useCallback(() => {
    const s = sessionsStore.get()[recipe.slug];
    if (!s) return;
    const t = timestamp();
    if (s.runningSince != null) {
      saveSession(pauseSession(s, t));
      timersApi.timers.filter((x) => x.source?.recipeSlug === recipe.slug && x.status === "running").forEach((x) => timersApi.pause(x.id));
    } else {
      saveSession(resumeSession(s, t));
      timersApi.timers.filter((x) => x.source?.recipeSlug === recipe.slug && x.status === "paused").forEach((x) => timersApi.start(x.id));
    }
  }, [recipe.slug, timersApi]);

  useMediaKeys((a) => {
    if (a === "playPause") togglePause();
    else if (a === "pause" && !paused) togglePause();
    else if (a === "play" && paused) togglePause();
  });

  // Back on the remote asks before leaving (the modal handles its own Back).
  useBackHandler(() => setConfirm("exit"), !completed && confirm === null);

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    update((s) => goToStep(s, s.stepIndex + 1, total));
  };
  const goPrev = () => {
    update((s) => goToStep(s, s.stepIndex - 1, total));
    if (stepIndex <= 1) window.setTimeout(() => focusElement(nextRef.current), 0);
  };

  const finish = () => {
    const s = sessionsStore.get()[recipe.slug];
    const elapsed = s ? sessionElapsed(s, timestamp()) : 0;
    recordCooked(recipe.slug);
    clearSession(recipe.slug);
    setCompleted({ elapsed });
  };

  const restart = () => {
    const t = timestamp();
    saveSession(newSession(recipe, servings, t));
    recipeTimers.forEach((x) => timersApi.remove(x.id));
    setConfirm(null);
    window.setTimeout(() => focusElement(nextRef.current), 30);
  };

  const startStepTimer = () => {
    if (!step.durationSeconds) return;
    if (stepTimer) {
      if (stepTimer.status === "running") timersApi.pause(stepTimer.id);
      else timersApi.start(stepTimer.id);
      return;
    }
    timersApi.add(`${recipe.name} · Step ${stepIndex + 1}`, step.durationSeconds * 1000, {
      start: true,
      source: { recipeSlug: recipe.slug, stepId: step.id },
    });
  };

  /* ------------------------------ Completion ------------------------------ */
  if (completed) {
    return (
      <div className="relative flex h-screen items-center overflow-hidden">
        <RecipeArt recipe={recipe} variant="hero" iconSize={120} />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/85 to-transparent" />
        <div className="relative max-w-[64rem] px-20 animate-rise">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--success)] text-[var(--background)]">
            <Check size={56} strokeWidth={3} aria-hidden />
          </div>
          <h1 className="mt-8 font-display text-[4.5rem] font-extrabold leading-none tracking-tight">Enjoy your meal!</h1>
          <p className="mt-5 text-[1.75rem] text-[var(--text-secondary)]">
            You finished <strong className="text-[var(--text-primary)]">{recipe.name}</strong> — {total} steps in{" "}
            {formatDuration(completed.elapsed)}.
          </p>
          <FocusGroup id="cook-done" className="mt-10 flex gap-4">
            <TVButton variant="primary" size="xl" icon={House} href="/" autoFocus focusKey="done-home">
              Home
            </TVButton>
            <TVButton size="xl" icon={BookOpen} href={`/recipes/${recipe.slug}`} focusKey="done-recipe">
              Back to recipe
            </TVButton>
            <TVButton
              size="xl"
              icon={RotateCcw}
              onSelect={() => {
                saveSession(newSession(recipe, servings, timestamp()));
                setCompleted(null);
              }}
              focusKey="done-again"
            >
              Cook again
            </TVButton>
          </FocusGroup>
        </div>
      </div>
    );
  }

  const elapsed = session ? sessionElapsed(session, now) : 0;
  const stepIngredients = (step.ingredientIds ?? [])
    .map((id) => recipe.ingredients.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i);

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      {/* Top bar */}
      <header className="flex items-center gap-8 px-14 pb-5 pt-8">
        <div className="min-w-0 flex-1">
          <div className="text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Cooking Mode</div>
          <div className="truncate font-display text-[2.25rem] font-bold">{recipe.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[1.125rem] text-[var(--text-secondary)]">{paused ? "Paused" : "Cooking time"}</div>
          <div className={cn("font-display text-[2.25rem] font-bold tabular-nums", paused && "text-[var(--text-secondary)]")}>
            {formatDuration(elapsed)}
          </div>
        </div>
        <TVButton icon={X} onSelect={() => setConfirm("exit")} focusKey="cook-exit-top" ariaLabel="Exit cooking mode">
          Exit
        </TVButton>
      </header>

      {/* Progress */}
      <div className="flex gap-2 px-14" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={stepIndex + 1}>
        {recipe.steps.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i < stepIndex ? "bg-[var(--primary)]" : i === stepIndex ? "bg-[var(--accent)]" : "bg-white/12",
            )}
          />
        ))}
      </div>

      {/* Step */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_34rem] gap-14 px-14 pt-10">
        <section key={step.id} className="min-h-0 animate-fade-in" aria-live="polite">
          <div className="text-[1.75rem] font-semibold text-[var(--text-secondary)]">
            Step <span className="text-[var(--text-primary)]">{stepIndex + 1}</span> of {total}
          </div>
          {step.title && <h2 className="mt-2 font-display text-[3rem] font-extrabold leading-tight tracking-tight">{step.title}</h2>}
          <p className="mt-6 max-w-[62rem] text-[2.375rem] font-medium leading-[1.4]">
            {renderInstruction(step.instruction, settings.temperatureUnit)}
          </p>
          {step.tip && (
            <div className="mt-8 flex max-w-[60rem] items-start gap-4 rounded-[1rem] bg-[var(--surface)] p-6 text-[1.5rem] leading-snug">
              <Lightbulb size={32} className="shrink-0 text-[var(--accent)]" aria-hidden />
              <span>{step.tip}</span>
            </div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col gap-6">
          <div className="relative h-48 shrink-0 overflow-hidden rounded-[1rem]">
            {step.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={step.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <RecipeArt recipe={recipe} iconSize={64} />
            )}
          </div>

          {/* Step timer */}
          {step.durationSeconds ? (
            <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[1.25rem] text-[var(--text-secondary)]">
                  <TimerIcon size={22} aria-hidden /> Step timer
                </span>
                {stepTimer?.status === "done" && <span className="text-[1.25rem] font-semibold text-[var(--success)]">Done</span>}
              </div>
              <div className="mt-1 font-display text-[3.5rem] font-bold tabular-nums leading-none">
                {formatDuration(stepTimer ? remainingMs(stepTimer, timersApi.now) : step.durationSeconds * 1000)}
              </div>
              <FocusGroup id="cook-timer" className="mt-4 flex gap-3">
                <TVButton
                  variant={stepTimer?.status === "running" ? "secondary" : "primary"}
                  icon={stepTimer?.status === "running" ? Pause : Play}
                  onSelect={startStepTimer}
                  focusKey="cook-timer-toggle"
                >
                  {!stepTimer ? "Start timer" : stepTimer.status === "running" ? "Pause" : stepTimer.status === "done" ? "Restart" : "Resume"}
                </TVButton>
                {stepTimer && (
                  <TVButton icon={RotateCcw} onSelect={() => timersApi.reset(stepTimer.id)} focusKey="cook-timer-reset" ariaLabel="Reset step timer" iconOnly />
                )}
              </FocusGroup>
            </div>
          ) : null}

          {stepIngredients.length > 0 && (
            <div className="min-h-0 overflow-hidden rounded-[1rem] border border-[var(--border)] p-6">
              <div className="text-[1.25rem] text-[var(--text-secondary)]">Used in this step · totals for {servings} servings</div>
              <ul className="mt-3 space-y-2">
                {stepIngredients.slice(0, 6).map((ing) => (
                  <li key={ing.id} className="flex justify-between gap-4 text-[1.375rem]">
                    <span className="truncate">{ing.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-[var(--primary)]">
                      {formatIngredient(ing, servings, recipe.defaultServings, settings.measurement)}
                    </span>
                  </li>
                ))}
                {stepIngredients.length > 6 && (
                  <li className="text-[1.125rem] text-[var(--text-secondary)]">+ {stepIngredients.length - 6} more</li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Controls */}
      <FocusGroup id="cook-controls" className="flex items-center gap-4 border-t border-[var(--border)] px-14 py-6">
        <TVButton size="xl" icon={ChevronLeft} onSelect={goPrev} disabled={stepIndex === 0} focusKey="cook-prev">
          Previous
        </TVButton>
        <TVButton
          ref={nextRef}
          size="xl"
          variant="primary"
          icon={isLast ? Check : ChevronRight}
          onSelect={goNext}
          autoFocus
          focusKey="cook-next"
        >
          {isLast ? "Finish" : "Next step"}
        </TVButton>
        <div className="mx-4 h-12 w-px bg-[var(--border)]" />
        <TVButton size="xl" icon={paused ? Play : Pause} onSelect={togglePause} focusKey="cook-pause">
          {paused ? "Resume" : "Pause"}
        </TVButton>
        <TVButton size="xl" icon={RotateCcw} onSelect={() => setConfirm("restart")} focusKey="cook-restart">
          Restart
        </TVButton>
        <div className="flex-1" />
        <TVButton size="xl" variant="ghost" icon={X} onSelect={() => setConfirm("exit")} focusKey="cook-exit">
          Exit Cooking Mode
        </TVButton>
      </FocusGroup>

      <TVModal
        open={confirm === "exit"}
        onClose={() => setConfirm(null)}
        title="Leave Cooking Mode?"
        description={`Your progress is saved at step ${stepIndex + 1} of ${total}. You can resume from Home or the Cooking screen.`}
        size="sm"
        actions={
          <>
            <TVButton variant="primary" size="lg" autoFocus onSelect={() => setConfirm(null)} focusKey="exit-stay">
              Keep cooking
            </TVButton>
            <TVButton
              size="lg"
              onSelect={() => {
                update((s) => pauseSession(s, timestamp()));
                setConfirm(null);
                router.push(`/recipes/${recipe.slug}`);
              }}
              focusKey="exit-leave"
            >
              Exit
            </TVButton>
          </>
        }
      />
      <TVModal
        open={confirm === "restart"}
        onClose={() => setConfirm(null)}
        title="Restart this recipe?"
        description="You'll go back to step 1, the cooking time resets, and this recipe's timers are removed."
        size="sm"
        tone="danger"
        actions={
          <>
            <TVButton variant="primary" size="lg" autoFocus onSelect={() => setConfirm(null)} focusKey="restart-cancel">
              Cancel
            </TVButton>
            <TVButton variant="danger" size="lg" icon={RotateCcw} onSelect={restart} focusKey="restart-confirm">
              Restart
            </TVButton>
          </>
        }
      />
    </div>
  );
}
