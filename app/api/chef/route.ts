import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Kamu adalah Kirtos, asisten koki rumahan di Kitchen OS. Jawab dalam bahasa Indonesia yang jelas, ringkas, hangat, dan praktis. Utamakan langkah yang bisa dilakukan di dapur rumah. Jika pengguna meminta resep, berikan bahan, takaran, langkah, estimasi waktu yang masuk akal, dan tips. Jangan mengarang fakta nutrisi atau menjamin keamanan pangan jika tidak yakin. Untuk ayam, telur, ikan, dan daging, ingatkan agar dimasak matang. Jika informasi penting tidak ada, tanyakan satu hal yang paling relevan. Jangan mengklaim melihat stok atau kondisi dapur pengguna.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.KITCHEN_AI_API_KEY;
  const baseUrl = process.env.KITCHEN_AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.KITCHEN_AI_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json({ error: "AI belum dikonfigurasi. Tambahkan KITCHEN_AI_API_KEY dan KITCHEN_AI_MODEL pada environment server." }, { status: 503 });
  }
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Tulis pertanyaan terlebih dahulu." }, { status: 400 });
    if (message.length > 2000) return NextResponse.json({ error: "Pertanyaan terlalu panjang. Maksimal 2.000 karakter." }, { status: 400 });
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 700,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: message }]
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Kitchen AI provider error:", response.status, detail.slice(0, 500));
      return NextResponse.json({ error: response.status === 429 ? "Layanan AI sedang sibuk. Coba lagi sebentar." : "Layanan AI tidak dapat menjawab saat ini." }, { status: 502 });
    }
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "AI mengirim jawaban kosong. Coba pertanyaan lain." }, { status: 502 });
    }
    return NextResponse.json({ answer: answer.trim() });
  } catch (error) {
    console.error("Kitchen AI request failed:", error);
    return NextResponse.json({ error: "Permintaan gagal atau melewati batas waktu. Periksa koneksi lalu coba lagi." }, { status: 500 });
  }
}
