import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.EXA_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "EXA_API_KEY missing" }, { status: 500 });
  try {
    const r = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ query: "MacBook Air M3 price median 2024", numResults: 2 }),
      // exa has 10s timeout
    });
    const j = await r.json();
    return NextResponse.json({ ok: r.ok, status: r.status, sample: j.results?.[0]?.title ?? j });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
