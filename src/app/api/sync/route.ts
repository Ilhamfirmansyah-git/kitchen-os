import { NextResponse } from "next/server";

/**
 * Optional Supabase cloud backup. Disabled unless SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set on the server. The service key never
 * reaches the browser; the client only knows its random device code.
 *
 * Table (see README):
 *   create table kitchen_os_backups (
 *     device_id text primary key,
 *     data jsonb not null,
 *     updated_at timestamptz not null default now()
 *   );
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "kitchen_os_backups";
const MAX_BYTES = 512 * 1024;
const DEVICE_RE = /^[A-Z0-9]{8,32}$/;

const headers = () => ({
  apikey: KEY!,
  authorization: `Bearer ${KEY}`,
  "content-type": "application/json",
});

export async function GET(req: Request) {
  if (!URL_ || !KEY) return NextResponse.json({ configured: false });
  const device = new URL(req.url).searchParams.get("device");
  if (!device) return NextResponse.json({ configured: true });
  if (!DEVICE_RE.test(device)) return NextResponse.json({ error: "bad_device" }, { status: 400 });
  try {
    const res = await fetch(`${URL_}/rest/v1/${TABLE}?device_id=eq.${device}&select=data,updated_at`, { headers: headers(), cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const rows = (await res.json()) as { data: unknown; updated_at: string }[];
    if (!rows.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "network" }, { status: 504 });
  }
}

export async function POST(req: Request) {
  if (!URL_ || !KEY) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: { device?: string; data?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.device || !DEVICE_RE.test(body.device) || typeof body.data !== "object") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const res = await fetch(`${URL_}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(), prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ device_id: body.device, data: body.data, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 504 });
  }
}
