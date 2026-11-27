"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  currentFocusable,
  defaultTarget,
  focusElement,
  getScope,
  moveFocus,
  moveFocusSequential,
  noteFocused,
  recoverFocus,
  restoreRouteFocus,
  toBox,
} from "@/lib/navigation/engine";
import { isEditable, toRemoteAction, type RemoteAction } from "@/lib/navigation/keys";
import type { Box } from "@/lib/navigation/spatial";
import { debugStore } from "@/lib/navigation/debug";
import { settingsStore } from "@/lib/storage/stores";
import { playClick } from "@/lib/audio/alarm";

type BackHandler = () => void;

interface TVNavigationContextValue {
  /** Push a handler that consumes the next Back press. Returns an unregister fn. */
  registerBack: (handler: BackHandler) => () => void;
  /** Perform a Back action (same as pressing Back on the remote). */
  goBack: () => void;
  focusDefault: () => void;
}

const TVNavigationContext = createContext<TVNavigationContextValue | null>(null);

export function useTVNavigation(): TVNavigationContextValue {
  const ctx = useContext(TVNavigationContext);
  if (!ctx) throw new Error("useTVNavigation must be used inside <TVNavigationProvider>");
  return ctx;
}

/** Consume Back presses while `enabled` (modals, cooking-mode exit guard...). */
export function useBackHandler(handler: BackHandler, enabled = true) {
  const { registerBack } = useTVNavigation();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    return registerBack(() => ref.current());
  }, [enabled, registerBack]);
}

/** Subscribe to media keys (MediaPlayPause, MediaPlay, MediaPause). */
export function useMediaKeys(handler: (action: "playPause" | "play" | "pause") => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const on = (e: Event) => ref.current((e as CustomEvent).detail);
    window.addEventListener("kos:media", on);
    return () => window.removeEventListener("kos:media", on);
  }, []);
}

const NATIVE_ACTIVATE = "button, a[href], input, select, textarea, summary";
const REPEAT_INTERVAL_MS = 85;

