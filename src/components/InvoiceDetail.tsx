"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Zap,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { formatUSD } from "@/lib/utils";
import type { Invoice } from "./InboxPanel";

type AgentState = "idle" | "scanning" | "delegating" | "sandbox" | "awaiting_approval" | "approved" | "done" | "denied";

interface InvoiceDetailProps {
  invoice: Invoice;
  state: AgentState;
  liveRisk?: string;
  livePolicyHit?: string;
  liveReason?: string;
  onRun: () => void;
}

const STATE_LABELS: Record<AgentState, string> = {
  idle: "Run Clearance",
  scanning: "Reading Gmail…",
  delegating: "Delegating to agents…",
  sandbox: "Running sandbox…",
  awaiting_approval: "Awaiting your LGTM…",
  approved: "Executing…",
  done: "Run again",
  denied: "Rerun analysis",
};

const RISK_COLORS: Record<string, string> = {
  high: "badge-red",
  medium: "badge-amber",
  low: "badge-green",
};

export default function InvoiceDetail({
  invoice,
  state,
  liveRisk,
  livePolicyHit,
  liveReason,
  onRun,
}: InvoiceDetailProps) {
  const risk = liveRisk ?? invoice.risk;
  const policyHit = livePolicyHit ?? invoice.policyHit;
  const isRunning = state !== "idle" && state !== "done" && state !== "denied";

  return (
    <div className="glass flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)]">
        <div className="h-9 w-9 rounded-xl bg-[rgba(99,102,241,0.12)] grid place-items-center shrink-0">
          <FileText size={16} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[13px] font-bold text-[var(--fg)]">{invoice.id}</h3>
            <span className="text-[var(--fg-3)] text-[13px]">·</span>
            <span className="text-[13px] font-medium text-[var(--fg-2)] truncate">{invoice.vendor}</span>
            <span className={`badge ${RISK_COLORS[risk] ?? "badge-accent"} ml-auto`}>
              {risk} risk
            </span>
          </div>
          <p className="text-[11.5px] text-[var(--fg-3)] font-mono mt-0.5 truncate">{invoice.subject}</p>
        </div>
      </div>

      {/* Line items table */}
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
          {/* Table header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-3)] border-b border-[var(--border)]">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span className="text-[11px] font-semibold text-[var(--fg-2)]">Extracted line items</span>
            <span className="badge badge-accent text-[10px] ml-auto">Generative UI · sandbox</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit price</th>
                <th className="text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <motion.tr
                  key={item.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <td className="font-medium text-[var(--fg)]">{item.name}</td>
                  <td className="text-right font-mono">{item.qty}</td>
                  <td className="text-right font-mono">{formatUSD(item.unit)}</td>
                  <td className="text-right font-mono font-semibold text-[var(--fg)]">
                    {formatUSD(item.qty * item.unit)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border)]">
                <td colSpan={3} className="font-bold text-[var(--fg)]">Total</td>
                <td className="text-right font-mono font-bold text-[var(--accent)]">
                  {formatUSD(invoice.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Policy hit banner */}
        {policyHit && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex gap-2.5 px-4 py-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)]"
          >
            <AlertTriangle size={14} className="text-[var(--amber)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--amber)]">Policy Flag</p>
              <p className="text-[11.5px] font-mono text-[var(--fg-2)] mt-0.5 break-words">
                {policyHit}
                {liveReason && (
                  <span className="text-[var(--fg-3)]"> · {liveReason.slice(0, 100)}</span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-4 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
        {isRunning ? (
          <button disabled className="btn-primary opacity-50 cursor-not-allowed">
            <RefreshCw size={14} className="animate-spin" />
            {STATE_LABELS[state]}
          </button>
        ) : (
          <button onClick={onRun} className="btn-primary">
            <Zap size={14} />
            {STATE_LABELS[state]}
          </button>
        )}
        <p className="ml-auto text-[10px] font-mono text-[var(--fg-3)]">
          via TrueForge · OpenRouter · gpt-4o-mini · {invoice.date}
        </p>
      </div>
    </div>
  );
}
