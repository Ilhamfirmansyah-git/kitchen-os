"use client";

import { forwardRef } from "react";
import { Minus, Plus } from "lucide-react";
import { Focusable } from "./Focusable";
import { TVButton } from "./TVButton";
import { cn } from "@/lib/cn";

/* ------------------------------ Stepper ------------------------------ */

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  focusKey?: string;
  autoFocus?: boolean;
}

/** −/value/+ control. Two large buttons instead of a slider: reliable with a D-pad. */
export function TVStepper({ label, value, min, max, step = 1, onChange, format, focusKey, autoFocus }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center gap-4" role="group" aria-label={label}>
      <TVButton
        iconOnly
        icon={Minus}
        ariaLabel={`Decrease ${label}`}
        disabled={value <= min}
        onSelect={() => onChange(clamp(value - step))}
        focusKey={focusKey ? `${focusKey}-dec` : undefined}
      />
      <div className="min-w-[7rem] text-center font-display text-[2rem] font-bold tabular-nums" aria-live="polite">
        {format ? format(value) : value}
      </div>
      <TVButton
        iconOnly
        icon={Plus}
        ariaLabel={`Increase ${label}`}
        disabled={value >= max}
        onSelect={() => onChange(clamp(value + step))}
        focusKey={focusKey ? `${focusKey}-inc` : undefined}
        autoFocus={autoFocus}
      />
    </div>
  );
}

/* ------------------------------ Toggle ------------------------------ */

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  focusKey?: string;
  autoFocus?: boolean;
}

export function TVToggle({ label, description, checked, onChange, focusKey, autoFocus }: ToggleProps) {
  return (
    <Focusable
      role="switch"
      ariaPressed={checked}
      focusKey={focusKey}
      autoFocus={autoFocus}
      onSelect={() => onChange(!checked)}
      className="tv-row flex w-full items-center justify-between gap-8 text-left"
    >
      <span>
        <span className="block text-[1.5rem] font-semibold">{label}</span>
        {description && <span className="mt-1 block text-[1.125rem] text-[var(--text-secondary)]">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-10 w-[4.5rem] shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--primary)]" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-8 w-8 rounded-full bg-white transition-transform",
            checked ? "translate-x-[2.25rem]" : "translate-x-1",
          )}
        />
      </span>
    </Focusable>
  );
}

/* ------------------------------ Segmented choice ------------------------------ */

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  focusKey?: string;
}

export function TVChoice<T extends string>({ label, value, options, onChange, focusKey }: ChoiceProps<T>) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <TVButton
          key={o.value}
          role="radio"
          active={o.value === value}
          variant={o.value === value ? "primary" : "secondary"}
          onSelect={() => onChange(o.value)}
          focusKey={focusKey ? `${focusKey}-${o.value}` : undefined}
        >
          {o.label}
        </TVButton>
      ))}
    </div>
  );
}

/* ------------------------------ Text input ------------------------------ */

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  onSubmit?: () => void;
  focusKey?: string;
  autoFocus?: boolean;
  className?: string;
  maxLength?: number;
}

/**
 * Text field that is itself a D-pad target. On Android TV, selecting it opens
 * the system on-screen keyboard. Escape leaves the field; Up/Down navigate.
 */
export const TVInput = forwardRef<HTMLInputElement, InputProps>(function TVInput(
  { value, onChange, placeholder, label, onSubmit, focusKey, autoFocus, className, maxLength = 200 },
  ref,
) {
  return (
    <input
      ref={ref}
      data-focusable=""
      data-focus-key={focusKey}
      data-autofocus={autoFocus ? "" : undefined}
      aria-label={label}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      enterKeyHint={onSubmit ? "send" : "search"}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
      className={cn("tv-input h-16 w-full px-6 text-[1.5rem]", className)}
    />
  );
});
