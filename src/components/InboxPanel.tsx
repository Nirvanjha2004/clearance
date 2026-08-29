"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Search,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { formatUSD } from "@/lib/utils";

export interface Invoice {
  id: string;
  vendor: string;
  subject: string;
  amount: number;
  items: { name: string; qty: number; unit: number }[];
  date: string;
  risk: "low" | "medium" | "high";
  policyHit?: string;
}

interface InboxPanelProps {
  invoices: Invoice[];
  activeId: string;
  loading: boolean;
  source: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

const RISK_META = {
  high:   { label: "High",   className: "badge-red",   icon: AlertTriangle },
  medium: { label: "Medium", className: "badge-amber",  icon: Clock },
  low:    { label: "Low",    className: "badge-green",  icon: CheckCircle2 },
};

const VENDOR_COLORS: Record<string, string> = {
  A: "#6366f1", V: "#06b6d4", B: "#ef4444", G: "#10b981",
  N: "#f59e0b", S: "#8b5cf6", D: "#ec4899", M: "#14b8a6",
};
function vendorColor(name: string) {
  return VENDOR_COLORS[name[0]?.toUpperCase()] ?? "#6366f1";
}

export default function InboxPanel({
  invoices,
  activeId,
  loading,
  source,
  onSelect,
  onRefresh,
}: InboxPanelProps) {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchRisk = filter === "all" || inv.risk === filter;
    const matchSearch =
      !search ||
      inv.vendor.toLowerCase().includes(search.toLowerCase()) ||
      inv.subject.toLowerCase().includes(search.toLowerCase());
    return matchRisk && matchSearch;
  });

  return (
    <div className="glass flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
        <Mail size={15} className="text-[var(--accent)]" />
        <h3 className="text-[13px] font-semibold text-[var(--fg)] flex-1">Procurement Inbox</h3>
        <span className="badge badge-cyan text-[10px]">{invoices.length} total</span>
        <button
          onClick={onRefresh}
          className="h-7 w-7 rounded-lg grid place-items-center bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-glow)] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={12} className={`text-[var(--fg-2)] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <Search size={12} className="text-[var(--fg-3)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor or subject…"
            className="flex-1 bg-transparent text-[12px] text-[var(--fg)] placeholder:text-[var(--fg-3)] outline-none"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--border-soft)]">
        <Filter size={11} className="text-[var(--fg-3)] mr-1" />
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize transition-all ${
              filter === f
                ? "bg-[rgba(99,102,241,0.2)] text-[#a5b4fc] border border-[rgba(99,102,241,0.3)]"
                : "text-[var(--fg-3)] hover:text-[var(--fg-2)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-[var(--fg-3)]">{source}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scroll divide-y divide-[var(--border-soft)]">
        <AnimatePresence>
          {filtered.map((inv, i) => {
            const risk = RISK_META[inv.risk];
            const RiskIcon = risk.icon;
            const isActive = inv.id === activeId;
            return (
              <motion.button
                key={inv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(inv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                  isActive
                    ? "bg-[rgba(99,102,241,0.08)] border-l-2 border-[var(--accent)]"
                    : "hover:bg-[var(--surface-2)] border-l-2 border-transparent"
                }`}
              >
                {/* Avatar */}
                <div
                  className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold text-[13px] shrink-0"
                  style={{ background: vendorColor(inv.vendor) }}
                >
                  {inv.vendor[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--fg)] truncate">{inv.vendor}</span>
                    <span className={`badge ${risk.className} text-[10px] shrink-0`}>
                      <RiskIcon size={9} />
                      {risk.label}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[var(--fg-3)] truncate mt-0.5">{inv.subject}</p>
                </div>

                {/* Amount + date */}
                <div className="shrink-0 text-right">
                  <p className={`text-[13px] font-bold ${isActive ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}>
                    {formatUSD(inv.amount)}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--fg-3)] mt-0.5">{inv.date}</p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail size={24} className="text-[var(--fg-3)] mb-3 opacity-40" />
            <p className="text-[13px] text-[var(--fg-3)]">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
}
