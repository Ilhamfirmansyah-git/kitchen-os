import type { Ingredient, MeasurementSystem, TemperatureUnit, Unit } from "@/types";

/** Scale a quantity for a new serving count. */
export function scaleQuantity(quantity: number, from: number, to: number): number {
  if (from <= 0) return quantity;
  return (quantity * to) / from;
}

const FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.5, "½"],
  [0.666, "⅔"],
  [0.75, "¾"],
];

/** 1.5 → "1½", 0.25 → "¼". Falls back to one decimal. */
export function formatFraction(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  if (frac < 0.06) return String(whole || (value > 0 ? "¼" : 0));
  if (frac > 0.94) return String(whole + 1);
  for (const [v, glyph] of FRACTIONS) {
    if (Math.abs(frac - v) < 0.06) return whole ? `${whole}${glyph}` : glyph;
  }
  return value.toFixed(1).replace(/\.0$/, "");
}

function roundMetric(value: number): number {
  if (value >= 100) return Math.round(value / 5) * 5;
  if (value >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
}

const COUNTABLE: Unit[] = ["pcs", "clove", "slice", "stalk"];
const SPOONS: Unit[] = ["tsp", "tbsp", "cup", "pinch"];

export interface DisplayQuantity {
  amount: string; // "" for "to taste"
  unit: string;
}

const UNIT_LABEL: Record<Unit, [string, string]> = {
  g: ["g", "g"],
  kg: ["kg", "kg"],
  ml: ["ml", "ml"],
  l: ["l", "l"],
  tsp: ["tsp", "tsp"],
  tbsp: ["tbsp", "tbsp"],
  cup: ["cup", "cups"],
  pcs: ["", ""],
  clove: ["clove", "cloves"],
  slice: ["slice", "slices"],
  stalk: ["stalk", "stalks"],
  pinch: ["pinch", "pinches"],
  "to taste": ["to taste", "to taste"],
};

const plural = (u: Unit, n: number) => UNIT_LABEL[u][n > 1.01 ? 1 : 0];

/** Convert + format an already-scaled quantity for display. */
export function displayQuantity(quantity: number, unit: Unit, system: MeasurementSystem): DisplayQuantity {
  if (unit === "to taste") return { amount: "", unit: "to taste" };

  if (COUNTABLE.includes(unit) || SPOONS.includes(unit)) {
    const rounded = unit === "pcs" || unit === "clove" ? Math.max(0.5, Math.round(quantity * 2) / 2) : Math.round(quantity * 4) / 4 || 0.25;
    return { amount: formatFraction(rounded), unit: plural(unit, rounded) };
  }

  if (system === "metric") {
    if (unit === "g" && quantity >= 1000) return { amount: formatDecimal(quantity / 1000), unit: "kg" };
    if (unit === "ml" && quantity >= 1000) return { amount: formatDecimal(quantity / 1000), unit: "l" };
    if (unit === "kg" && quantity < 1) return { amount: String(roundMetric(quantity * 1000)), unit: "g" };
    if (unit === "l" && quantity < 1) return { amount: String(roundMetric(quantity * 1000)), unit: "ml" };
    if (unit === "g" || unit === "ml") return { amount: String(roundMetric(quantity)), unit };
    return { amount: formatDecimal(quantity), unit };
  }

  // US customary
  const grams = unit === "kg" ? quantity * 1000 : unit === "g" ? quantity : null;
  if (grams != null) {
    const oz = grams / 28.3495;
    if (oz >= 16) return { amount: formatDecimal(oz / 16), unit: "lb" };
    return { amount: formatFraction(Math.round(oz * 4) / 4 || 0.25), unit: "oz" };
  }
  const ml = unit === "l" ? quantity * 1000 : quantity;
  if (ml < 15) return { amount: formatFraction(Math.round((ml / 4.93) * 4) / 4 || 0.25), unit: "tsp" };
  if (ml < 60) return { amount: formatFraction(Math.round((ml / 14.79) * 4) / 4), unit: "tbsp" };
  const cups = ml / 236.6;
  const r = Math.round(cups * 4) / 4;
  return { amount: formatFraction(r), unit: r > 1.01 ? "cups" : "cup" };
}

function formatDecimal(v: number): string {
  return (Math.round(v * 100) / 100).toString();
}

export function formatIngredient(ing: Ingredient, servings: number, defaultServings: number, system: MeasurementSystem): string {
  const q = displayQuantity(scaleQuantity(ing.quantity, defaultServings, servings), ing.unit, system);
  return [q.amount, q.unit].filter(Boolean).join(" ");
}

/** Replace {t:180} tokens in an instruction with the preferred temperature unit. */
export function renderInstruction(text: string, unit: TemperatureUnit): string {
  return text.replace(/\{t:(\d+)\}/g, (_, c: string) => {
    const celsius = Number(c);
    if (unit === "C") return `${celsius}°C`;
    const f = Math.round(((celsius * 9) / 5 + 32) / 5) * 5;
    return `${f}°F`;
  });
}
