"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBackHandler } from "./TVNavigationProvider";
import { focusElement, getFocusables } from "@/lib/navigation/engine";
import { cn } from "@/lib/cn";

interface TVModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row, rendered at the bottom. */
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "danger";
}

/**
 * Modal dialog with focus trapping (the navigation engine only sees the
 * top-most [data-focus-scope=modal]), Back-to-close (key or hardware Back),
 * and focus restoration to the element that opened it.
 */
export function TVModal({ open, onClose, title, description, children, actions, size = "md", tone = "default" }: TVModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useBackHandler(onClose, open);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const auto = panel.querySelector<HTMLElement>("[data-focusable][data-autofocus]");
      focusElement(auto ?? getFocusables(panel)[0] ?? panel);
    }, 20);
    return () => {
      window.clearTimeout(t);
      const back = returnTo.current;
      // Restore after the portal is removed.
      window.setTimeout(() => {
        if (back && back.isConnected) focusElement(back);
      }, 0);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fade-in" data-focus-scope="modal">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "max-h-[88vh] overflow-y-auto rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-12 shadow-2xl animate-rise outline-none",
          size === "sm" && "w-[44rem]",
          size === "md" && "w-[60rem]",
          size === "lg" && "w-[84rem]",
        )}
      >
        <h2 className={cn("font-display text-[2.5rem] font-bold leading-tight", tone === "danger" && "text-[var(--danger)]")}>
          {title}
        </h2>
        {description && <div className="mt-4 text-[1.5rem] leading-relaxed text-[var(--text-secondary)]">{description}</div>}
        {children && <div className="mt-8">{children}</div>}
        {actions && <div className="mt-10 flex flex-wrap gap-4">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
