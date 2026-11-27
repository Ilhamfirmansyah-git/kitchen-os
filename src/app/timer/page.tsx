"use client";

import { useState } from "react";
import { Info, Pause, Pencil, Play, Plus, RotateCcw, Timer as TimerIcon, Trash2 } from "lucide-react";
import { EmptyState, Page, PageHeader } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";
import { TVModal } from "@/components/tv/TVModal";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { TimerEditor } from "@/components/timer/TimerEditor";
import { useTimers } from "@/contexts/TimerContext";
import { formatDuration, remainingMs } from "@/lib/timers/timers";
import type { KitchenTimer } from "@/types";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<KitchenTimer["status"], string> = {
  idle: "Ready",
  running: "Running",
  paused: "Paused",
  done: "Finished",
};

export default function TimerPage() {
  const api = useTimers();
  const [editor, setEditor] = useState<{ mode: "create" } | { mode: "edit"; timer: KitchenTimer } | null>(null);
  const [deleting, setDeleting] = useState<KitchenTimer | null>(null);

  const timers = [...api.timers].sort((a, b) => {
    const order = { running: 0, paused: 1, done: 2, idle: 3 } as const;
    return order[a.status] - order[b.status] || a.createdAt - b.createdAt;
  });

  return (
    <Page>
      <PageHeader
        title="Kitchen Timer"
        subtitle={
          timers.length
            ? `${timers.filter((t) => t.status === "running").length} running · ${timers.length} total`
            : "Run as many timers as you need at once."
        }
        actions={
          <TVButton variant="primary" size="lg" icon={Plus} onSelect={() => setEditor({ mode: "create" })} autoFocus={timers.length === 0} focusKey="timer-new">
            New timer
          </TVButton>
        }
      />

      {timers.length === 0 ? (
        <EmptyState
          icon={<TimerIcon size={56} aria-hidden />}
          title="No timers yet"
          body="Create a timer, pick a preset like “Boil eggs · 8 min”, or start one from a step in Cooking Mode."
        />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {timers.map((t, i) => {
            const rem = remainingMs(t, api.now);
            const pct = t.durationMs ? 1 - rem / t.durationMs : 0;
            return (
              <article
                key={t.id}
                className={cn(
                  "rounded-[1.25rem] border bg-[var(--surface)] p-7",
                  t.status === "done" ? "border-[var(--primary)]" : "border-[var(--border)]",
                )}
                aria-label={`${t.label}, ${STATUS_LABEL[t.status]}, ${formatDuration(rem)} remaining`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="truncate font-display text-[1.75rem] font-bold">{t.label}</h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-3 py-1 text-[1rem] font-bold uppercase tracking-wider",
                      t.status === "running" && "bg-[var(--primary)] text-[#16201a]",
                      t.status === "paused" && "bg-white/12",
                      t.status === "done" && "bg-[var(--accent)] text-[#171a18]",
                      t.status === "idle" && "bg-white/6 text-[var(--text-secondary)]",
                    )}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <div className={cn("mt-3 font-display text-[4.5rem] font-bold leading-none tabular-nums", t.status === "paused" && "text-[var(--text-secondary)]")}>
                  {formatDuration(rem)}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} />
                </div>
                <FocusGroup id={`timer-${t.id}`} className="mt-6 flex gap-3">
                  {t.status === "running" ? (
                    <TVButton icon={Pause} onSelect={() => api.pause(t.id)} focusKey={`t-${t.id}-toggle`} autoFocus={i === 0}>
                      Pause
                    </TVButton>
                  ) : (
                    <TVButton variant="primary" icon={Play} onSelect={() => api.start(t.id)} focusKey={`t-${t.id}-toggle`} autoFocus={i === 0}>
                      {t.status === "paused" ? "Resume" : t.status === "done" ? "Restart" : "Start"}
                    </TVButton>
                  )}
                  <TVButton iconOnly icon={RotateCcw} ariaLabel={`Reset ${t.label}`} onSelect={() => api.reset(t.id)} focusKey={`t-${t.id}-reset`} />
                  <TVButton iconOnly icon={Pencil} ariaLabel={`Edit ${t.label}`} onSelect={() => setEditor({ mode: "edit", timer: t })} focusKey={`t-${t.id}-edit`} />
                  <TVButton iconOnly variant="danger" icon={Trash2} ariaLabel={`Delete ${t.label}`} onSelect={() => setDeleting(t)} focusKey={`t-${t.id}-del`} />
                </FocusGroup>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-14 flex max-w-[72rem] gap-4 text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
        <Info size={24} className="mt-1 shrink-0" aria-hidden />
        <p>
          Timers are calculated from the clock, so they stay accurate when you switch screens or reload. The alarm sounds while
          Kitchen OS is open on screen. If the TV browser is closed, put in the background, or the TV sleeps, the browser may
          pause the page and the alarm will only play when you return — a finished timer is then shown immediately. Keep Kitchen
          OS open for time-critical cooking.
        </p>
      </div>

      <TimerEditor
        open={!!editor}
        mode={editor?.mode ?? "create"}
        initialLabel={editor?.mode === "edit" ? editor.timer.label : ""}
        initialMs={editor?.mode === "edit" ? editor.timer.durationMs : 5 * 60_000}
        onClose={() => setEditor(null)}
        onSave={(label, ms, start) => {
          if (editor?.mode === "edit") {
            const t = editor.timer;
            api.rename(t.id, label);
            if (ms !== t.durationMs) api.changeDuration(t.id, ms);
          } else {
            api.add(label, ms, { start });
          }
          setEditor(null);
        }}
      />

      <TVModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.label ?? ""}”?`}
        size="sm"
        tone="danger"
        actions={
          <>
            <TVButton variant="primary" size="lg" autoFocus onSelect={() => setDeleting(null)} focusKey="del-cancel">
              Cancel
            </TVButton>
            <TVButton
              variant="danger"
              size="lg"
              icon={Trash2}
              onSelect={() => {
                if (deleting) api.remove(deleting.id);
                setDeleting(null);
              }}
              focusKey="del-confirm"
            >
              Delete
            </TVButton>
          </>
        }
      />
    </Page>
  );
}
