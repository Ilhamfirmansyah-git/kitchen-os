import { RECIPES } from "@/data/recipes";

export const SUGGESTED_PROMPTS = [
  "What can I cook with chicken, eggs, and carrots?",
  "What can replace oyster sauce?",
  "How do I remove the smell of chicken?",
  "Create dinner for three people.",
  "Why is my chicken too dry?",
  "How can I make restaurant-style fried rice?",
  "What does it mean to deglaze a pan?",
  "Plan three easy weeknight dinners.",
];

export function systemPrompt(opts: { measurement: string; temperatureUnit: string }): string {
  const catalog = RECIPES.map((r) => `${r.name} (${r.cuisine}, ${r.preparationMinutes + r.cookingMinutes} min)`).join("; ");
  return [
    "You are AI Chef inside Kitchen OS, a cooking assistant shown on a TV in someone's kitchen.",
    "The person reads your answer from 2–3 metres away while cooking, so:",
    "- Keep answers short: at most ~170 words unless they ask for a full recipe.",
    "- Use plain text with short lines. Use simple numbered steps or '- ' bullets. No markdown tables, no headings, no bold.",
    `- Use ${opts.measurement === "us" ? "US cups/ounces" : "metric (g, ml)"} and °${opts.temperatureUnit}.`,
    "- Give practical, safe kitchen advice. Mention safe internal temperatures for meat when relevant.",
    "- Never invent precise nutrition numbers; say they are estimates if asked.",
    "- If a recipe from the Kitchen OS catalogue fits, mention it by its exact name so the app can link it.",
    `Kitchen OS catalogue: ${catalog}.`,
  ].join("\n");
}

/** Recipe names mentioned in a reply, used to show "Open recipe" buttons. */
export function findRecipeMentions(text: string): string[] {
  const lower = text.toLowerCase();
  return RECIPES.filter((r) => lower.includes(r.name.toLowerCase())).map((r) => r.slug).slice(0, 3);
}
