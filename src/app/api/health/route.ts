import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    exa: !!process.env.EXA_API_KEY,
    github: !!process.env.GITHUB_TOKEN,
    gmail: !!process.env.GMAIL_USER,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    db: !!process.env.DATABASE_URL || !!process.env.DATABASE_URL_SQLITE,
    trueforge: "npx @truefoundry/trueforge v0.1.4 available",
  };
  const wired = Object.entries(checks)
    .filter(([k]) => k !== "trueforge")
    .every(([, v]) => v === true);
  return NextResponse.json({
    ok: wired,
    service: "clearance",
    harness: "trueforge",
    checks,
    catalog: "catalog/mcp.yaml",
    skill: "skills/procurement-policy/SKILL.md",
  });
}
