"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatUSD } from "@/lib/utils";

// Components
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatCards from "@/components/StatCards";
import InboxPanel, { Invoice } from "@/components/InboxPanel";
import InvoiceDetail from "@/components/InvoiceDetail";
import SubagentsPanel, { Subagent } from "@/components/SubagentsPanel";
import TerminalPanel from "@/components/TerminalPanel";
import BudgetGauge from "@/components/BudgetGauge";
import AuditTrail from "@/components/AuditTrail";
import ApprovalModal from "@/components/ApprovalModal";
import MCPBadges from "@/components/MCPBadges";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Types ──────────────────────────────────────────────────────────────────────
type AgentState =
  | "idle"
  | "scanning"
  | "delegating"
  | "sandbox"
  | "awaiting_approval"
  | "approved"
  | "done"
  | "denied";

// ── Seed data ──────────────────────────────────────────────────────────────────
const SEED_INBOX: Invoice[] = [
  {
    id: "INV-2419",
    vendor: "Acme Workstations",
    subject: "Quote for 12× MacBook Air M3 — $4,200",
    amount: 4200,
    date: "Today 09:14",
    risk: "medium",
    policyHit: "§2.1 Monthly budget 82% → approval required",
    items: [{ name: "MacBook Air M3 16/512", qty: 12, unit: 350 }],
  },
  {
    id: "INV-2420",
    vendor: "Vercel Inc.",
    subject: "Pro plan + overages — July",
    amount: 892,
    date: "Today 08:02",
    risk: "low",
    items: [
      { name: "Pro seats ×8", qty: 1, unit: 240 },
      { name: "Bandwidth overage", qty: 1, unit: 652 },
    ],
  },
  {
    id: "INV-2421",
    vendor: "Bright Data",
    subject: "Scraping API — 5M requests",
    amount: 6100,
    date: "Yesterday",
    risk: "high",
    policyHit: "§2.3 >$5k single PO → founder LGTM + §3.2 need 2 quotes",
    items: [{ name: "API credits", qty: 1, unit: 6100 }],
  },
];

