import type { CookingSession, Recipe } from "@/types";

export function newSession(recipe: Recipe, servings: number, now: number): CookingSession {
  return {
    recipeSlug: recipe.slug,
    stepIndex: 0,
    servings,
    startedAt: now,
    elapsedMs: 0,
    runningSince: now,
    updatedAt: now,
  };
}

export function sessionElapsed(s: CookingSession, now: number): number {
  return s.elapsedMs + (s.runningSince != null ? Math.max(0, now - s.runningSince) : 0);
}

export function pauseSession(s: CookingSession, now: number): CookingSession {
  if (s.runningSince == null) return s;
  return { ...s, elapsedMs: sessionElapsed(s, now), runningSince: null };
}

export function resumeSession(s: CookingSession, now: number): CookingSession {
  if (s.runningSince != null) return s;
  return { ...s, runningSince: now };
}

export function goToStep(s: CookingSession, index: number, total: number): CookingSession {
  return { ...s, stepIndex: Math.min(Math.max(0, index), Math.max(0, total - 1)) };
}

export function progressFraction(s: CookingSession, total: number): number {
  return total ? (s.stepIndex + 1) / total : 0;
}