export function TVNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const handlers = useRef<BackHandler[]>([]);
  const sentinel = useRef(false);
  const ignorePops = useRef(0);
  const lastBox = useRef<Box | null>(null);
  const lastMove = useRef(0);

  /* ----------------------- History sentinel for hardware Back ----------------------- *
   * Many Android TV browsers turn the remote's Back button into history.back()
   * without delivering a key event. While something wants to intercept Back
   * (an open modal, cooking mode), we keep one extra same-URL history entry;
   * popping it calls the handler instead of leaving the screen.               */
  const ensureSentinel = useCallback(() => {
    if (sentinel.current) return;
    try {
      window.history.pushState({ ...(window.history.state ?? {}), kosSentinel: true }, "");
      sentinel.current = true;
    } catch {
      /* ignore */
    }
  }, []);

  const registerBack = useCallback(
    (handler: BackHandler) => {
      handlers.current.push(handler);
      ensureSentinel();
      return () => {
        handlers.current = handlers.current.filter((h) => h !== handler);
        // Deferred so StrictMode's unmount/remount does not churn history.
        window.setTimeout(() => {
          if (handlers.current.length || !sentinel.current) return;
          sentinel.current = false;
          if (window.history.state?.kosSentinel) {
            ignorePops.current += 1;
            window.history.back();
          }
        }, 60);
      };
    },
    [ensureSentinel],
  );

  const goBack = useCallback(() => {
    const top = handlers.current[handlers.current.length - 1];
    if (top) {
      top();
      return;
    }
    if (pathRef.current === "/") return; // Home is the root; never exit the app from a key.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePops.current > 0) {
        ignorePops.current -= 1;
        return;
      }
      if (!sentinel.current) return;
      sentinel.current = false;
      const top = handlers.current[handlers.current.length - 1];
      if (top) {
        top();
        if (handlers.current.length) ensureSentinel();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [ensureSentinel]);

  /* ----------------------------------- Keys ----------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = toRemoteAction(e);
      debugStore.key(e, action);
      if (!action || e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const active = document.activeElement as HTMLElement | null;
      const editing = isEditable(active);

      const run = (a: RemoteAction) => {
        switch (a) {
          case "up":
          case "down":
          case "left":
          case "right": {
            if (editing && active instanceof HTMLInputElement && (a === "left" || a === "right")) {
              const len = active.value.length;
              const s = active.selectionStart ?? len;
              const end = active.selectionEnd ?? len;
              const atEdge = a === "left" ? s === 0 && end === 0 : s === len && end === len;
              if (!atEdge) return; // let the caret move
            }
            if (active instanceof HTMLInputElement && active.type === "range" && (a === "left" || a === "right")) return;
            if (active instanceof HTMLTextAreaElement && (a === "up" || a === "down")) return;
            e.preventDefault();
            const now = performance.now();
            if (e.repeat && now - lastMove.current < REPEAT_INTERVAL_MS) return;
            lastMove.current = now;
            const moved = moveFocus(a);
            if (!moved && (a === "up" || a === "down")) scrollFallback(a);
            return;
          }
          case "select": {
            const el = currentFocusable();
            const st = settingsStore.get();
            if (st.soundEffects && el && !e.repeat) playClick(st.alarmVolume || 0.5);
            if (!el) {
              e.preventDefault();
              focusElement(defaultTarget());
              return;
            }
            if (el.matches(NATIVE_ACTIVATE)) return; // native click / submit
            e.preventDefault();
            el.click();
            return;
          }
          case "back": {
            if (editing && (e.key === "Backspace" || e.keyCode === 8)) return; // deleting text
            if (editing && e.key === "Escape") {
              e.preventDefault();
              active?.blur();
              const holder = active?.closest<HTMLElement>("[data-focusable]");
              if (holder && holder !== active) focusElement(holder);
              return;
            }
            e.preventDefault();
            goBack();
            return;
          }
          case "tab":
          case "tabBack":
            e.preventDefault();
            moveFocusSequential(a === "tabBack");
            return;
          case "playPause":
          case "play":
          case "pause":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("kos:media", { detail: a }));
            return;
        }
      };
      run(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack]);

  /* ------------------------- Focus tracking & recovery ------------------------- */
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-focusable]") as HTMLElement | null;
      if (!el) return;
      lastBox.current = toBox(el);
      noteFocused(el, pathRef.current);
      debugStore.focus(el);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget) return;
      window.setTimeout(() => {
        const a = document.activeElement;
        if (a && a !== document.body) return;
        recoverFocus(lastBox.current);
      }, 0);
    };
    // An embedded iframe (YouTube) can steal focus; pull it back so the remote keeps working.
    const onBlur = () => {
      window.setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) {
          recoverFocus(lastBox.current);
        }
      }, 0);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* --------------------- Route change → restore/initial focus --------------------- */
  useEffect(() => {
    pathRef.current = pathname;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const a = document.activeElement as HTMLElement | null;
      const insideMain = a?.closest("main") && a.matches("[data-focusable]");
      const inModal = getScope() !== document;
      if (inModal) return;
      if (insideMain && tries > 0) return;
      if (restoreRouteFocus(pathname)) return;
      if (++tries < 15) timer = window.setTimeout(attempt, 60);
      else if (!currentFocusable()) focusElement(defaultTarget());
    };
    timer = window.setTimeout(attempt, 30);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const value = useMemo<TVNavigationContextValue>(
    () => ({ registerBack, goBack, focusDefault: () => focusElement(defaultTarget()) }),
    [registerBack, goBack],
  );

  return <TVNavigationContext.Provider value={value}>{children}</TVNavigationContext.Provider>;
}

/** When nothing is focusable further up/down, scroll the content instead. */
function scrollFallback(dir: "up" | "down") {
  const active = document.activeElement as HTMLElement | null;
  let node: HTMLElement | null = active?.parentElement ?? null;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) break;
    node = node.parentElement;
  }
  const target = node ?? (document.scrollingElement as HTMLElement | null);
  if (!target) return;
  target.scrollBy({ top: (dir === "down" ? 1 : -1) * target.clientHeight * 0.5 });
}
