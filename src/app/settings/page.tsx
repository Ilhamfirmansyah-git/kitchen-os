"use client";

import { useEffect, useState } from "react";
import { BellRing, CloudDownload, CloudUpload, Gamepad2, Square, Trash2 } from "lucide-react";
import { Page, PageHeader, Section } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";
import { TVChoice, TVInput, TVStepper, TVToggle } from "@/components/tv/TVControls";
import { TVModal } from "@/components/tv/TVModal";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { deviceIdStore, updateSettings, useSettings } from "@/lib/storage/stores";
import { exportAllStores, importAllStores, resetAllStores, useStore } from "@/lib/storage/store";
import { isAlarmPlaying, startAlarm, stopAlarm } from "@/lib/audio/alarm";
import { RECIPES } from "@/data/recipes";
import { VIDEOS } from "@/data/videos";

const IS_DEV = process.env.NODE_ENV !== "production";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-10 border-b border-[var(--border)] py-6 last:border-0">
      <div>
        <div className="text-[1.5rem] font-semibold">{label}</div>
        {hint && <div className="mt-1 text-[1.125rem] text-[var(--text-secondary)]">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function makeDeviceCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  bytes.forEach((b) => (s += chars[b % chars.length]));
  return s;
}

export default function SettingsPage() {
  const s = useSettings();
  const deviceId = useStore(deviceIdStore);
  const [confirmReset, setConfirmReset] = useState(false);
  const [testing, setTesting] = useState(false);
  const [cloud, setCloud] = useState<"unknown" | "off" | "on">("unknown");
  const [cloudMsg, setCloudMsg] = useState("");
  const [restoreCode, setRestoreCode] = useState("");

  useEffect(() => {
    fetch("/api/sync", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d: { configured?: boolean }) => setCloud(d.configured ? "on" : "off"))
      .catch(() => setCloud("off"));
    return () => stopAlarm();
  }, []);

  const testAlarm = () => {
    if (isAlarmPlaying() || testing) {
      stopAlarm();
      setTesting(false);
    } else {
      startAlarm(s.alarmVolume);
      setTesting(true);
      window.setTimeout(() => {
        stopAlarm();
        setTesting(false);
      }, 4200);
    }
  };

  const backup = async () => {
    const code = deviceId || makeDeviceCode();
    if (!deviceId) deviceIdStore.set(code);
    setCloudMsg("Backing up…");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device: code, data: exportAllStores() }),
      });
      setCloudMsg(res.ok ? `Backed up. Restore code: ${code}` : "Backup failed. Try again later.");
    } catch {
      setCloudMsg("Backup failed — no connection.");
    }
  };

  const restore = async () => {
    const code = restoreCode.trim().toUpperCase();
    if (!code) return;
    setCloudMsg("Restoring…");
    try {
      const res = await fetch(`/api/sync?device=${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { data: Record<string, unknown> };
      importAllStores(d.data);
      deviceIdStore.set(code);
      setCloudMsg("Restored from the cloud backup.");
    } catch {
      setCloudMsg("No backup found for that code.");
    }
  };

  return (
    <Page>
      <PageHeader title="Settings" />

      <div className="grid grid-cols-[minmax(0,1fr)_32rem] gap-14">
        <div>
          <Section title="Display" className="mt-0">
            <FocusGroup id="set-display">
              <Row label="Theme" hint="Both are dark, low-glare themes for kitchens.">
                <TVChoice
                  label="Theme"
                  value={s.theme}
                  options={[
                    { value: "dark", label: "Warm dark" },
                    { value: "midnight", label: "Midnight" },
                  ]}
                  onChange={(theme) => updateSettings({ theme })}
                  focusKey="set-theme"
                />
              </Row>
              <Row label="Clock format">
                <TVChoice
                  label="Clock format"
                  value={s.clockFormat}
                  options={[
                    { value: "24h", label: "24-hour" },
                    { value: "12h", label: "12-hour" },
                  ]}
                  onChange={(clockFormat) => updateSettings({ clockFormat })}
                  focusKey="set-clock"
                />
              </Row>
              <Row label="Your name" hint="Used in the Home greeting.">
                <div className="w-[22rem]">
                  <TVInput label="Your name" value={s.userName} onChange={(userName) => updateSettings({ userName })} placeholder="Optional" focusKey="set-name" maxLength={30} />
                </div>
              </Row>
              <div className="py-4">
                <TVToggle label="Reduce motion" description="Turns off zoom and slide animations." checked={s.reduceMotion} onChange={(reduceMotion) => updateSettings({ reduceMotion })} focusKey="set-motion" />
              </div>
            </FocusGroup>
          </Section>

          <Section title="Units">
            <FocusGroup id="set-units">
              <Row label="Temperature">
                <TVChoice
                  label="Temperature"
                  value={s.temperatureUnit}
                  options={[
                    { value: "C", label: "Celsius °C" },
                    { value: "F", label: "Fahrenheit °F" },
                  ]}
                  onChange={(temperatureUnit) => updateSettings({ temperatureUnit })}
                  focusKey="set-temp"
                />
              </Row>
              <Row label="Measurements" hint="Spoons and pieces stay as written.">
                <TVChoice
                  label="Measurements"
                  value={s.measurement}
                  options={[
                    { value: "metric", label: "Metric (g, ml)" },
                    { value: "us", label: "US (oz, cups)" },
                  ]}
                  onChange={(measurement) => updateSettings({ measurement })}
                  focusKey="set-measure"
                />
              </Row>
            </FocusGroup>
          </Section>

          <Section title="Sound">
            <FocusGroup id="set-sound">
              <div className="py-4">
                <TVToggle label="Sound effects" description="A soft click when you press OK." checked={s.soundEffects} onChange={(soundEffects) => updateSettings({ soundEffects })} focusKey="set-sfx" />
              </div>
              <Row label="Timer alarm volume" hint="0 silences the alarm; the on-screen alert still appears.">
                <div className="flex items-center gap-4">
                  <TVStepper
                    label="alarm volume"
                    value={Math.round(s.alarmVolume * 100)}
                    min={0}
                    max={100}
                    step={10}
                    onChange={(v) => updateSettings({ alarmVolume: v / 100 })}
                    format={(v) => `${v}%`}
                    focusKey="set-volume"
                  />
                  <TVButton icon={testing ? Square : BellRing} onSelect={testAlarm} focusKey="set-test-alarm">
                    {testing ? "Stop" : "Test"}
                  </TVButton>
                </div>
              </Row>
            </FocusGroup>
          </Section>

          <Section title="Remote control">
            <FocusGroup id="set-remote" className="flex flex-col gap-4">
              <TVButton icon={Gamepad2} href="/settings/remote" size="lg" focusKey="set-remote-test" className="self-start">
                Open remote navigation test
              </TVButton>
              {IS_DEV && (
                <TVToggle
                  label="Navigation debug overlay (development only)"
                  description="Shows key codes and outlines the focused element."
                  checked={s.debugNavigation}
                  onChange={(debugNavigation) => updateSettings({ debugNavigation })}
                  focusKey="set-debug"
                />
              )}
            </FocusGroup>
          </Section>

          {cloud === "on" && (
            <Section title="Cloud backup (Supabase)">
              <FocusGroup id="set-cloud" className="flex flex-col gap-4">
                <p className="text-[1.25rem] text-[var(--text-secondary)]">
                  Optional. Saves favorites, history, timers and settings so you can restore them on another TV with a code.
                </p>
                <div className="flex gap-3">
                  <TVButton icon={CloudUpload} onSelect={backup} focusKey="set-backup">
                    Back up now
                  </TVButton>
                </div>
                <div className="flex gap-3">
                  <div className="w-[22rem]">
                    <TVInput label="Restore code" value={restoreCode} onChange={setRestoreCode} placeholder="Restore code" focusKey="set-restore-code" maxLength={32} />
                  </div>
                  <TVButton icon={CloudDownload} onSelect={restore} disabled={!restoreCode.trim()} focusKey="set-restore">
                    Restore
                  </TVButton>
                </div>
                {cloudMsg && <p className="text-[1.25rem]" role="status">{cloudMsg}</p>}
              </FocusGroup>
            </Section>
          )}

          <Section title="Data">
            <FocusGroup id="set-data">
              <Row label="Reset local data" hint="Deletes favorites, history, cooking progress, timers, AI chats and settings on this TV.">
                <TVButton variant="danger" icon={Trash2} onSelect={() => setConfirmReset(true)} focusKey="set-reset">
                  Reset…
                </TVButton>
              </Row>
            </FocusGroup>
          </Section>
        </div>

        <aside className="self-start rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-8">
          <h2 className="font-display text-[1.75rem] font-bold">About Kitchen OS</h2>
          <dl className="mt-5 space-y-3 text-[1.25rem]">
            <Info k="Version" v="1.0.0" />
            <Info k="Recipes" v={`${RECIPES.length} bundled, available offline`} />
            <Info k="Videos" v={`${VIDEOS.length} YouTube tutorials (online)`} />
            <Info k="Storage" v="On this device (localStorage)" />
            <Info k="Cloud backup" v={cloud === "on" ? "Configured" : cloud === "off" ? "Not configured" : "Checking…"} />
            <Info k="Build" v={IS_DEV ? "Development" : "Production"} />
          </dl>
          <p className="mt-6 text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
            Recipes are sample home-cooking recipes written for this app; they are not professionally tested, and nutrition values
            are only shown when sourced data exists. Timer alarms ring only while the app is open on screen.
          </p>
        </aside>
      </div>

      <TVModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all local data?"
        description="This permanently deletes favorites, history, unfinished cooking sessions, timers, AI conversations and settings on this TV. It can't be undone."
        tone="danger"
        size="sm"
        actions={
          <>
            <TVButton variant="primary" size="lg" autoFocus onSelect={() => setConfirmReset(false)} focusKey="reset-cancel">
              Cancel
            </TVButton>
            <TVButton
              variant="danger"
              size="lg"
              icon={Trash2}
              onSelect={() => {
                resetAllStores();
                setConfirmReset(false);
              }}
              focusKey="reset-confirm"
            >
              Delete everything
            </TVButton>
          </>
        }
      />
    </Page>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-[var(--text-secondary)]">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}
