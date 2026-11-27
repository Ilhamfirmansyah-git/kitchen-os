"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Focusable, type FocusableProps } from "./Focusable";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

export interface TVButtonProps extends FocusableProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconOnly?: boolean;
  active?: boolean;
}

const SIZE: Record<Size, string> = {
  md: "h-14 px-6 text-[1.25rem] gap-3",
  lg: "h-16 px-8 text-[1.375rem] gap-3",
  xl: "h-20 px-10 text-[1.625rem] gap-4",
};
const ICON_ONLY: Record<Size, string> = { md: "h-14 w-14", lg: "h-16 w-16", xl: "h-20 w-20" };
const ICON: Record<Size, number> = { md: 24, lg: 26, xl: 30 };

export const TVButton = forwardRef<HTMLElement, TVButtonProps>(function TVButton(
  { variant = "secondary", size = "md", icon: Icon, iconOnly, active, className, children, ...rest },
  ref,
) {
  return (
    <Focusable
      ref={ref}
      {...rest}
      ariaPressed={rest.ariaPressed ?? (active !== undefined ? active : undefined)}
      className={cn(
        "tv-button inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap",
        iconOnly ? ICON_ONLY[size] : SIZE[size],
        `tv-button--${variant}`,
        active && "tv-button--active",
        rest.disabled && "opacity-40",
        className,
      )}
    >
      {Icon && <Icon size={ICON[size]} strokeWidth={2} aria-hidden />}
      {!iconOnly && children}
    </Focusable>
  );
});
