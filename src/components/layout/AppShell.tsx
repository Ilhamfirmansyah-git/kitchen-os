"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TVSidebar } from "@/components/tv/TVSidebar";
import { AlarmHost } from "@/components/timer/AlarmHost";
import { DebugOverlay } from "@/components/tv/DebugOverlay";
import { ConnectionBanner } from "./ConnectionBanner";
import { useSettings } from "@/lib/storage/stores";

/** Full-screen routes hide the sidebar (Cooking Mode, video player). */
function isImmersive(pathname: string) {
  return /^\/cooking\/[^/]+/.test(pathname) || /^\/videos\/[^/]+/.test(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const settings = useSettings();
  const immersive = isImmersive(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [settings.theme, settings.reduceMotion]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is best-effort */
    });
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {!immersive && <TVSidebar />}
      <main
        id="main"
        className="relative h-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <ConnectionBanner />
        {children}
      </main>
      <AlarmHost />
      {process.env.NODE_ENV !== "production" && settings.debugNavigation && <DebugOverlay />}
    </div>
  );
}
