"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { TVModal } from "@/components/tv/TVModal";
import { TVButton } from "@/components/tv/TVButton";
import { TVInput, TVStepper } from "@/components/tv/TVControls";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { splitDuration } from "@/lib/timers/timers";

export const TIMER_PRESETS = [
  { label: "Boil eggs", minutes: 8 },
  { label: "Fry chicken", minutes: 12 },
  { label: "Cook rice", minutes: 25 },
  { label: "Pasta", minutes: 10 },
  { label: "Steep tea", minutes: 4 },
  { label: "Rest meat", minutes: 5 },
];

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialLabel?: string;
  initialMs?: number;
  onClose: () => void;
  onSave: (label: string, durationMs: number, start: boolean) => void;
}

export function TimerEditor({ open, mode, initialLabel = "", initialMs = 5 * 60_000, onClose, onSave }: Props) {
  return open ? <TimerEditorInner mode={mode} initialLabel={initialLabel} initialMs={initialMs} onClose={onClose} onSave={onSave} /> : null;
}

function TimerEditorInner({ mode, initialLabel, initialMs, onClose, onSave }: Omit<Props, "open"> & { initialLabel: string; initialMs: number }) {
  const init = splitDuration(initialMs);
  const [label, setLabel] = useState(initialLabel);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);
  const [s, setS] = useState(init.s);
  const ms = ((h * 60 + m) * 60 + s) * 1000;
  const valid = ms >= 1000;

  return (
    <TVModal
      open
      onClose={onClose}
      title={mode === "create" ? "New timer" : "Edit timer"}
      size="lg"
      actions={
        <>
          {mode === "create" && (
            <TVButton variant="primary" size="lg" disabled={!valid} onSelect={() => onSave(label || "Timer", ms, true)} focusKey="editor-start">
              Start timer
            </TVButton>
          )}
          <TVButton
            variant={mode === "edit" ? "primary" : "secondary"}
            size="lg"
            icon={Check}
            disabled={!valid}
            onSelect={() => onSave(label || "Timer", ms, false)}
            focusKey="editor-save"
          >
            {mode === "create" ? "Save without starting" : "Save"}
          </TVButton>
          <TVButton size="lg" variant="ghost" onSelect={onClose} focusKey="editor-cancel">
            Cancel
          </TVButton>
        </>
      }
    >
      {mode === "create" && (
        <>
          <div className="mb-3 text-[1.25rem] text-[var(--text-secondary)]">Quick presets</div>
          <FocusGroup id="editor-presets" className="mb-8 flex flex-wrap gap-3">
            {TIMER_PRESETS.map((p, i) => (
              <TVButton
                key={p.label}
                autoFocus={i === 0}
                onSelect={() => {
                  setLabel(p.label);
                  setH(0);
                  setM(p.minutes);
                  setS(0);
                }}
                focusKey={`preset-${i}`}
              >
                {p.label} · {p.minutes} min
              </TVButton>
            ))}
          </FocusGroup>
        </>
      )}

      <div className="mb-3 text-[1.25rem] text-[var(--text-secondary)]">Name</div>
      <TVInput label="Timer name" value={label} onChange={setLabel} placeholder="e.g. Boil eggs" focusKey="editor-name" autoFocus={mode === "edit"} maxLength={40} />

      <div className="mt-8 grid grid-cols-3 gap-6">
        {[
          { label: "Hours", value: h, set: setH, max: 23 },
          { label: "Minutes", value: m, set: setM, max: 59 },
          { label: "Seconds", value: s, set: setS, max: 59, step: 5 },
        ].map((f) => (
          <div key={f.label} className="rounded-[1rem] bg-[var(--surface)] p-5">
            <div className="mb-3 text-center text-[1.25rem] text-[var(--text-secondary)]">{f.label}</div>
            <div className="flex justify-center">
              <TVStepper
                label={f.label.toLowerCase()}
                value={f.value}
                min={0}
                max={f.max}
                step={f.step ?? 1}
                onChange={f.set}
                format={(v) => String(v).padStart(2, "0")}
                focusKey={`editor-${f.label}`}
              />
            </div>
          </div>
        ))}
      </div>
      {!valid && <p className="mt-4 text-[1.25rem] text-[var(--danger)]">Set at least 1 second.</p>}
    </TVModal>
  );
}