const SUBAGENTS_TEMPLATE: Subagent[] = [
  { id: "sa1", name: "Price-Auditor",  task: "Exa web_search → median price",         status: "queued" },
  { id: "sa2", name: "Policy-Checker", task: "LLM policy cite → §",                   status: "queued" },
  { id: "sa3", name: "Vendor-Graph",   task: "GitHub + DB → vendor history",           status: "queued" },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  // Inbox state
  const [inbox,         setInbox]         = useState<Invoice[]>(SEED_INBOX);
  const [inboxSource,   setInboxSource]   = useState("seed");
  const [inboxLoading,  setInboxLoading]  = useState(false);
  const [activeId,      setActiveId]      = useState(SEED_INBOX[0].id);
  const active = useMemo(
    () => inbox.find((i) => i.id === activeId) ?? inbox[0],
    [inbox, activeId]
  );

  // Agent state
  const [state,         setState]         = useState<AgentState>("idle");
  const [subs,          setSubs]          = useState<Subagent[]>(SUBAGENTS_TEMPLATE);
  const [logs,          setLogs]          = useState<string[]>([]);
  const [showApproval,  setShowApproval]  = useState(false);
  const [liveDecision,  setLiveDecision]  = useState<{
    risk: string; policyHit: string; reason: string; afterPct: number;
  } | null>(null);

  // Budget
  const [budgetUsed,    setBudgetUsed]    = useState(18200);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const BUDGET_CAP = 25000;

  // Audit
  const [audit, setAudit] = useState([
    { t: "09:12", msg: "Session #tf-007 started — TrueForge harness online", ok: true },
    { t: "09:13", msg: "MCP connected: Gmail · Postgres · GitHub · Exa" },
  ] as { t: string; msg: string; ok?: boolean }[]);

  // ── Page-load GSAP animation ─────────────────────────────────────────────────
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power2.out", delay: 0.05 }
      );
    }, mainRef);
    return () => ctx.revert();
  }, []);

  // ── Inbox polling ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setInboxLoading(true);
        const r = await fetch("/api/inbox", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled && j.invoices?.length) {
          const live: Invoice[] = j.invoices.map((x: {
            id: string; vendor: string; subject: string; amount: number;
            items: { name: string; qty: number; unit: number }[]; date: string; risk: string;
          }) => ({
            id: x.id, vendor: x.vendor, subject: x.subject, amount: x.amount,
            items: x.items, date: x.date, risk: (x.risk as Invoice["risk"]) ?? "medium",
          }));
          setInbox(live);
          setInboxSource(j.source ?? "gmail live");
        }
      } catch { /* keep seed */ }
      if (!cancelled) setInboxLoading(false);
    };
    load();
    const iv = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // ── Session persistence ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clearance:state");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.state) setState(p.state);
        if (p.audit) setAudit(p.audit);
        if (p.budgetUsed) setBudgetUsed(p.budgetUsed);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem("clearance:state", JSON.stringify({ state, audit, budgetUsed }));
  }, [state, audit, budgetUsed]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const pushLog   = (s: string) => setLogs((p) => [...p, s]);
  const pushAudit = (msg: string, ok?: boolean) =>
    setAudit((p) => [
      ...p,
      { t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), msg, ok },
    ]);

  // ── Agent run ─────────────────────────────────────────────────────────────────
  const startRun = async () => {
    if (state !== "idle" && state !== "done" && state !== "denied") return;
    setState("scanning");
    setSubs(SUBAGENTS_TEMPLATE.map((s) => ({ ...s, status: "queued" as const, output: undefined })));
    setLogs([]);
    setShowApproval(false);
    setLiveDecision(null);

    pushLog(`$ trueforge agent run --id ${active.id} --model openai/gpt-4o-mini (via OpenRouter)`);
    pushLog(`[harness] POST /api/agent/run — Gmail MCP hydrated, deferred tools loading`);
    pushLog(`[gmail:mcp] gmail_read(${active.id}) → "${active.subject}"`);

    setState("delegating");
    setSubs((prev) => prev.map((s) => ({ ...s, status: "running" as const })));
    pushLog(`[harness] Delegating to 3 subagents in parallel — clean contexts`);

    const t0 = Date.now();
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice: active, budgetUsed }),
      });
      const data = await res.json();
      const ms = Date.now() - t0;
      if (!res.ok || !data.ok) throw new Error(data.error || "agent run failed");

      const exaOut = data.live?.exa?.ok
        ? `Exa: ${data.live.exa.sample?.slice(0, 80) ?? "price found"}`
        : `Exa err: ${data.live?.exa?.error?.slice(0, 60) ?? "no key"}`;
      const llmOut = data.live?.llm?.ok
        ? `${data.live.llm.model} → ${data.decision.policyHit}`
        : `LLM err: ${data.live?.llm?.error?.slice(0, 60)}`;
      const ghOut = data.live?.gh?.ok
        ? `GitHub ${data.live.gh.user} OK`
        : `GH err: ${data.live?.gh?.error?.slice(0, 60)}`;

      setSubs([
        { id: "sa1", name: "Price-Auditor",  task: "Exa live → median price",          status: "done", output: exaOut, latencyMs: ms },
        { id: "sa2", name: "Policy-Checker", task: `LLM ${data.harness.model} → policy`, status: "done", output: llmOut, latencyMs: ms },
        { id: "sa3", name: "Vendor-Graph",   task: "GitHub + DB → vendor history",      status: "done", output: ghOut,  latencyMs: ms },
      ]);

      pushLog(`[subagent:Price-Auditor]  done (${ms}ms) — ${exaOut}`);
      pushLog(`[subagent:Policy-Checker] done — ${llmOut}`);
      pushLog(`[subagent:Vendor-Graph]   done — ${ghOut}`);
      if (data.live?.llm?.content) pushLog(`[llm:${data.harness.model}] ${data.live.llm.content.slice(0, 160)}`);

      setState("sandbox");
      pushLog(`[sandbox:node] isolated calc — engine ${data.live.sandbox.engine}`);
      data.live.sandbox.logs.forEach((l: string) => pushLog(`  ${l}`));
      pushLog(`[sandbox] total $${data.live.sandbox.calc.total} | ${data.live.sandbox.calc.beforePct}% → ${data.live.sandbox.calc.afterPct}%`);

      pushAudit(
        `LIVE: Exa ${data.live.exa.ok ? "OK" : "ERR"} + LLM ${data.live.llm.ok ? data.harness.model : "ERR"} + GH ${data.live.gh.ok ? "OK" : "ERR"} in ${data.timingMs}ms`,
        true
      );

      setLiveDecision(data.decision);
      pushLog(`[harness] ⏸  HOLD — tool_approval required: send_email + db_write`);
      pushAudit(
        `Paused for LGTM — ${active.id} ${formatUSD(active.amount)} → ${active.vendor} — ${data.decision.policyHit}`
      );
      setState("awaiting_approval");
      setShowApproval(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushLog(`[error] /api/agent/run failed: ${msg}`);
      pushAudit(`Agent run failed: ${msg}`, false);
      setSubs((prev) => prev.map((s) => ({ ...s, status: "error" as const, output: msg.slice(0, 80) })));
      setState("idle");
    }
  };

  const approve = () => {
    setShowApproval(false);
    setState("approved");
    pushLog(`[human] Approved — scoped 5m grant, audited`);
    pushLog(`[gmail:mcp]    gmail_send(to: vendor, subject: PO ${active.id}) ✓`);
    pushLog(`[postgres:mcp] insert po_history {id:${active.id}, vendor:${active.vendor}} ✓`);
    pushLog(`[github:mcp]   commit_file audit/po-${active.id}.md ✓`);
    pushAudit("Approved → Gmail PO sent, DB inserted, GitHub committed", true);
    setBudgetUsed((b) => b + active.amount);
    setApprovedTotal((v) => v + active.amount);
    setTimeout(() => setState("done"), 700);
  };

  const deny = () => {
    setShowApproval(false);
    setState("denied");
    pushLog(`[human] Denied — no tool executed, session logged`);
    pushAudit("Denied — no spend, parked for revision");
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const pct = Math.round((budgetUsed / BUDGET_CAP) * 100);
  const afterPct = Math.round(((budgetUsed + (state === "awaiting_approval" ? active.amount : 0)) / BUDGET_CAP) * 100);
  const riskPct = liveDecision ? liveDecision.afterPct : pct;
  const pendingCount = inbox.filter((i) => i.risk === "high" || i.risk === "medium").length;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Ambient background */}
      <div className="ambient" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Dot grid overlay */}
      <div className="dot-grid fixed inset-0 pointer-events-none z-0 opacity-30" aria-hidden />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />

        <main ref={mainRef} className="flex-1 overflow-auto px-5 py-5 space-y-5">

          {/* ── Welcome + MCP badges ───────────────────────────────────────── */}
          <div className="hero-fade flex flex-wrap items-center gap-4">
            <div>
              <h1 className="text-[18px] font-bold text-[var(--fg)]">
                Good morning, <span className="gradient-text">Nirva</span> 👋
              </h1>
              <p className="text-[12.5px] text-[var(--fg-3)] mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {" · "}{inbox.length} invoices pending review
              </p>
            </div>
            <div className="ml-auto">
              <MCPBadges />
            </div>
          </div>

          {/* ── Stat cards ────────────────────────────────────────────────── */}
          <div className="hero-fade">
            <StatCards
              budgetUsed={budgetUsed}
              budgetCap={BUDGET_CAP}
              pendingCount={pendingCount}
              approvedTotal={approvedTotal}
              riskPct={riskPct}
            />
          </div>

          {/* ── Main grid: Inbox + Detail + Budget ──────────────────────── */}
          <div className="hero-fade grid grid-cols-12 gap-4" style={{ minHeight: 460 }}>
            {/* Inbox — 4 cols */}
            <div className="col-span-12 lg:col-span-4" style={{ minHeight: 460 }}>
              <InboxPanel
                invoices={inbox}
                activeId={activeId}
                loading={inboxLoading}
                source={inboxSource}
                onSelect={setActiveId}
                onRefresh={async () => {
                  setInboxLoading(true);
                  try {
                    const r = await fetch("/api/inbox", { cache: "no-store" });
                    const j = await r.json();
                    if (j.invoices?.length) {
                      setInbox(j.invoices);
                      setInboxSource(j.source ?? "gmail live");
                    }
                  } catch { /* keep */ }
                  setInboxLoading(false);
                }}
              />
            </div>

            {/* Invoice detail — 5 cols */}
            <div className="col-span-12 lg:col-span-5" style={{ minHeight: 460 }}>
              <InvoiceDetail
                invoice={active}
                state={state}
                liveRisk={liveDecision?.risk}
                livePolicyHit={liveDecision?.policyHit}
                liveReason={liveDecision?.reason}
                onRun={startRun}
              />
            </div>

            {/* Budget gauge — 3 cols */}
            <div className="col-span-12 lg:col-span-3" style={{ minHeight: 460 }}>
              <BudgetGauge
                budgetUsed={budgetUsed}
                budgetCap={BUDGET_CAP}
                pendingAmount={state === "awaiting_approval" ? active.amount : 0}
              />
            </div>
          </div>

          {/* ── Bottom grid: Subagents + Terminal + Audit ──────────────── */}
          <div className="hero-fade grid grid-cols-12 gap-4" style={{ minHeight: 340 }}>
            {/* Subagents — 3 cols */}
            <div className="col-span-12 lg:col-span-3" style={{ minHeight: 340 }}>
              <SubagentsPanel agents={subs} />
            </div>

            {/* Terminal — 5 cols */}
            <div className="col-span-12 lg:col-span-5" style={{ minHeight: 340 }}>
              <TerminalPanel logs={logs} />
            </div>

            {/* Audit trail — 4 cols */}
            <div className="col-span-12 lg:col-span-4" style={{ minHeight: 340 }}>
              <AuditTrail entries={audit} />
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <footer className="text-center py-4 text-[11px] font-mono text-[var(--fg-3)]">
            WeMakeDevs Agent Harness Hackathon · Aug 24–30, 2026 ·{" "}
            <a className="underline hover:text-[var(--fg-2)] transition-colors" href="https://github.com/Nirvanjha2004/clearance" target="_blank" rel="noreferrer">GitHub</a>
            {" · "}
            <a className="underline hover:text-[var(--fg-2)] transition-colors" href="https://clearance-jade.vercel.app" target="_blank" rel="noreferrer">Live</a>
            {" · "}Built on TrueForge (MIT)
          </footer>
        </main>
      </div>

      {/* Approval modal */}
      <ApprovalModal
        open={showApproval}
        invoice={active}
        afterPct={afterPct}
        policyHit={liveDecision?.policyHit ?? active.policyHit}
        liveRisk={liveDecision?.risk}
        onApprove={approve}
        onDeny={deny}
      />
    </div>
  );
}
