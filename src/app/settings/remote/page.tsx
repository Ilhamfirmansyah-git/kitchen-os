"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Keyboard } from "lucide-react";
import { Page, PageHeader, Section } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";
import { TVInput } from "@/components/tv/TVControls";
import { TVModal } from "@/components/tv/TVModal";
import { Focusable } from "@/components/tv/Focusable";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { useTVNavigation } from "@/components/tv/TVNavigationProvider";
import { cn } from "@/lib/cn";

interface KeyEntry {
  n: number;
  key: string;
  code: string;
  keyCode: number;
  action: string | null;
}

const EXPECTED = ["up", "down", "left", "right", "select", "back", "playPause"];

/** Remote Controls test screen: verifies every key and focus behaviour on a real TV. */
export default function RemoteTestPage() {
  const { goBack } = useTVNavigation();
  const [log, setLog] = useState<KeyEntry[]>([]);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [lit, setLit] = useState<number | null>(null);
  const [modal, setModal] = useState(false);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState(0);
  const [modalPick, setModalPick] = useState<string | null>(null);

  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<KeyEntry, "n">;
      n += 1;
      const entry = { ...d, n };
      setLog((l) => [entry, ...l].slice(0, 10));
      if (d.action) setSeen((s) => ({ ...s, [d.action!]: (s[d.action!] ?? 0) + 1 }));
    };
    window.addEventListener("kos:key", on);
    return () => window.removeEventListener("kos:key", on);
  }, []);

  return (
    <Page>
      <PageHeader
        title="Remote Controls Test"
        subtitle="Press every button on your remote. Each recognised key lights up below."
        actions={
          <TVButton icon={ArrowLeft} onSelect={goBack} focusKey="rt-back">
            Back
          </TVButton>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)_34rem] gap-12">
        <div>
          <div className="flex flex-wrap gap-3" aria-label="Recognised keys">
            {EXPECTED.map((a) => (
              <span
                key={a}
                className={cn(
                  "rounded-[0.75rem] px-5 py-3 text-[1.25rem] font-semibold",
                  seen[a] ? "bg-[var(--primary)] text-[#16201a]" : "bg-white/6 text-[var(--text-secondary)]",
                )}
              >
                {a === "playPause" ? "Play/Pause" : a[0].toUpperCase() + a.slice(1)} {seen[a] ? `✓ ${seen[a]}` : ""}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[1.125rem] text-[var(--text-secondary)]">
            Back is tested by the Back button on this screen&apos;s test dialog — pressing Back here leaves the screen.
          </p>

          <Section title="Spatial grid">
            <FocusGroup id="rt-grid" className="grid grid-cols-4 gap-4">
              {Array.from({ length: 12 }, (_, i) => (
                <Focusable
                  key={i}
                  autoFocus={i === 0}
                  focusKey={`rt-cell-${i}`}
                  onFocus={() => setLit(i)}
                  onSelect={() => setSelected(i + 1)}
                  className={cn("tv-row h-24 text-center text-[1.75rem] font-bold", lit === i && "text-[var(--primary)]")}
                >
                  {i + 1}
                </Focusable>
              ))}
            </FocusGroup>
            <p className="mt-4 text-[1.375rem]" role="status">
              {selected ? `OK pressed on tile ${selected}.` : "Move with the arrows and press OK on a tile."}
            </p>
          </Section>

          <Section title="Horizontal scrolling row">
            <FocusGroup id="rt-row" restore className="shelf">
              {Array.from({ length: 14 }, (_, i) => (
                <Focusable key={i} focusKey={`rt-row-${i}`} className="tv-row flex h-28 w-56 items-center justify-center text-[1.5rem] font-semibold">
                  Item {i + 1}
                </Focusable>
              ))}
            </FocusGroup>
          </Section>

          <Section title="Text input & dialog">
            <FocusGroup id="rt-misc" className="flex items-center gap-4">
              <div className="flex-1">
                <TVInput label="Test text input" value={text} onChange={setText} placeholder="Select to open the on-screen keyboard" focusKey="rt-input" />
              </div>
              <TVButton variant="primary" onSelect={() => setModal(true)} focusKey="rt-open-modal">
                Open test dialog
              </TVButton>
            </FocusGroup>
          </Section>
        </div>

        <aside className="self-start rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 font-display text-[1.5rem] font-bold">
            <Keyboard size={26} aria-hidden /> Last keys
          </div>
          <table className="mt-4 w-full text-left font-mono text-[1.0625rem]">
            <thead className="text-[var(--text-secondary)]">
              <tr>
                <th className="pb-2 font-normal">key</th>
                <th className="pb-2 font-normal">code</th>
                <th className="pb-2 font-normal">keyCode</th>
                <th className="pb-2 font-normal">action</th>
              </tr>
            </thead>
            <tbody>
              {log.map((k) => (
                <tr key={k.n} className="border-t border-[var(--border)]">
                  <td className="py-1.5">{k.key}</td>
                  <td className="py-1.5">{k.code || "—"}</td>
                  <td className="py-1.5">{k.keyCode}</td>
                  <td className={cn("py-1.5", k.action ? "text-[var(--primary)]" : "text-[var(--danger)]")}>{k.action ?? "unmapped"}</td>
                </tr>
              ))}
              {!log.length && (
                <tr>
                  <td colSpan={4} className="py-3 text-[var(--text-secondary)]">
                    Waiting for a key press…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </aside>
      </div>

      <TVModal
        open={modal}
        onClose={() => setModal(false)}
        title="Focus trap test"
        description={modalPick ? `You chose option ${modalPick}. Press Back to close.` : "Focus can't leave this dialog. Press Back (or Escape) to close it; focus returns to the button that opened it."}
        actions={
          <>
            <TVButton variant="primary" autoFocus onSelect={() => setModal(false)} focusKey="rt-m-close">
              Close
            </TVButton>
            <TVButton focusKey="rt-m-a" onSelect={() => setModalPick("A")}>Option A</TVButton>
            <TVButton focusKey="rt-m-b" onSelect={() => setModalPick("B")}>Option B</TVButton>
          </>
        }
      />
    </Page>
  );
}
