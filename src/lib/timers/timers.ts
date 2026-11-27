import type { KitchenTimer } from "@/types";

/**
 * Timer maths. Timers never count down a stored number with setInterval;
 * a running timer stores the absolute epoch `endsAt`, and the remaining time
 * is always derived from the wall clock. That keeps timers accurate when the
 * tab is throttled, navigated away from, or reloaded.
 */

export function remainingMs(t: KitchenTimer, now: number): number {
  if (t.status === "running" && t.endsAt != null) return Math.max(0, t.endsAt - now);
  if (t.status === "done") return 0;
  return Math.max(0, t.remainingMs);
}

export function createTimer(input: {
  id: string;
  label: string;
  durationMs: number;
  now: number;
  start?: boolean;
  source?: KitchenTimer["source"];
}): KitchenTimer {
  const durationMs = Math.max(1000, Math.round(input.durationMs));
  return {
    id: input.id,
    label: input.label.trim() || "Timer",
    durationMs,
    status: input.start ? "running" : "idle",
    endsAt: input.start ? input.now + durationMs : null,
    remainingMs: durationMs,
    createdAt: input.now,
    finishedAt: null,
    acknowledged: false,
    source: input.source,
  };
}

export function startTimer(t: KitchenTimer, now: number): KitchenTimer {
  if (t.status === "running") return t;
  const rem = t.status === "done" ? t.durationMs : t.remainingMs > 0 ? t.remainingMs : t.durationMs;
  return { ...t, status: "running", endsAt: now + rem, remainingMs: rem, finishedAt: null, acknowledged: false };
}

export function pauseTimer(t: KitchenTimer, now: number): KitchenTimer {
  if (t.status !== "running") return t;
  return { ...t, status: "paused", remainingMs: remainingMs(t, now), endsAt: null };
}

export function resetTimer(t: KitchenTimer): KitchenTimer {
  return { ...t, status: "idle", endsAt: null, remainingMs: t.durationMs, finishedAt: null, acknowledged: false };
}

export function setDuration(t: KitchenTimer, durationMs: number): KitchenTimer {
  const d = Math.max(1000, Math.round(durationMs));
  return { ...t, durationMs: d, status: "idle", endsAt: null, remainingMs: d, finishedAt: null, acknowledged: false };
}

/** Marks running timers whose end time has passed as done. Returns the same array when nothing changed. */
export function settleTimers(timers: KitchenTimer[], now: number): { timers: KitchenTimer[]; finished: KitchenTimer[] } {
  const finished: KitchenTimer[] = [];
  let changed = false;
  const next = timers.map((t) => {
    if (t.status === "running" && t.endsAt != null && t.endsAt <= now) {
      changed = true;
      const done: KitchenTimer = { ...t, status: "done", remainingMs: 0, finishedAt: t.endsAt, endsAt: null };
      finished.push(done);
      return done;
    }
    return t;
  });
  return { timers: changed ? next : timers, finished };
}

export function formatDuration(ms: number, opts: { alwaysHours?: boolean } = {}): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 || opts.alwaysHours ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function splitDuration(ms: number) {
  const total = Math.round(ms / 1000);
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}
