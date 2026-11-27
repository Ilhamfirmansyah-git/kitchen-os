"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, History, Plus, RotateCcw, Send, Sparkles, Trash2, TriangleAlert, User, WifiOff } from "lucide-react";
import type { ChatMessage, Conversation } from "@/types";
import { TVButton } from "@/components/tv/TVButton";
import { TVInput } from "@/components/tv/TVControls";
import { TVModal } from "@/components/tv/TVModal";
import { Focusable } from "@/components/tv/Focusable";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { conversationsStore, useConversations, useSettings } from "@/lib/storage/stores";
import { SUGGESTED_PROMPTS, findRecipeMentions } from "@/lib/ai/prompt";
import { demoReply } from "@/lib/ai/demo";
import { getRecipe } from "@/data/recipes";
import { useOnline } from "@/hooks/useOnline";
import { relativeTime } from "@/lib/format";
import { focusElement } from "@/lib/navigation/engine";
import { uid, cn, timestamp } from "@/lib/cn";
import { useNow } from "@/hooks/useNow";

type Mode = "checking" | "ai" | "demo";

const MAX_CONVERSATIONS = 15;

function saveConversation(c: Conversation) {
  conversationsStore.set((all) => [c, ...all.filter((x) => x.id !== c.id)].slice(0, MAX_CONVERSATIONS));
}

