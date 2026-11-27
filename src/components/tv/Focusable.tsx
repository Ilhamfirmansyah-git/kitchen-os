"use client";

import Link from "next/link";
import { forwardRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

export interface FocusableProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stable id used to restore focus when returning to a screen. */
  focusKey?: string;
  /** Focus this element when the screen (or modal) opens. */
  autoFocus?: boolean;
  /** Preferred item when focus enters this element's FocusGroup. */
  groupDefault?: boolean;
  disabled?: boolean;
  /** Render a Next.js link instead of a button. */
  href?: string;
  onSelect?: (e: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  ariaCurrent?: "page" | "step" | true;
  role?: string;
  type?: "button" | "submit";
  title?: string;
  id?: string;
}

/**
 * The primitive every D-pad target is built on. It always renders a native
 * <button> or <a> so Enter/NumpadEnter activate it natively, screen readers
 * understand it, and mouse/touch still work as a fallback.
 */
export const Focusable = forwardRef<HTMLElement, FocusableProps>(function Focusable(
  {
    children,
    className,
    style,
    focusKey,
    autoFocus,
    groupDefault,
    disabled,
    href,
    onSelect,
    onKeyDown,
    onFocus,
    ariaLabel,
    ariaPressed,
    ariaCurrent,
    role,
    type = "button",
    title,
    id,
  },
  ref,
) {
  const data = {
    "data-focusable": "",
    "data-focus-key": focusKey,
    "data-autofocus": autoFocus ? "" : undefined,
    "data-focus-default": groupDefault ? "" : undefined,
    "data-disabled": disabled ? "true" : undefined,
  };

  if (href && !disabled) {
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={className}
        style={style}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        title={title}
        id={id}
        {...data}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-current={ariaCurrent}
      aria-disabled={disabled || undefined}
      role={role}
      onClick={(e) => {
        if (disabled) return;
        onSelect?.(e);
      }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      title={title}
      id={id}
      {...data}
    >
      {children}
    </button>
  );
});
