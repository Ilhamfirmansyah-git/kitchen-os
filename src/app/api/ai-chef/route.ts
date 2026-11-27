import { NextResponse } from "next/server";
import { systemPrompt } from "@/lib/ai/prompt";

/**
 * Server-side AI Chef endpoint. The API key lives only in server env vars
 * (ANTHROPIC_API_KEY) and is never sent to the browser.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_CHEF_MODEL || "claude-sonnet-5-5";
const MAX_MESSAGES = 16;
const MAX_CHARS = 2000;
const TIMEOUT_MS = 30_000;

// Small in-memory rate limiter (per server instance).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

export async function GET() {
  return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_API_KEY ? MODEL : null });
}

interface InMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured", message: "AI Chef has no API key configured." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited", message: "Too many questions at once. Wait a minute." }, { status: 429 });

  let body: { messages?: InMessage[]; preferences?: { measurement?: string; temperatureUnit?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid request." }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // The conversation sent to the model must start with the user.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_request", message: "Ask a question first." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system: systemPrompt({
          measurement: body.preferences?.measurement === "us" ? "us" : "metric",
          temperatureUnit: body.preferences?.temperatureUnit === "F" ? "F" : "C",
        }),
        messages,
      }),
    });
    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: "upstream", message: status === 429 ? "The AI service is busy. Try again shortly." : "The AI service returned an error." },
        { status },
      );
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n")
      .trim();
    if (!reply) return NextResponse.json({ error: "empty", message: "The AI returned an empty answer." }, { status: 502 });
    return NextResponse.json({ reply, model: MODEL });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "timeout" : "network", message: aborted ? "The AI took too long to answer." : "Could not reach the AI service." },
      { status: 504 },
    );
  } finally {
    clearTimeout(timer);
  }
}
