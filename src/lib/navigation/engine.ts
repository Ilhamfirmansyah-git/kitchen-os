/**
 * DOM side of the remote navigation engine.
 *
 * Conventions (set by <Focusable/>, <FocusGroup/>, <TVModal/>):
 *  - [data-focusable]           an element the D-pad can land on
 *  - [data-focus-key]           stable id used to restore focus after navigation
 *  - [data-autofocus]           preferred element when a screen opens
 *  - [data-focus-group=id]      a logical group (row, sidebar, toolbar)
 *  - [data-focus-restore=true]  entering the group returns to its last item
 *  - [data-focus-default]       item to use when entering a group the first time
 *  - [data-focus-scope=modal]   focus is trapped inside the top-most scope
 */

import { pickCandidate, pickNearest, type Box, type Direction } from "./spatial";

const FOCUSABLE = "[data-focusable]:not([data-disabled='true'])";

// Plain element refs: WeakRef is missing on older Android TV WebViews.
const groupMemory = new Map<string, HTMLElement>();
const routeMemory = new Map<string, string>();

export function getScope(): ParentNode {
  const scopes = document.querySelectorAll<HTMLElement>("[data-focus-scope='modal']");
  return scopes.length ? scopes[scopes.length - 1] : document;
}

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  if (el.closest("[inert],[aria-hidden='true']")) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

export function getFocusables(scope: ParentNode = getScope()): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

const toBox = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
};

export function currentFocusable(): HTMLElement | null {
  const a = document.activeElement as HTMLElement | null;
  if (!a || a === document.body) return null;
  return a.matches("[data-focusable]") ? a : (a.closest("[data-focusable]") as HTMLElement | null);
}

export function focusElement(el: HTMLElement | null | undefined): boolean {
  if (!el) return false;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  return document.activeElement === el;
}

function rememberedIn(group: HTMLElement, scope: ParentNode): HTMLElement | null {
  const id = group.dataset.focusGroup;
  if (!id) return null;
  const ref = groupMemory.get(id);
  if (ref && ref.isConnected && group.contains(ref) && isVisible(ref) && (scope === document || (scope as Element).contains(ref))) {
    return ref;
  }
  const def = group.querySelector<HTMLElement>(`${FOCUSABLE}[data-focus-default]`);
  return def && isVisible(def) ? def : null;
}

/** Move focus in a direction. Returns true when focus moved. */
export function moveFocus(dir: Direction): boolean {
  const scope = getScope();
  const current = currentFocusable();
  const all = getFocusables(scope);
  if (!current || !all.includes(current)) {
    return focusElement(defaultTarget(scope));
  }
  const candidates = all.filter((el) => el !== current && !current.contains(el));
  const idx = pickCandidate(toBox(current), candidates.map(toBox), dir);
  if (idx < 0) return false;
  let target = candidates[idx];

  const targetGroup = target.closest<HTMLElement>("[data-focus-group]");
  const currentGroup = current.closest<HTMLElement>("[data-focus-group]");
  if (targetGroup && targetGroup !== currentGroup && targetGroup.dataset.focusRestore === "true") {
    target = rememberedIn(targetGroup, scope) ?? target;
  }
  return focusElement(target);
}

/** Tab / Shift+Tab: DOM order, confined to the current scope. */
export function moveFocusSequential(backwards: boolean): boolean {
  const all = getFocusables();
  if (!all.length) return false;
  const current = currentFocusable();
  const i = current ? all.indexOf(current) : -1;
  const next = backwards ? (i <= 0 ? all.length - 1 : i - 1) : (i + 1) % all.length;
  return focusElement(all[next]);
}

export function defaultTarget(scope: ParentNode = getScope()): HTMLElement | null {
  const auto = Array.from(scope.querySelectorAll<HTMLElement>(`${FOCUSABLE}[data-autofocus]`)).find(isVisible);
  if (auto) return auto;
  const main = scope === document ? document.querySelector("main") : scope;
  const inMain = main ? getFocusables(main) : [];
  return inMain[0] ?? getFocusables(scope)[0] ?? null;
}

/** Recover focus near the last known position after the element vanished. */
export function recoverFocus(lastBox: Box | null): boolean {
  const scope = getScope();
  const all = getFocusables(scope);
  if (!all.length) return false;
  if (!lastBox) return focusElement(defaultTarget(scope));
  const i = pickNearest(lastBox, all.map(toBox));
  return focusElement(all[i] ?? defaultTarget(scope));
}

export function noteFocused(el: HTMLElement, pathname: string) {
  const group = el.closest<HTMLElement>("[data-focus-group]");
  if (group?.dataset.focusGroup) groupMemory.set(group.dataset.focusGroup, el);
  const key = el.dataset.focusKey;
  if (key && el.closest("main") && !el.closest("[data-focus-scope='modal']")) routeMemory.set(pathname, key);
}

export function restoreRouteFocus(pathname: string): boolean {
  const key = routeMemory.get(pathname);
  if (key) {
    const el = document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`);
    if (el && isVisible(el)) return focusElement(el);
  }
  const main = document.querySelector("main");
  if (!main) return false;
  const auto = Array.from(main.querySelectorAll<HTMLElement>(`${FOCUSABLE}[data-autofocus]`)).find(isVisible);
  const first = auto ?? getFocusables(main)[0];
  return first ? focusElement(first) : false;
}

export { toBox };
