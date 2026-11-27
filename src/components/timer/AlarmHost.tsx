"use client";

import { BellRing, Plus, Square } from "lucide-react";
import { useTimers } from "@/contexts/TimerContext";
import { TVModal } from "@/components/tv/TVModal";
import { TVButton } from "@/components/tv/TVButton";
import { formatClock } from "@/lib/format";
import { useSettings } from "@/lib/storage/stores";

/** Global alarm: visible on every screen, stoppable with OK or Back. */
export function AlarmHost() {
  const { ringing, acknowledgeAll, addTime } = useTimers();
  const settings = useSettings();
  const open = ringing.length > 0;
  const first = ringing[0];

  return (
    <TVModal
      open={open}
      onClose={acknowledgeAll}
      title={ringing.length > 1 ? `${ringing.length} timers finished` : "Timer finished"}
      size="md"
      actions={
        <>
          <TVButton variant="primary" size="xl" icon={Square} autoFocus onSelect={acknowledgeAll} focusKey="alarm-stop">
            Stop alarm
          </TVButton>
          {first && ringing.length === 1 && (
            <TVButton size="xl" icon={Plus} onSelect={() => addTime(first.id, 60_000)} focusKey="alarm-snooze">
              1 more minute
            </TVButton>
          )}
        </>
      }
    >
      <ul className="space-y-4">
        {ringing.map((t) => (
          <li key={t.id} className="flex items-center gap-5 rounded-[1rem] bg-[var(--surface)] p-6">
            <BellRing size={40} className="animate-ring shrink-0 text-[var(--primary)]" aria-hidden />
            <div>
              <div className="font-display text-[2.25rem] font-bold leading-tight">{t.label}</div>
              {t.finishedAt && (
                <div className="text-[1.25rem] text-[var(--text-secondary)]">
                  Finished at {formatClock(t.finishedAt, settings.clockFormat)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </TVModal>
  );
}
