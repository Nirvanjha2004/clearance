"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface StatCardsProps {
  budgetUsed: number;
  budgetCap: number;
  pendingCount: number;
  approvedTotal: number;
  riskPct: number;
}

export default function StatCards({
  budgetUsed,
  budgetCap,
  pendingCount,
  approvedTotal,
  riskPct,
}: StatCardsProps) {
  const pct = Math.round((budgetUsed / budgetCap) * 100);

  const stats = [
    {
      label:    "Monthly Budget Used",
      value:    formatUSD(budgetUsed),
      sub:      `of ${formatUSD(budgetCap)} cap`,
      delta:    `${pct}% used`,
      up:       pct < 80,
      icon:     DollarSign,
      iconBg:   "rgba(99,102,241,0.15)",
      iconColor:"#a5b4fc",
      accent:   "#6366f1",
      progress: pct,
    },
    {
      label:    "Pending Approvals",
      value:    String(pendingCount),
      sub:      "awaiting LGTM",
      delta:    "Needs review",
      up:       false,
      icon:     AlertTriangle,
      iconBg:   "rgba(245,158,11,0.12)",
      iconColor:"#fcd34d",
      accent:   "#f59e0b",
      progress: null,
    },
    {
      label:    "Total Approved",
      value:    formatUSD(approvedTotal),
      sub:      "this session",
      delta:    "Processed",
      up:       true,
      icon:     CheckCircle2,
      iconBg:   "rgba(16,185,129,0.12)",
      iconColor:"#6ee7b7",
      accent:   "#10b981",
      progress: null,
    },
    {
      label:    "Risk Exposure",
      value:    `${riskPct}%`,
      sub:      "of monthly budget",
      delta:    riskPct > 70 ? "High risk" : riskPct > 40 ? "Medium risk" : "Low risk",
      up:       riskPct < 50,
      icon:     TrendingUp,
      iconBg:   riskPct > 70 ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.12)",
      iconColor:riskPct > 70 ? "#fca5a5" : "#a5b4fc",
      accent:   riskPct > 70 ? "#ef4444" : "#6366f1",
      progress: riskPct,
    },
  ];

  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    counterRefs.current.forEach((el, i) => {
      if (!el) return;
      const raw = stats[i].value.replace(/[^0-9.]/g, "");
      const num = parseFloat(raw);
      if (isNaN(num)) return;
      const prefix = stats[i].value.startsWith("$") ? "$" : "";
      const suffix = stats[i].value.endsWith("%") ? "%" : "";
      const obj = { val: 0 };
      gsap.to(obj, {
        val: num,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.3 + i * 0.07,
        onUpdate() {
          if (el) {
            const v = obj.val;
            if (num >= 1000) {
              el.textContent = prefix + (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : Math.round(v).toString()) + suffix;
            } else {
              el.textContent = prefix + (suffix === "%" ? Math.round(v) : v.toFixed(0)) + suffix;
            }
          }
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetUsed, approvedTotal, riskPct]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass glass-hover relative overflow-hidden p-5"
        >
          {/* Glow accent */}
          <div
            className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${s.accent} 0%, transparent 70%)`, filter: "blur(16px)" }}
          />

          {/* Icon */}
          <div
            className="h-9 w-9 rounded-xl grid place-items-center mb-4"
            style={{ background: s.iconBg }}
          >
            <s.icon size={16} style={{ color: s.iconColor }} />
          </div>

          {/* Value */}
          <span
            ref={(el) => { counterRefs.current[i] = el; }}
            className="text-2xl font-bold text-[var(--fg)] block"
          >
            {s.value}
          </span>
          <p className="text-[11px] text-[var(--fg-3)] mt-0.5 font-mono">{s.sub}</p>

          {/* Delta */}
          <div className="flex items-center gap-1.5 mt-3">
            {s.up ? (
              <ArrowUp size={11} className="text-[var(--green)]" />
            ) : (
              <ArrowDown size={11} className="text-[var(--amber)]" />
            )}
            <span className={`text-[11px] font-medium ${s.up ? "text-[var(--green)]" : "text-[var(--amber)]"}`}>
              {s.delta}
            </span>
          </div>

          {/* Progress bar (if applicable) */}
          {s.progress !== null && (
            <div className="progress-track mt-3">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, s.progress)}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                style={{
                  background: s.progress > 80
                    ? `linear-gradient(90deg, ${s.accent}, #ef4444)`
                    : `linear-gradient(90deg, var(--accent), var(--accent-2))`,
                }}
              />
            </div>
          )}

          {/* Label */}
          <p className="text-[11px] font-semibold text-[var(--fg-3)] mt-2">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
