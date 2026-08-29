"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  ShieldCheck,
  X,
  Check,
  AlertTriangle,
  Lock,
  Zap,
  DollarSign,
} from "lucide-react";
import { formatUSD } from "@/lib/utils";
import type { Invoice } from "./InboxPanel";

interface ApprovalModalProps {
  open: boolean;
  invoice: Invoice;
  afterPct: number;
  policyHit?: string;
  liveRisk?: string;
  onApprove: () => void;
  onDeny: () => void;
}

export default function ApprovalModal({
  open,
  invoice,
  afterPct,
  policyHit,
  liveRisk,
  onApprove,
  onDeny,
}: ApprovalModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.88, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }
      );
    }
  }, [open]);

  const risk = liveRisk ?? invoice.risk;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Approval checkpoint"
        >
          <div
            ref={cardRef}
            className="w-full max-w-[520px] rounded-[24px] overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,158,11,0.1)",
            }}
          >
            {/* Top glow bar */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)" }}
            />

            {/* Header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-[var(--border)]">
              <div
                className="h-11 w-11 rounded-2xl grid place-items-center shrink-0"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  boxShadow: "0 0 20px rgba(245,158,11,0.15)",
                }}
              >
                <ShieldCheck size={20} className="text-[var(--amber)]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--amber)] uppercase">
                  Human Checkpoint — License Required
                </p>
                <p className="text-[16px] font-bold text-[var(--fg)] mt-1 leading-snug">
                  Approve {formatUSD(invoice.amount)} to {invoice.vendor}?
                </p>
              </div>
              <span
                className="badge text-[10px]"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#fca5a5",
                }}
              >
                irreversible
              </span>
            </div>

            {/* Stats grid */}
            <div className="px-6 py-5">
              <div
                className="grid grid-cols-3 gap-3 rounded-xl p-4"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                {[
                  { label: "Amount",      value: formatUSD(invoice.amount), icon: DollarSign, color: "#a5b4fc" },
                  { label: "Budget after", value: `${afterPct}%`,           icon: Zap,         color: afterPct > 80 ? "#fca5a5" : "#fcd34d" },
                  { label: "Risk level",  value: risk,                       icon: AlertTriangle, color: risk === "high" ? "#fca5a5" : risk === "medium" ? "#fcd34d" : "#6ee7b7" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <item.icon size={14} style={{ color: item.color }} className="mx-auto mb-1.5" />
                    <p className="text-[14px] font-bold capitalize" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] font-mono text-[var(--fg-3)] mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Policy hit */}
              {policyHit && (
                <div
                  className="flex gap-2.5 mt-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
                >
                  <Lock size={12} className="text-[var(--amber)] shrink-0 mt-0.5" />
                  <p className="text-[11.5px] font-mono text-[var(--fg-2)] break-words">{policyHit}</p>
                </div>
              )}

              {/* Warning */}
              <div
                className="flex gap-2 mt-3 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
              >
                <AlertTriangle size={12} className="text-[var(--red)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[rgba(239,68,68,0.8)]">
                  Approving will trigger: Gmail PO send · Postgres insert · GitHub audit commit.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 justify-end px-6 py-4 border-t border-[var(--border)]"
              style={{ background: "var(--surface-2)" }}
            >
              <button
                onClick={onDeny}
                className="btn-ghost"
                style={{ borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}
              >
                <X size={14} /> Deny
              </button>
              <button
                onClick={onApprove}
                className="btn-primary"
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
                }}
              >
                <Check size={14} /> Approve & Execute
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
