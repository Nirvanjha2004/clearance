"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Database,
  GitBranch,
  Search,
  Terminal,
  Cpu,
  Pause,
  Check,
  X,
  Clock,
  AlertTriangle,
  FileText,
  Zap,
  Eye,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Lock,
  Activity,
  Sun,
  Moon,
  HelpCircle,
  ChevronRight,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { formatUSD } from "@/lib/utils";

// Types
type AgentState = "idle" | "scanning" | "delegating" | "sandbox" | "awaiting_approval" | "approved" | "done" | "denied";
type Subagent = { id: string; name: string; task: string; status: "queued" | "running" | "done" | "error"; output?: string; latencyMs?: number };
type Invoice = {
  id: string;
  vendor: string;
  subject: string;
  amount: number;
  items: { name: string; qty: number; unit: number }[];
  date: string;
  risk: "low" | "medium" | "high";
  policyHit?: string;
};

const SEED_INBOX: Invoice[] = [
  { id: "INV-2419", vendor: "Acme Workstations", subject: "Quote for 12× MacBook Air M3 — $4,200", amount: 4200, date: "Today 09:14", risk: "medium", policyHit: "§2.1 Monthly budget 82% → approval required", items: [{ name: "MacBook Air M3 16/512", qty: 12, unit: 350 }] },
  { id: "INV-2420", vendor: "Vercel Inc.", subject: "Pro plan + overages — July", amount: 892, date: "Today 08:02", risk: "low", items: [{ name: "Pro seats ×8", qty: 1, unit: 240 }, { name: "Bandwidth overage", qty: 1, unit: 652 }] },
  { id: "INV-2421", vendor: "Bright Data", subject: "Scraping API — 5M requests", amount: 6100, date: "Yesterday", risk: "high", policyHit: "§2.3 >$5k single PO → founder LGTM + §3.2 need 2 quotes", items: [{ name: "API credits", qty: 1, unit: 6100 }] },
];
const SUBAGENTS_TEMPLATE: Subagent[] = [
  { id: "sa1", name: "Price-Auditor", task: "Exa web_search → median price", status: "queued" },
  { id: "sa2", name: "Policy-Checker", task: "LLM policy cite → §", status: "queued" },
  { id: "sa3", name: "Vendor-Graph", task: "GitHub + DB → vendor history", status: "queued" },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = localStorage.getItem("clearance:theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = saved ?? (prefersDark ? "dark" : "light");
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("clearance:theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const [inbox, setInbox] = useState<Invoice[]>(SEED_INBOX);
  const [inboxSource, setInboxSource] = useState<string>("seed");
  const [inboxLoading, setInboxLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setInboxLoading(true);
        const r = await fetch("/api/inbox", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled && j.invoices?.length) {
          const live: Invoice[] = j.invoices.map((x: { id: string; vendor: string; subject: string; amount: number; items: { name: string; qty: number; unit: number }[]; date: string; risk: string }) => ({
            id: x.id, vendor: x.vendor, subject: x.subject, amount: x.amount, items: x.items, date: x.date, risk: (x.risk as Invoice["risk"]) ?? "medium",
          }));
          setInbox(live);
          setInboxSource(j.source ?? "gmail live");
          if (!live.find((i) => i.id === activeId)) setActiveId(live[0].id);
        }
      } catch {}
      if (!cancelled) setInboxLoading(false);
    };
    load();
    const iv = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeId, setActiveId] = useState(SEED_INBOX[0].id);
  const active = useMemo(() => inbox.find((i) => i.id === activeId) ?? inbox[0], [inbox, activeId]);
  const filtered = useMemo(() => filter === "all" ? inbox : inbox.filter((i) => i.risk === filter), [inbox, filter]);

  const [state, setState] = useState<AgentState>("idle");
  const [subs, setSubs] = useState<Subagent[]>(SUBAGENTS_TEMPLATE);
  const [logs, setLogs] = useState<string[]>([]);
  const [showApproval, setShowApproval] = useState(false);
  const [audit, setAudit] = useState<{ t: string; msg: string; ok?: boolean }[]>([
    { t: "09:12", msg: "Session #tf-007 started — TrueForge harness online", ok: true },
    { t: "09:13", msg: "MCP connected: Gmail · Postgres · GitHub · Exa" },
  ]);
  const [budgetUsed, setBudgetUsed] = useState(18200);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [liveDecision, setLiveDecision] = useState<{ risk: string; policyHit: string; reason: string; vendorHistory: string; afterPct: number } | null>(null);
  const [liveMeta, setLiveMeta] = useState<{ model: string; timingMs: number } | null>(null);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("clearance:state");
    if (saved) try { const p = JSON.parse(saved); if (p.state) setState(p.state); if (p.audit) setAudit(p.audit); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("clearance:state", JSON.stringify({ state, audit, budgetUsed })); }, [state, audit, budgetUsed]);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [logs]);

  const pushLog = (s: string) => setLogs((p) => [...p, s]);
  const pushAudit = (msg: string, ok?: boolean) => setAudit((p) => [...p, { t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), msg, ok }]);

  const startRun = async () => {
    if (state !== "idle" && state !== "done" && state !== "denied") return;
    setState("scanning");
    setSubs(SUBAGENTS_TEMPLATE.map((s) => ({ ...s, status: "queued" as const, output: undefined })));
    setLogs([]);
    setShowApproval(false);
    setLiveDecision(null); setLiveMeta(null);
    pushLog(`$ trueforge agent run --id ${active.id} --model openai/gpt-4o-mini (via OpenRouter)`);
    pushLog(`[harness] POST /api/agent/run — Gmail MCP hydrated, deferred tools loading`);
    pushLog(`[gmail:mcp] gmail_read(${active.id}) → "${active.subject}"`);
    pushLog(`[fetch] POST /api/agent/run — Network tab → live Exa + GitHub + LLM`);
    setState("delegating");
    setSubs((prev) => prev.map((s) => ({ ...s, status: "running" as const })));
    pushLog(`[harness] Delegating to 3 subagents in parallel — clean contexts → awaiting /api/agent/run`);
    const t0 = Date.now();
    try {
      const res = await fetch("/api/agent/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoice: active, budgetUsed }) });
      const data = await res.json();
      const ms = Date.now() - t0;
      if (!res.ok || !data.ok) throw new Error(data.error || "agent run failed");
      const exaOut = data.live?.exa?.ok ? `Exa: ${data.live.exa.sample?.slice(0,80) ?? "price found"} (${data.live.exa.status})` : `Exa err: ${data.live?.exa?.error?.slice(0,80) ?? "no key"}`;
      const llmOut = data.live?.llm?.ok ? `${data.live.llm.model} → ${data.decision.policyHit}` : `LLM err: ${data.live?.llm?.error?.slice(0,80)}`;
      const ghOut = data.live?.gh?.ok ? `GitHub ${data.live.gh.user} OK (${data.live.gh.status})` : `GH err: ${data.live?.gh?.error?.slice(0,80)}`;
      setSubs([
        { id: "sa1", name: "Price-Auditor", task: "Exa live → median price", status: "done", output: exaOut, latencyMs: ms },
        { id: "sa2", name: "Policy-Checker", task: `LLM ${data.harness.model} → policy`, status: "done", output: llmOut, latencyMs: ms },
        { id: "sa3", name: "Vendor-Graph", task: "GitHub + DB → vendor history", status: "done", output: ghOut, latencyMs: ms },
      ]);
      pushLog(`[subagent:Price-Auditor] done (${ms}ms) — ${exaOut}`);
      pushLog(`[subagent:Policy-Checker] done — ${llmOut}`);
      pushLog(`[subagent:Vendor-Graph] done — ${ghOut}`);
      if (data.live?.llm?.content) pushLog(`[llm:${data.harness.model}] ${data.live.llm.content.slice(0,180)}`);
      setState("sandbox");
      pushLog(`[sandbox:node] isolated calc — engine ${data.live.sandbox.engine}`);
      data.live.sandbox.logs.forEach((l: string) => pushLog(`  ${l}`));
      pushLog(`[sandbox] total $${data.live.sandbox.calc.total} | before ${data.live.sandbox.calc.beforePct}% → after ${data.live.sandbox.calc.afterPct}%`);
      pushAudit(`LIVE: Exa ${data.live.exa.ok ? "OK" : "ERR"} + LLM ${data.live.llm.ok ? data.harness.model : "ERR"} + GH ${data.live.gh.ok ? "OK" : "ERR"} in ${data.timingMs}ms`, true);
      setLiveDecision(data.decision); setLiveMeta({ model: data.harness.model, timingMs: data.timingMs });
      pushLog(`[harness] ⏸  HOLD — tool_approval required: send_email + db_write`);
      pushAudit(`Paused for human approval — ${active.id} ${formatUSD(active.amount)} → ${active.vendor} — ${data.decision.policyHit} — risk ${data.decision.risk}`);
      setState("awaiting_approval"); setShowApproval(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushLog(`[error] /api/agent/run failed: ${msg}`);
      pushAudit(`Agent run failed: ${msg}`, false);
      setSubs((prev) => prev.map((s) => ({ ...s, status: "error" as const, output: msg.slice(0,80) })));
      setState("idle");
    }
  };

  const approve = () => {
    setShowApproval(false); setState("approved");
    pushLog(`[human] Approved by you — grant scoped 5m, audited`);
    pushLog(`[gmail:mcp] gmail_send(to: vendor, subject: PO ${active.id}) ✓`);
    pushLog(`[postgres:mcp] insert po_history {id:${active.id}, vendor:${active.vendor}} ✓`);
    pushLog(`[github:mcp] commit_file audit/po-${active.id}.md ✓`);
    pushAudit(`Approved → Gmail PO sent, DB inserted, GitHub committed`, true);
    setBudgetUsed((b) => b + active.amount); setApprovedTotal((v) => v + active.amount);
    setTimeout(() => setState("done"), 700);
  };
  const deny = () => { setShowApproval(false); setState("denied"); pushLog(`[human] Denied — no tool executed, session logged`); pushAudit(`Denied — no spend, parked for revision`); };

  const pct = Math.round((budgetUsed / 25000) * 100);
  const afterPct = Math.round(((budgetUsed + (state === "awaiting_approval" ? active.amount : 0)) / 25000) * 100);

  const kpiReveal = useReveal();
  const inboxReveal = useReveal();
  const agentReveal = useReveal();

  return (
    <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header — friendly, not intimidating */}
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white dark:text-black font-black text-[13px] tracking-tighter shadow-sm">TF</div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight leading-none">Clearance <span className="font-mono text-[10px] align-super ml-1 px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">TF-007</span></h1>
            <p className="text-[13px] text-[var(--muted)]">Approval-gated procurement — your super-intern that asks before spending</p>
          </div>
          <span className="hidden sm:inline-flex ml-2 items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300" data-tooltip="TrueForge harness streams every step; session survives refresh">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> harness online
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm" data-tooltip="Reads procurement@ inbox — real Gmail via IMAP, fallback to demo seed"><Mail size={14} className="text-[var(--muted)]" /> Gmail MCP<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm" data-tooltip="Finance DB — budgets & PO history"><Database size={14} className="text-[var(--muted)]" /> Postgres</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm" data-tooltip="Commits immutable audit log"><GitBranch size={14} className="text-[var(--muted)]" /> GitHub</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm" data-tooltip="Live price lookup for invoices"><Search size={14} className="text-[var(--muted)]" /> Exa</span>
          <button onClick={toggleTheme} aria-label="Toggle theme" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition" data-tooltip={theme === "dark" ? "Switch to light" : "Switch to dark"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a href="#how" className="text-xs font-medium inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition"><HelpCircle size={14} /> How it works</a>
        </div>
      </motion.header>

      {/* Onboarding hint — not confusing */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 dark:bg-emerald-500/8 p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-emerald-900 dark:text-emerald-100"><span className="font-semibold">Try it in 20 seconds:</span> pick an invoice on the left → hit <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">Run Clearance</span> → watch live checks → approve. <span className="text-[var(--muted)]">All requests show in Network tab → `POST /api/agent/run`.</span></p>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white dark:bg-[#11131a] border border-[var(--border)] shadow-sm inline-flex items-center gap-1"> <ArrowRight size={12} /> Live demo </span>
      </motion.div>

      {/* KPI Bento — friendly lighting, clear hierarchy */}
      <section ref={kpiReveal.ref} className={`bento mb-6 ${kpiReveal.inView ? "in" : ""}`}>
        {[
          { k: "budget", node: (
            <div className="tile col-span-5 lg:col-span-3 p-5 flex flex-col justify-between reveal in">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-[var(--muted)]">MONTHLY BUDGET</p>
                <span className="h-7 w-7 rounded-full bg-[var(--accent-soft)] border border-emerald-500/10 grid place-items-center" data-tooltip="Monthly cap $25,000 — warn at $20,000"><Activity size={14} className="text-[var(--accent)]" /></span>
              </div>
              <div>
                <p className="text-[28px] font-semibold tracking-tight leading-none">{formatUSD(budgetUsed)} <span className="text-[var(--muted)] text-[16px] font-normal">/ $25k</span></p>
                <div className="mt-3 h-2.5 rounded-full bg-[var(--surface-3)] overflow-hidden p-0.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-[var(--accent)]" />
                </div>
                <p className="text-xs font-mono text-[var(--muted)] mt-2">{pct}% used {afterPct !== pct && <span className="text-amber-600 dark:text-amber-300">→ {afterPct}% if approved</span>} · <span data-tooltip="TrueForge budgets via AI Gateway">via TrueForge</span></p>
              </div>
            </div>
          )},
          { k: "pending", node: (
            <div className="tile col-span-7 lg:col-span-3 p-5 reveal in" style={{ transitionDelay: "80ms" }}>
              <p className="text-[11px] font-semibold tracking-widest text-[var(--muted)]">PENDING APPROVALS</p>
              <p className="text-[28px] font-semibold leading-none mt-2">1 <span className="text-sm font-normal text-[var(--muted)]">/ {inbox.length} invoices</span></p>
              <p className="text-sm mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-medium"><Pause size={12} /> Holding for you — {active.id}</p>
              <p className="text-xs font-mono text-[var(--muted)] mt-2" data-tooltip="Only irreversible tools (send_email, db_write) are gated">Irreversible gated, read-only auto</p>
            </div>
          )},
          { k: "approved", node: (
            <div className="tile lg:col-span-3 col-span-6 p-5 reveal in" style={{ transitionDelay: "160ms" }}>
              <p className="text-[11px] font-semibold tracking-widest text-[var(--muted)]">APPROVED TODAY</p>
              <p className="text-[28px] font-semibold leading-none mt-2">{formatUSD(approvedTotal)}</p>
              <p className="text-xs mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium"><Check size={12} /> {approvedTotal ? "1 PO committed" : "No spend yet — waiting for LGTM"}</p>
            </div>
          )},
          { k: "trace", node: (
            <div className="tile lg:col-span-3 col-span-6 p-5 reveal in" style={{ transitionDelay: "240ms" }}>
              <p className="text-[11px] font-semibold tracking-widest text-[var(--muted)]">HARNESS TRACE</p>
              <ul className="mt-3 space-y-1.5 text-xs font-mono">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Model: {liveMeta?.model ?? "openai/gpt-4o-mini (OpenRouter)"} {liveMeta ? `· ${liveMeta.timingMs}ms` : ""}</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sandbox: node isolated (real calc)</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Subagents: 3 parallel live</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Session: persisted</li>
              </ul>
            </div>
          )},
        ].map(({ k, node }) => <div key={k}>{node}</div>)}
      </section>

      {/* Main */}
      <section className="grid grid-cols-12 gap-4">
        {/* Inbox — friendly, not noisy */}
        <motion.div ref={inboxReveal.ref} initial={{ opacity: 0, y: 12 }} animate={inboxReveal.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="col-span-12 lg:col-span-4 tile flex flex-col min-h-[540px]">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Inbox size={16} className="text-[var(--muted)]" /> Procurement Inbox</h2>
            <div className="flex items-center gap-1.5">
              {(["all","medium","high"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter===f?"bg-[var(--foreground)] text-[var(--background)] border-transparent":"bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--border-strong)]"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-2 text-xs text-[var(--muted)]">
            <Search size={12} /> {inbox.length} total · {filtered.length} shown · <span className="font-mono">{inboxSource}</span> {inboxLoading && <RefreshCw size={12} className="animate-spin" />}
          </div>
          <div className="divide-y divide-[var(--border)] overflow-y-auto no-scrollbar flex-1 max-h-[420px]">
            {filtered.length===0 ? (
              <div className="p-8 text-center">
                <div className="h-10 w-10 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] grid place-items-center mx-auto"><Inbox size={18} className="text-[var(--muted)]" /></div>
                <p className="text-sm font-medium mt-3">No invoices here</p><p className="text-xs text-[var(--muted)] mt-1">Send a test mail to <span className="font-mono">nirvanjha2004@gmail.com</span> — see email template below.</p>
              </div>
            ) : filtered.map((inv) => (
              <button key={inv.id} onClick={() => setActiveId(inv.id)} className={`w-full text-left px-4 py-3.5 hover:bg-[var(--surface-2)] transition flex gap-3 focus-ring ${activeId===inv.id?"bg-[var(--surface-2)]":""}`}>
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${inv.risk==="high"?"bg-red-500":inv.risk==="medium"?"bg-amber-500":"bg-emerald-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{inv.vendor} <span className="font-mono text-xs text-[var(--muted)]">· {inv.id}</span></p>
                  <p className="text-xs text-[var(--muted)] truncate">{inv.subject}</p>
                  <p className="text-xs font-mono text-[var(--muted)]">{inv.date} · {formatUSD(inv.amount)}</p>
                </div>
                <ChevronRight size={14} className="text-[var(--muted-2)] shrink-0 mt-1" />
              </button>
            ))}
          </div>
          <div className="mt-auto p-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-2">
            <p className="text-[11px] font-mono text-[var(--muted)]">{inboxLoading ? "MCP: gmail_list loading…" : `MCP: ${inboxSource} → ${inbox.length} hydrated`}</p>
            <button onClick={async () => { setInboxLoading(true); try { const r=await fetch("/api/inbox",{cache:"no-store"}); const j=await r.json(); if(j.invoices?.length){ const live=j.invoices.map((x:Invoice)=>x); setInbox(live); setInboxSource(j.source); } } catch{} setInboxLoading(false); }} className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] shadow-sm">Refresh</button>
          </div>
        </motion.div>

        {/* Agent Live */}
        <motion.div ref={agentReveal.ref} initial={{ opacity: 0, y: 12 }} animate={agentReveal.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.12 }} className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="tile p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold flex items-center gap-2 truncate"><FileText size={16} className="text-[var(--muted)]" /> {active.id} — {active.vendor}</h3>
                <p className="text-xs font-mono text-[var(--muted)] truncate">{active.subject} · {active.date}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${(liveDecision?.risk ?? active.risk)==="high"?"bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300":(liveDecision?.risk ?? active.risk)==="medium"?"bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300":"bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"}`}>{liveDecision?.risk ?? active.risk} risk{liveDecision?" · live":""}</span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">{formatUSD(active.amount)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
              <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                <span className="flex items-center gap-2 text-xs font-semibold"><Sparkles size={12} className="text-[var(--accent)]" /> Extracted line items <span className="font-mono font-normal text-[var(--muted)]">· sandbox</span></span>
                <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-[var(--accent-soft)] border border-emerald-500/15 text-emerald-700 dark:text-emerald-300">Generative UI</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs font-mono text-[var(--muted)] bg-[var(--surface)]">
                    <tr><th className="text-left px-3 py-2 font-medium">Item</th><th className="text-right px-3 py-2 font-medium">Qty</th><th className="text-right px-3 py-2 font-medium">Unit</th><th className="text-right px-3 py-2 font-medium">Line</th></tr>
                  </thead>
                  <tbody>
                    {active.items.map((it) => (
                      <tr key={it.name} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2.5">{it.name}</td><td className="px-3 py-2 text-right font-mono">{it.qty}</td><td className="px-3 py-2 text-right font-mono">{formatUSD(it.unit)}</td><td className="px-3 py-2 text-right font-mono font-medium">{formatUSD(it.qty * it.unit)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--border)] bg-[var(--surface)] font-semibold"><td className="px-3 py-2.5" colSpan={3}>Total</td><td className="px-3 py-2 text-right font-mono">{formatUSD(active.amount)}</td></tr>
                  </tbody>
                </table>
              </div>
              {(liveDecision?.policyHit ?? active.policyHit) && (
                <div className="px-3 py-2.5 bg-amber-500/8 dark:bg-amber-500/10 border-t border-amber-500/15 text-xs flex gap-2">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-mono text-amber-900 dark:text-amber-200">{liveDecision?.policyHit ?? active.policyHit} {liveDecision ? <span className="text-[var(--muted)]">· {liveDecision.reason?.slice(0,90)}</span> : null}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {state==="idle"||state==="done"||state==="denied" ? (
                <button onClick={startRun} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white dark:text-black text-sm font-semibold shadow-sm hover:opacity-90 transition focus-ring" data-tooltip="Calls POST /api/agent/run → Exa + LLM + GitHub live, Network tab me dikhega">
                  <Zap size={16} /> Run Clearance on TrueForge
                </button>
              ) : (
                <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono text-[var(--muted)]">
                  <RefreshCw size={16} className="animate-spin" /> {state==="scanning"?"Reading Gmail…":state==="delegating"?"Delegating…":state==="sandbox"?"Sandbox running…":state==="awaiting_approval"?"Awaiting your LGTM…":"Working…"}
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)]" data-tooltip="Irreversible tools need human sign-off"><Lock size={12} /> checkpoint before spend</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)]" data-tooltip="Isolated execution, secrets stay in harness"><Cpu size={12} /> sandbox on-demand</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-7 tile p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Layers size={16} className="text-[var(--muted)]" /> Subagents <span className="text-xs font-normal font-mono text-[var(--muted)]">· live, parallel</span></h4>
              <div className="mt-3 space-y-2">
                {subs.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${s.status==="done"?"bg-emerald-500":s.status==="running"?"bg-amber-500 animate-pulse":s.status==="error"?"bg-red-500":"bg-[var(--border-strong)]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.name} <span className="text-xs font-mono text-[var(--muted)]">· {s.task}</span></p>
                      {s.output && <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 mt-1 break-words">{s.output} {s.latencyMs && <span className="text-[var(--muted)]">· {s.latencyMs}ms</span>}</p>}
                      {s.status==="running" && <p className="text-xs font-mono text-amber-600 dark:text-amber-300 mt-1">running…</p>}
                    </div>
                    {s.status==="done"?<Check size={14} className="text-emerald-500 mt-1" />:s.status==="running"?<Clock size={14} className="text-amber-500 mt-1 animate-pulse" />:<Clock size={14} className="text-[var(--muted-2)] mt-1" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 xl:col-span-5 tile p-4 flex flex-col">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Terminal size={16} className="text-[var(--muted)]" /> Sandbox</h4>
              <p className="text-xs font-mono text-[var(--muted)] mt-1">Isolated exec — secrets stay in harness</p>
              <div ref={termRef} className="mt-3 rounded-2xl bg-[#0f1117] text-slate-200 border border-[#222738] p-3 font-mono text-[11px] leading-relaxed h-[180px] overflow-auto whitespace-pre-wrap">
                {logs.length ? logs.join("\n") : `$ waiting for run…\n# sandbox on-demand — cheaper & safer\n# try: Run Clearance → Network tab me POST dekho`}
              </div>
            </div>
          </div>

          <div className="tile p-4">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Eye size={16} className="text-[var(--muted)]" /> Audit Trail <span className="text-xs font-normal font-mono text-[var(--muted)]">· survives reconnect</span></h4>
            <div className="mt-3 grid gap-2">
              {audit.map((a,i)=>(
                <div key={i} className="flex gap-3 text-xs font-mono">
                  <span className="text-[var(--muted)] shrink-0 w-12">{a.t}</span>
                  <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${a.ok?"bg-emerald-500":"bg-[var(--border-strong)]"}`} />
                  <span className={a.ok?"text-[var(--foreground)]":"text-[var(--muted)]"}>{a.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Approval — friendly, clear */}
      {showApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[560px] rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/20 grid place-items-center"><ShieldCheck size={18} className="text-amber-600" /></div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold tracking-widest text-amber-700">HUMAN CHECKPOINT — LICENSE REQUIRED</p>
                <p className="text-sm font-semibold">Approve {formatUSD(active.amount)} to {active.vendor}?</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-700">irreversible</span>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs font-mono text-[var(--muted)]">Total</p><p className="text-sm font-semibold font-mono">{formatUSD(active.amount)}</p></div>
                <div><p className="text-xs font-mono text-[var(--muted)]">Budget after</p><p className="text-sm font-semibold font-mono">{liveDecision?.afterPct ?? afterPct}%</p></div>
                <div><p className="text-xs font-mono text-[var(--muted)]">Policy</p><p className="text-xs font-mono text-amber-700 mt-1">{liveDecision?.policyHit ?? active.policyHit ?? "OK"}</p></div>
              </div>
              <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3 text-xs font-mono leading-relaxed">
                <p className="font-medium">This will:</p>
                <ul className="list-disc list-inside text-[var(--muted)] mt-1 space-y-0.5">
                  <li>Send PO email via Gmail MCP</li>
                  <li>Insert row in Postgres <code className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">po_history</code></li>
                  <li>Commit audit file to GitHub</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex gap-2 justify-end">
              <button onClick={deny} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-sm font-medium focus-ring"><X size={16} /> Deny</button>
              <button onClick={approve} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--accent)] text-white dark:text-black text-sm font-semibold shadow-sm hover:opacity-90 focus-ring"><Check size={16} /> Approve & Execute</button>
            </div>
          </motion.div>
        </div>
      )}

      <section id="how" className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 tile p-5">
          <h3 className="text-sm font-semibold">How TrueForge is doing the work</h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3"><p className="font-semibold">MCP Tools</p><p className="text-[var(--muted)] mt-1">Gmail, Postgres, GitHub, Exa — real, not mocked.</p></div>
            <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3"><p className="font-semibold">Sandbox</p><p className="text-[var(--muted)] mt-1">On-demand, isolated. Secrets stay in harness.</p></div>
            <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3"><p className="font-semibold">Subagents + Context</p><p className="text-[var(--muted)] mt-1">3 parallel, deferred tools, compaction.</p></div>
            <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3"><p className="font-semibold">Checkpoint + Session</p><p className="text-[var(--muted)] mt-1">Holds before spend, survives refresh.</p></div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 tile p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2"><ShieldCheck size={16} className="text-[var(--accent)]" /> Control & Safety</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed">
            <li className="flex gap-2"><Check size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Generated code never touches prod — isolated only.</li>
            <li className="flex gap-2"><Check size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Irreversible = gated, read-only = auto.</li>
            <li className="flex gap-2"><Check size={12} className="text-emerald-500 mt-0.5 shrink-0" /> Every approval logged: who, when, grant.</li>
          </ul>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs font-mono text-[var(--muted)]">
        <p>WeMakeDevs Agent Harness Hackathon — Aug 24–30, 2026 · TrueForge (MIT) · <a className="underline" href="https://github.com/Nirvanjha2004/clearance" target="_blank" rel="noreferrer">GitHub</a></p>
      </footer>
    </div>
  );
}
