"use client";

import { useSyncExternalStore } from "react";
import { debugStore } from "@/lib/navigation/debug";

/** Development-only: shows the last key and outlines the focused element. */
export function DebugOverlay() {
  const s = useSyncExternalStore(debugStore.subscribe, debugStore.get, debugStore.get);
  return (
    <>
      {s.rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[200] border-2 border-dashed border-fuchsia-400"
          style={{ left: s.rect.left - 6, top: s.rect.top - 6, width: s.rect.width + 12, height: s.rect.height + 12 }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-4 right-4 z-[200] w-[26rem] rounded-xl bg-black/85 p-4 font-mono text-[0.95rem] leading-relaxed text-fuchsia-200"
      >
        <div className="font-bold text-fuchsia-400">REMOTE DEBUG (dev only)</div>
        <div>key: {s.lastKey} · code: {s.lastCode} · keyCode: {s.lastKeyCode}</div>
        <div>action: {s.action ?? "—"} · presses: {s.count}</div>
        <div className="truncate">focus: {s.focusKey}</div>
        <div className="truncate">label: {s.focusLabel}</div>
      </div>
    </>
  );
}
