"use client";

import type { Conversation, CookingSession, HistoryEntry, KitchenTimer, Settings } from "@/types";
import { createStore, useStore } from "./store";

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  soundEffects: true,
  alarmVolume: 0.8,
  clockFormat: "24h",
  temperatureUnit: "C",
  measurement: "metric",
  reduceMotion: false,
  debugNavigation: false,
  userName: "",
};

export const settingsStore = createStore<Settings>("settings", DEFAULT_SETTINGS, {
  validate: (v) => (v && typeof v === "object" ? { ...DEFAULT_SETTINGS, ...(v as Partial<Settings>) } : null),
});

const arrayOf =
  <T>() =>
  (v: unknown): T[] | null =>
    Array.isArray(v) ? (v as T[]) : null;

export const favoritesStore = createStore<string[]>("favorites", [], { validate: arrayOf<string>() });
export const viewedStore = createStore<HistoryEntry[]>("history.viewed", [], { validate: arrayOf<HistoryEntry>() });
export const cookedStore = createStore<HistoryEntry[]>("history.cooked", [], { validate: arrayOf<HistoryEntry>() });
export const sessionsStore = createStore<Record<string, CookingSession>>("cooking.sessions", {}, {
  validate: (v) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, CookingSession>) : null),
});
export const timersStore = createStore<KitchenTimer[]>("timers", [], { validate: arrayOf<KitchenTimer>() });
export const conversationsStore = createStore<Conversation[]>("ai.conversations", [], {
  validate: arrayOf<Conversation>(),
});
export const deviceIdStore = createStore<string>("device.id", "");

/* ---------------- Hooks ---------------- */

export const useSettings = () => useStore(settingsStore);
export const updateSettings = (patch: Partial<Settings>) => settingsStore.set((s) => ({ ...s, ...patch }));

export const useFavorites = () => useStore(favoritesStore);
export function toggleFavorite(slug: string) {
  favoritesStore.set((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list]));
}

const pushHistory = (list: HistoryEntry[], slug: string, max = 20) =>
  [{ slug, at: Date.now() }, ...list.filter((h) => h.slug !== slug)].slice(0, max);

export const useViewed = () => useStore(viewedStore);
export const recordViewed = (slug: string) => viewedStore.set((l) => pushHistory(l, slug));
export const useCooked = () => useStore(cookedStore);
export const recordCooked = (slug: string) => cookedStore.set((l) => pushHistory(l, slug));

export const useSessions = () => useStore(sessionsStore);
export function saveSession(session: CookingSession) {
  sessionsStore.set((all) => ({ ...all, [session.recipeSlug]: { ...session, updatedAt: Date.now() } }));
}
export function clearSession(slug: string) {
  sessionsStore.set((all) => {
    if (!all[slug]) return all;
    const next = { ...all };
    delete next[slug];
    return next;
  });
}

export const useConversations = () => useStore(conversationsStore);
