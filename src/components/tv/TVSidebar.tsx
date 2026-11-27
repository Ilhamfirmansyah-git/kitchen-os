"use client";

import { usePathname } from "next/navigation";
import { BookOpen, ChefHat, CirclePlay, Heart, House, Settings, Sparkles, Timer, type LucideIcon } from "lucide-react";
import { Focusable } from "./Focusable";
import { FocusGroup } from "./FocusGroup";
import { useTimers } from "@/contexts/TimerContext";
import { formatDuration, remainingMs } from "@/lib/timers/timers";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/cooking", label: "Cooking", icon: ChefHat },
  { href: "/videos", label: "Videos", icon: CirclePlay },
  { href: "/ai-chef", label: "AI Chef", icon: Sparkles },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/timer", label: "Kitchen Timer", icon: Timer },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function TVSidebar() {
  const pathname = usePathname();
  const { timers, now } = useTimers();
  const running = timers
    .filter((t) => t.status === "running")
    .sort((a, b) => remainingMs(a, now) - remainingMs(b, now));
  const next = running[0];

  return (
    <aside className="flex h-full w-[19rem] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/60 px-5 py-10">
      <div className="mb-10 flex items-center gap-3 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[0.75rem] bg-[var(--primary)] text-[var(--background)]">
          <ChefHat size={28} strokeWidth={2.25} aria-hidden />
        </div>
        <div className="font-display text-[1.625rem] font-extrabold tracking-tight">
          KITCHEN <span className="text-[var(--primary)]">OS</span>
        </div>
      </div>

      <FocusGroup id="sidebar" restore as="nav" label="Main navigation" className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Focusable
              key={item.href}
              href={item.href}
              focusKey={`nav-${item.href}`}
              groupDefault={active}
              ariaCurrent={active ? "page" : undefined}
              className={cn("tv-nav-item flex h-16 items-center gap-4 rounded-[0.875rem] px-4 text-[1.375rem] font-semibold", active && "is-active")}
            >
              <span className="relative shrink-0">
                <Icon size={26} strokeWidth={2} aria-hidden />
                {item.href === "/timer" && running.length > 0 && (
                  <span
                    className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[0.9375rem] font-bold leading-none text-[#16201a]"
                    aria-label={`${running.length} running`}
                  >
                    {running.length}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Focusable>
          );
        })}
      </FocusGroup>

      <div className="mt-auto px-4">
        {next ? (
          <div className="rounded-[0.875rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4" aria-live="polite">
            <div className="text-[1rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">Next timer</div>
            <div className="mt-1 truncate text-[1.125rem] font-semibold">{next.label}</div>
            <div className="font-display text-[2rem] font-bold tabular-nums text-[var(--primary)]">
              {formatDuration(remainingMs(next, now))}
            </div>
          </div>
        ) : (
          <div className="text-[1rem] leading-snug text-[var(--text-secondary)]">Use ◀ ▶ ▲ ▼ and OK on your remote.</div>
        )}
      </div>
    </aside>
  );
}
