import { NextResponse } from "next/server";

export async function GET() {
  const tok = process.env.GITHUB_TOKEN;
  if (!tok) return NextResponse.json({ ok: false, error: "GITHUB_TOKEN missing" }, { status: 500 });
  try {
    const r = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tok}`, "User-Agent": "clearance" },
    });
    const j = await r.json();
    return NextResponse.json({ ok: r.ok, status: r.status, user: j.login, id: j.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
