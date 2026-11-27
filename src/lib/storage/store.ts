"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny local-first persistent store built on localStorage +
 * useSyncExternalStore. SSR renders the default value; the client switches
 * to the persisted value right after hydration without mismatch warnings.
 *
 * - Versioned keys (`kos:v1:*`) so the schema can evolve.
 * - Safe against quota errors, private mode, and corrupted JSON.
 * - Cross-tab sync via the `storage` event.
 */

const PREFIX = "kos:v1:";

export interface PersistentStore<T> {
  key: string;
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
  getServerSnapshot(): T;
}

const registry = new Map<string, PersistentStore<unknown>>();

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function createStore<T>(
  name: string,
  defaultValue: T,
  options: { validate?: (value: unknown) => T | null } = {},
): PersistentStore<T> {
  const key = PREFIX + name;
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let loaded = false;

  const read = (): T => {
    if (!storageAvailable()) return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return defaultValue;
      const parsed = JSON.parse(raw) as unknown;
      if (options.validate) return options.validate(parsed) ?? defaultValue;
      return parsed as T;
    } catch {
      return defaultValue;
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const store: PersistentStore<T> = {
    key,
    get() {
      if (!loaded) {
        cache = read();
        loaded = true;
      }
      return cache as T;
    },
    set(next) {
      const prev = store.get();
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (Object.is(value, prev)) return;
      cache = value;
      if (storageAvailable()) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Quota exceeded or storage disabled: keep the in-memory value.
        }
      }
      emit();
    },
    reset() {
      cache = defaultValue;
      if (storageAvailable()) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          cache = read();
          loaded = true;
          listener();
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    getServerSnapshot() {
      return defaultValue;
    },
  };

  registry.set(key, store as PersistentStore<unknown>);
  return store;
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

/** Wipes every Kitchen OS key (used by Settings → Reset local data). */
export function resetAllStores(): void {
  registry.forEach((s) => s.reset());
  if (storageAvailable()) {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("kos:"))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

/** Snapshot of all Kitchen OS data, used for optional cloud backup. */
export function exportAllStores(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  registry.forEach((s, k) => (out[k] = s.get()));
  return out;
}

export function importAllStores(data: Record<string, unknown>): void {
  Object.entries(data).forEach(([k, v]) => {
    const s = registry.get(k);
    if (s) s.set(v);
  });
}

/** True after the first client render — use to avoid flashing defaults. */
const noopSubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
