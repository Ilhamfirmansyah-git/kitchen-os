import { describe, expect, it } from "vitest";
import { pickCandidate, scoreCandidate, type Box } from "@/lib/navigation/spatial";
import { createTimer, formatDuration, pauseTimer, remainingMs, resetTimer, settleTimers, startTimer } from "@/lib/timers/timers";
import { displayQuantity, formatFraction, renderInstruction, scaleQuantity } from "@/lib/recipes/units";
import { EMPTY_FILTERS, filterRecipes, matchesQuery, recipesForIngredients } from "@/lib/recipes/search";
import { RECIPES, getRecipe } from "@/data/recipes";
import { demoReply } from "@/lib/ai/demo";
import { newSession, pauseSession, resumeSession, sessionElapsed, goToStep } from "@/lib/cooking/session";
import { VIDEOS } from "@/data/videos";

const box = (left: number, top: number, w = 100, h = 60): Box => ({ left, top, right: left + w, bottom: top + h });

describe("spatial navigation", () => {
  const origin = box(200, 200);
  it("prefers the in-line neighbour over a closer diagonal one", () => {
    const inLine = box(400, 200);
    const diagonal = box(320, 300);
    expect(pickCandidate(origin, [diagonal, inLine], "right")).toBe(1);
  });
  it("ignores candidates in the wrong direction", () => {
    expect(scoreCandidate(origin, box(0, 200), "right")).toBeNull();
    expect(scoreCandidate(origin, box(200, 0), "down")).toBeNull();
  });
  it("finds the nearest row below and the closest column in it", () => {
    const row = [box(0, 400), box(180, 400), box(360, 400)];
    expect(pickCandidate(origin, row, "down")).toBe(1);
  });
  it("returns -1 at an edge", () => {
    expect(pickCandidate(origin, [box(0, 0)], "right")).toBe(-1);
  });
  it("moves into a sidebar on the left even when it is far away", () => {
    const sidebarItem = box(-500, 180, 200, 50);
    expect(pickCandidate(origin, [sidebarItem], "left")).toBe(0);
  });
});

describe("timers (timestamp based)", () => {
  const t0 = 1_000_000;
  it("derives remaining time from the wall clock", () => {
    const t = createTimer({ id: "a", label: "Eggs", durationMs: 8 * 60_000, now: t0, start: true });
    expect(remainingMs(t, t0 + 60_000)).toBe(7 * 60_000);
    // A "throttled" tab that wakes 5 minutes later is still exact.
    expect(remainingMs(t, t0 + 5 * 60_000)).toBe(3 * 60_000);
  });
  it("pauses and resumes without drift", () => {
    let t = createTimer({ id: "a", label: "x", durationMs: 60_000, now: t0, start: true });
    t = pauseTimer(t, t0 + 20_000);
    expect(t.status).toBe("paused");
    expect(remainingMs(t, t0 + 999_999)).toBe(40_000);
    t = startTimer(t, t0 + 100_000);
    expect(remainingMs(t, t0 + 110_000)).toBe(30_000);
  });
  it("settles multiple simultaneous timers independently", () => {
    const a = createTimer({ id: "a", label: "Eggs", durationMs: 8 * 60_000, now: t0, start: true });
    const b = createTimer({ id: "b", label: "Chicken", durationMs: 12 * 60_000, now: t0, start: true });
    const c = createTimer({ id: "c", label: "Rice", durationMs: 25 * 60_000, now: t0, start: true });
    const r = settleTimers([a, b, c], t0 + 13 * 60_000);
    expect(r.finished.map((x) => x.id)).toEqual(["a", "b"]);
    expect(r.timers[2].status).toBe("running");
    expect(remainingMs(r.timers[2], t0 + 13 * 60_000)).toBe(12 * 60_000);
    expect(r.timers[0].finishedAt).toBe(t0 + 8 * 60_000);
  });
  it("returns the same array when nothing finished", () => {
    const a = createTimer({ id: "a", label: "x", durationMs: 60_000, now: t0, start: true });
    const list = [a];
    expect(settleTimers(list, t0 + 1000).timers).toBe(list);
  });
  it("resets and restarts a finished timer", () => {
    const a = createTimer({ id: "a", label: "x", durationMs: 60_000, now: t0, start: true });
    const done = settleTimers([a], t0 + 61_000).timers[0];
    expect(resetTimer(done).remainingMs).toBe(60_000);
    expect(remainingMs(startTimer(done, t0 + 70_000), t0 + 70_000)).toBe(60_000);
  });
  it("formats durations", () => {
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });
});

