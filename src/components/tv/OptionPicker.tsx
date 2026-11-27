"use client";

import { Check } from "lucide-react";
import { TVModal } from "./TVModal";
import { Focusable } from "./Focusable";
import { TVButton } from "./TVButton";
import { cn } from "@/lib/cn";

interface Option<T> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T> {
  open: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  onClose: () => void;
}

/** D-pad friendly replacement for <select>: a modal grid of large options. */
export function OptionPicker<T extends string | number | null>({ open, title, options, value, onChange, onClose }: Props<T>) {
  return (
    <TVModal open={open} onClose={onClose} title={title} size="lg" actions={<TVButton onSelect={onClose}>Close</TVButton>}>
      <div className="grid grid-cols-3 gap-4" role="listbox" aria-label={title}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Focusable
              key={String(o.value)}
              role="option"
              ariaPressed={selected}
              autoFocus={selected}
              onSelect={() => {
                onChange(o.value);
                onClose();
              }}
              className={cn("tv-row flex items-center justify-between gap-4 text-left", selected && "border-[var(--primary)]!")}
            >
              <span>
                <span className="block text-[1.5rem] font-semibold">{o.label}</span>
                {o.hint && <span className="block text-[1.125rem] text-[var(--text-secondary)]">{o.hint}</span>}
              </span>
              {selected && <Check size={28} className="text-[var(--primary)]" aria-hidden />}
            </Focusable>
          );
        })}
      </div>
    </TVModal>
  );
}
