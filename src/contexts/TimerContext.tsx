"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { KitchenTimer } from "@/types";
import { timersStore, useSettings } from "@/lib/storage/stores";
import { useStore } from "@/lib/storage/store";
import {
  createTimer,
  pauseTimer,
  resetTimer,
  setDuration,
  settleTimers,
  startTimer,
} from "@/lib/timers/timers";
import { startAlarm, stopAlarm, unlockAudio } from "@/lib/audio/alarm";
import { useNow } from "@/hooks/useNow";
import { uid } from "@/lib/cn";

interface TimerContextValue {
  timers: KitchenTimer[];
  now: number;
  ringing: KitchenTimer[];
  add: (label: string, durationMs: number, opts?: { start?: boolean; source?: KitchenTimer["source"] }) => KitchenTimer;
  start: (id: string) => void;
  pause: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, label: string) => void;
  changeDuration: (id: string, durationMs: number) => void;
  addTime: (id: string, ms: number) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimers(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimers must be used inside <TimerProvider>");
  return ctx;
}

const update = (id: string, fn: (t: KitchenTimer) => KitchenTimer) =>
  timersStore.set((list) => list.map((t) => (t.id === id ? fn(t) : t)));

export function TimerProvider({ children }: { children: ReactNode }) {
  const timers = useStore(timersStore);
  const settings = useSettings();
  const anyRunning = timers.some((t) => t.status === "running");
  // The tick only drives re-rendering; remaining time is derived from Date.now().
  const now = useNow(anyRunning ? 250 : 1000);

  // Settle finished timers on every tick (also catches timers that ended while the app was closed).
  useEffect(() => {
    const { timers: next } = settleTimers(timersStore.get(), Date.now());
    if (next !== timersStore.get()) timersStore.set(next);
  }, [now, timers]);

  const ringing = useMemo(() => timers.filter((t) => t.status === "done" && !t.acknowledged), [timers]);

  useEffect(() => {
    if (ringing.length > 0 && settings.alarmVolume > 0) startAlarm(settings.alarmVolume);
    else stopAlarm();
  }, [ringing.length, settings.alarmVolume]);

  useEffect(() => () => stopAlarm(), []);

  // Browsers block audio until a gesture: unlock on the first remote/keyboard press.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("keydown", unlock, { capture: true });
    window.addEventListener("pointerdown", unlock, { capture: true });
    return () => {
      window.removeEventListener("keydown", unlock, { capture: true });
      window.removeEventListener("pointerdown", unlock, { capture: true });
    };
  }, []);

  const add = useCallback<TimerContextValue["add"]>((label, durationMs, opts) => {
    const t = createTimer({ id: uid("tmr"), label, durationMs, now: Date.now(), start: opts?.start, source: opts?.source });
    timersStore.set((list) => [...list, t]);
    return t;
  }, []);

  const value = useMemo<TimerContextValue>(
    () => ({
      timers,
      now,
      ringing,
      add,
      start: (id) => update(id, (t) => startTimer(t, Date.now())),
      pause: (id) => update(id, (t) => pauseTimer(t, Date.now())),
      reset: (id) => update(id, resetTimer),
      remove: (id) => timersStore.set((list) => list.filter((t) => t.id !== id)),
      rename: (id, label) => update(id, (t) => ({ ...t, label: label.trim() || t.label })),
      changeDuration: (id, ms) => update(id, (t) => setDuration(t, ms)),
      addTime: (id, ms) =>
        update(id, (t) => {
          const n = Date.now();
          if (t.status === "running" && t.endsAt) return { ...t, endsAt: t.endsAt + ms, durationMs: t.durationMs + ms };
          if (t.status === "done") return { ...t, status: "running", endsAt: n + ms, remainingMs: ms, acknowledged: false, finishedAt: null };
          return { ...t, remainingMs: t.remainingMs + ms, durationMs: t.durationMs + ms };
        }),
      acknowledge: (id) => update(id, (t) => ({ ...t, acknowledged: true })),
      acknowledgeAll: () =>
        timersStore.set((list) => list.map((t) => (t.status === "done" && !t.acknowledged ? { ...t, acknowledged: true } : t))),
    }),
    [timers, now, ringing, add],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
