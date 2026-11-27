"use client";

import type { ReactNode } from "react";
import { Focusable, type FocusableProps } from "./Focusable";
import { cn } from "@/lib/cn";

interface TVCardProps extends FocusableProps {
  media?: ReactNode;
  title: string;
  meta?: ReactNode;
  badge?: ReactNode;
  aspect?: "video" | "square" | "wide";
}

/** Poster-style card: media on top, title + meta below. Scales up on focus. */
export function TVCard({ media, title, meta, badge, aspect = "video", className, ...rest }: TVCardProps) {
  return (
    <Focusable {...rest} ariaLabel={rest.ariaLabel ?? title} className={cn("tv-card group block text-left", className)}>
      <div
        className={cn(
          "tv-card__media relative overflow-hidden rounded-[1rem] bg-[var(--surface)]",
          aspect === "video" && "aspect-video",
          aspect === "square" && "aspect-square",
          aspect === "wide" && "aspect-[21/9]",
        )}
      >
        {media}
        {badge && <div className="absolute left-4 top-4">{badge}</div>}
      </div>
      <div className="px-1 pt-4">
        <div className="line-clamp-2 font-display text-[1.5rem] font-semibold leading-snug text-[var(--text-primary)]">{title}</div>
        {meta && <div className="mt-2 text-[1.125rem] text-[var(--text-secondary)]">{meta}</div>}
      </div>
    </Focusable>
  );
}
