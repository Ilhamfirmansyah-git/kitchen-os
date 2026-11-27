"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

/** Non-blocking notice; recipes, timers and cooking keep working offline. */
export function ConnectionBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-14 py-3 text-[1.25rem]"
    >
      <WifiOff size={24} aria-hidden className="text-[var(--danger)]" />
      <span>
        You are offline. Recipes, timers and Cooking Mode still work; AI Chef and videos need internet.
      </span>
    </div>
  );
}
