/** In-memory store feeding the development-only navigation debug overlay. */

export interface DebugSnapshot {
  lastKey: string;
  lastCode: string;
  lastKeyCode: number;
  action: string | null;
  focusKey: string;
  focusLabel: string;
  rect: { left: number; top: number; width: number; height: number } | null;
  count: number;
}

let snapshot: DebugSnapshot = {
  lastKey: "—",
  lastCode: "—",
  lastKeyCode: 0,
  action: null,
  focusKey: "—",
  focusLabel: "—",
  rect: null,
  count: 0,
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const debugStore = {
  get: () => snapshot,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  key(e: KeyboardEvent, action: string | null) {
    snapshot = { ...snapshot, lastKey: e.key, lastCode: e.code, lastKeyCode: e.keyCode, action, count: snapshot.count + 1 };
    window.dispatchEvent(new CustomEvent("kos:key", { detail: { key: e.key, code: e.code, keyCode: e.keyCode, action } }));
    emit();
  },
  focus(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    snapshot = {
      ...snapshot,
      focusKey: el.dataset.focusKey ?? "(no key)",
      focusLabel: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 60),
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
    };
    emit();
  },
};