export function ChefChat() {
  const settings = useSettings();
  const online = useOnline();
  const conversations = useConversations();
  const [mode, setMode] = useState<Mode>("checking");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const now = useNow(60_000);
  const listRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  // Ask the server whether an AI key is configured. Static hosting / offline → demo.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-chef", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d: { configured?: boolean }) => !cancelled && setMode(d.configured ? "ai" : "demo"))
      .catch(() => !cancelled && setMode("demo"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const ask = async (text: string, retryOf?: Conversation) => {
    const question = text.trim();
    if (!question || loading) return;
    const now = timestamp();
    const base: Conversation =
      retryOf ??
      active ?? { id: uid("chat"), title: question.slice(0, 60), messages: [], updatedAt: now };
    const userMsg: ChatMessage = { id: uid("m"), role: "user", content: question, at: now };
    const withUser: Conversation = retryOf
      ? { ...base, updatedAt: now }
      : { ...base, messages: [...base.messages, userMsg], updatedAt: now };
    saveConversation(withUser);
    setActiveId(withUser.id);
    setDraft("");
    setLoading(true);

    let reply: ChatMessage;
    if (mode !== "ai") {
      // Small pause so the loading state is visible and the flow feels consistent.
      await new Promise((r) => setTimeout(r, 450));
      const d = demoReply(question);
      reply = { id: uid("m"), role: "assistant", content: d.text, at: timestamp(), source: "demo", recipeSlugs: d.recipeSlugs };
    } else if (!online) {
      reply = { id: uid("m"), role: "assistant", content: "You're offline. AI Chef needs an internet connection.", at: timestamp(), error: true };
    } else {
      try {
        const res = await fetch("/api/ai-chef", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: withUser.messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
            preferences: { measurement: settings.measurement, temperatureUnit: settings.temperatureUnit },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
        if (!res.ok || !data.reply) throw new Error(data.message || "AI Chef could not answer right now.");
        reply = { id: uid("m"), role: "assistant", content: data.reply, at: timestamp(), source: "ai", recipeSlugs: findRecipeMentions(data.reply) };
      } catch (e) {
        reply = { id: uid("m"), role: "assistant", content: e instanceof Error ? e.message : "Something went wrong.", at: timestamp(), error: true };
      }
    }
    const latest = conversationsStore.get().find((c) => c.id === withUser.id) ?? withUser;
    saveConversation({ ...latest, messages: [...latest.messages, reply], updatedAt: timestamp() });
    setLoading(false);
    window.setTimeout(() => focusElement(lastRef.current), 30);
  };

  const retry = () => {
    if (!active) return;
    const msgs = [...active.messages];
    if (msgs[msgs.length - 1]?.error) msgs.pop();
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const conv = { ...active, messages: msgs };
    saveConversation(conv);
    void ask(lastUser.content, conv);
  };

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="grid h-[calc(100vh-15rem)] grid-cols-[minmax(0,1fr)_30rem] gap-10">
      {/* Conversation */}
      <section className="flex min-h-0 flex-col rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-4 border-b border-[var(--border)] px-8 py-4">
          {mode === "demo" ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-1 text-[1.125rem] font-bold text-[#171a18]">
              DEMO MODE
            </span>
          ) : mode === "ai" ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-1 text-[1.125rem] font-bold text-[#16201a]">
              <Sparkles size={18} aria-hidden /> AI connected
            </span>
          ) : (
            <span className="text-[1.125rem] text-[var(--text-secondary)]">Checking AI service…</span>
          )}
          <span className="text-[1.125rem] text-[var(--text-secondary)]">
            {mode === "demo"
              ? "No AI key is configured. Answers are pre-written tips chosen by keyword — not generated by AI."
              : mode === "ai"
                ? "Answers are generated by an AI model and can be wrong. Check food-safety advice."
                : ""}
          </span>
          {!online && (
            <span className="ml-auto inline-flex items-center gap-2 text-[1.125rem] text-[var(--danger)]">
              <WifiOff size={20} aria-hidden /> Offline
            </span>
          )}
        </div>

        <div ref={listRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 && !loading ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot size={64} strokeWidth={1.5} className="text-[var(--primary)]" aria-hidden />
              <div className="mt-4 font-display text-[2.25rem] font-bold">What are we cooking?</div>
              <p className="mt-2 max-w-[40rem] text-[1.375rem] text-[var(--text-secondary)]">
                Pick a suggestion on the right with your remote, or type a question below.
              </p>
            </div>
          ) : (
            <FocusGroup id="chat-messages" className="flex flex-col gap-5">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <Focusable
                    key={m.id}
                    ref={isLast ? lastRef : undefined}
                    role="article"
                    focusKey={`msg-${m.id}`}
                    ariaLabel={`${m.role === "user" ? "You" : "AI Chef"}: ${m.content}`}
                    className={cn(
                      "tv-row flex max-w-[92%] gap-4 text-left",
                      m.role === "user" ? "self-end bg-[var(--surface-elevated)]!" : "self-start",
                      m.error && "border-[var(--danger)]!",
                    )}
                  >
                    <span className="mt-1 shrink-0 text-[var(--text-secondary)]" aria-hidden>
                      {m.error ? <TriangleAlert size={26} className="text-[var(--danger)]" /> : m.role === "user" ? <User size={26} /> : <Bot size={26} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block whitespace-pre-line text-[1.5rem] leading-relaxed">{m.content}</span>
                      {m.source === "demo" && (
                        <span className="mt-2 block text-[1rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          Demo answer · pre-written
                        </span>
                      )}
                    </span>
                  </Focusable>
                );
              })}
              {lastMsg?.role === "assistant" && (lastMsg.recipeSlugs?.length || lastMsg.error) ? (
                <div className="flex flex-wrap gap-3">
                  {lastMsg.recipeSlugs?.map((slug) => {
                    const r = getRecipe(slug);
                    return r ? (
                      <TVButton key={slug} href={`/recipes/${slug}`} focusKey={`chat-recipe-${slug}`}>
                        Open {r.name}
                      </TVButton>
                    ) : null;
                  })}
                  {lastMsg.error && (
                    <TVButton variant="primary" icon={RotateCcw} onSelect={retry} focusKey="chat-retry">
                      Try again
                    </TVButton>
                  )}
                </div>
              ) : null}
            </FocusGroup>
          )}
          {loading && (
            <div className="mt-5 inline-flex items-center gap-4 text-[1.5rem] text-[var(--text-secondary)]" role="status">
              <span className="h-7 w-7 rounded-full border-[3px] border-[var(--primary)] border-t-transparent animate-spin-slow" aria-hidden />
              {mode === "ai" ? "AI Chef is thinking…" : "Finding a demo answer…"}
            </div>
          )}
        </div>

        <FocusGroup id="chat-compose" className="flex gap-4 border-t border-[var(--border)] p-5">
          <TVInput
            label="Ask AI Chef"
            value={draft}
            onChange={setDraft}
            placeholder="Ask about recipes, substitutes, techniques…"
            onSubmit={() => ask(draft)}
            focusKey="chat-input"
            maxLength={500}
          />
          <TVButton variant="primary" icon={Send} disabled={!draft.trim() || loading} onSelect={() => ask(draft)} focusKey="chat-send" size="lg">
            Send
          </TVButton>
        </FocusGroup>
      </section>

      {/* Suggestions & history */}
      <aside className="flex min-h-0 flex-col">
        <div className="mb-4 text-[1.25rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Try asking</div>
        <FocusGroup id="chat-prompts" restore className="no-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto p-1">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <Focusable
              key={p}
              autoFocus={i === 0}
              focusKey={`prompt-${i}`}
              disabled={loading}
              onSelect={() => ask(p)}
              className="tv-row text-left text-[1.375rem] leading-snug"
            >
              {p}
            </Focusable>
          ))}
        </FocusGroup>
        <FocusGroup id="chat-actions" className="mt-6 flex gap-3">
          <TVButton icon={Plus} onSelect={() => setActiveId(null)} focusKey="chat-new">
            New chat
          </TVButton>
          <TVButton icon={History} onSelect={() => setHistoryOpen(true)} focusKey="chat-history" disabled={!conversations.length}>
            History
          </TVButton>
        </FocusGroup>
      </aside>

      <TVModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Conversation history"
        description="Saved on this TV only."
        size="lg"
        actions={
          <>
            <TVButton onSelect={() => setHistoryOpen(false)} focusKey="hist-close">
              Close
            </TVButton>
            <TVButton
              variant="danger"
              icon={Trash2}
              onSelect={() => {
                conversationsStore.set([]);
                setActiveId(null);
                setHistoryOpen(false);
              }}
              focusKey="hist-clear"
            >
              Clear all
            </TVButton>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {conversations.map((c, i) => (
            <Focusable
              key={c.id}
              autoFocus={i === 0}
              onSelect={() => {
                setActiveId(c.id);
                setHistoryOpen(false);
              }}
              className="tv-row flex items-center justify-between gap-6 text-left"
            >
              <span className="truncate text-[1.5rem] font-semibold">{c.title}</span>
              <span className="shrink-0 text-[1.125rem] text-[var(--text-secondary)]">
                {c.messages.length} messages · {relativeTime(c.updatedAt, now)}
              </span>
            </Focusable>
          ))}
        </div>
      </TVModal>
    </div>
  );
}