describe("recipe scaling and units", () => {
  it("scales 2 → 4 servings", () => {
    expect(scaleQuantity(200, 2, 4)).toBe(400);
    expect(scaleQuantity(3, 2, 1)).toBe(1.5);
  });
  it("formats fractions", () => {
    expect(formatFraction(1.5)).toBe("1½");
    expect(formatFraction(0.25)).toBe("¼");
    expect(formatFraction(2)).toBe("2");
  });
  it("converts large metric amounts and US units", () => {
    expect(displayQuantity(1200, "g", "metric")).toEqual({ amount: "1.2", unit: "kg" });
    expect(displayQuantity(454, "g", "us")).toEqual({ amount: "1", unit: "lb" });
    expect(displayQuantity(240, "ml", "us").unit).toBe("cup");
    expect(displayQuantity(3, "clove", "metric")).toEqual({ amount: "3", unit: "cloves" });
    expect(displayQuantity(1, "to taste", "metric")).toEqual({ amount: "", unit: "to taste" });
  });
  it("renders temperature tokens", () => {
    expect(renderInstruction("Heat the oven to {t:180}.", "C")).toBe("Heat the oven to 180°C.");
    expect(renderInstruction("Heat the oven to {t:180}.", "F")).toBe("Heat the oven to 355°F.");
  });
});

describe("recipe data integrity", () => {
  it("ships at least 30 recipes with unique slugs", () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(RECIPES.map((r) => r.slug)).size).toBe(RECIPES.length);
  });
  it("covers every category", () => {
    const cats = new Set(RECIPES.map((r) => r.category));
    ["Indonesian", "Japanese", "Korean", "Chinese", "Western", "Italian", "Breakfast", "Dessert", "Drinks", "Baking"].forEach((c) =>
      expect(cats.has(c as never)).toBe(true),
    );
  });
  it("has complete, consistent steps", () => {
    for (const r of RECIPES) {
      expect(r.steps.length, r.slug).toBeGreaterThanOrEqual(2);
      expect(r.ingredients.length, r.slug).toBeGreaterThanOrEqual(2);
      r.steps.forEach((s, i) => expect(s.order).toBe(i + 1));
      const ids = new Set(r.ingredients.map((i) => i.id));
      expect(ids.size, `${r.slug} duplicate ingredient ids`).toBe(r.ingredients.length);
      r.steps.forEach((s) => s.ingredientIds?.forEach((id) => expect(ids.has(id), `${r.slug}:${id}`).toBe(true)));
      // Every non-optional ingredient is used in at least one step.
      const used = new Set(r.steps.flatMap((s) => s.ingredientIds ?? []));
      r.ingredients.forEach((i) => expect(used.has(i.id), `${r.slug} never uses ${i.id}`).toBe(true));
      expect(r.nutrition, `${r.slug} must not ship unsourced nutrition`).toBeUndefined();
    }
  });
  it("links recipe videos that exist in the video catalogue", () => {
    RECIPES.filter((r) => r.videoId).forEach((r) => expect(VIDEOS.some((v) => v.id === r.videoId), r.slug).toBe(true));
  });
});

describe("search and filters", () => {
  it("searches by name, ingredient and category", () => {
    expect(matchesQuery(getRecipe("nasi-goreng")!, "nasi")).toBe(true);
    expect(matchesQuery(getRecipe("nasi-goreng")!, "kecap")).toBe(true);
    expect(matchesQuery(getRecipe("nasi-goreng")!, "indonesian")).toBe(true);
    expect(matchesQuery(getRecipe("nasi-goreng")!, "chocolate")).toBe(false);
  });
  it("filters by duration and difficulty", () => {
    const quick = filterRecipes(RECIPES, { ...EMPTY_FILTERS, maxMinutes: 20, difficulty: "easy" });
    expect(quick.length).toBeGreaterThan(0);
    quick.forEach((r) => {
      expect(r.preparationMinutes + r.cookingMinutes).toBeLessThanOrEqual(20);
      expect(r.difficulty).toBe("easy");
    });
  });
  it("ranks recipes by available ingredients", () => {
    const r = recipesForIngredients(RECIPES, ["chicken", "eggs", "carrots"]);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].matched.length).toBeGreaterThanOrEqual(2);
  });
});

describe("cooking session", () => {
  it("tracks elapsed time across pause/resume and clamps steps", () => {
    const r = getRecipe("chicken-teriyaki")!;
    let s = newSession(r, 2, 0);
    expect(sessionElapsed(s, 60_000)).toBe(60_000);
    s = pauseSession(s, 60_000);
    expect(sessionElapsed(s, 500_000)).toBe(60_000);
    s = resumeSession(s, 500_000);
    expect(sessionElapsed(s, 530_000)).toBe(90_000);
    expect(goToStep(s, 99, r.steps.length).stepIndex).toBe(r.steps.length - 1);
    expect(goToStep(s, -3, r.steps.length).stepIndex).toBe(0);
  });
});

describe("AI demo mode", () => {
  it("answers the example questions with pre-written content", () => {
    expect(demoReply("What can I cook with chicken, eggs, and carrots?").recipeSlugs.length).toBeGreaterThan(0);
    expect(demoReply("What can replace oyster sauce?").text).toMatch(/soy sauce/i);
    expect(demoReply("How do I remove the smell of chicken?").text).toMatch(/ginger|lime/i);
    expect(demoReply("Create dinner for three people.").text).toMatch(/for 3/);
    expect(demoReply("Why is my chicken too dry?").text).toMatch(/74°C/);
    expect(demoReply("How can I make restaurant-style fried rice?").recipeSlugs).toContain("egg-fried-rice");
  });
  it("is honest about its limits for unknown questions", () => {
    expect(demoReply("Tell me about quantum physics").text).toMatch(/Demo Mode/);
  });
});
