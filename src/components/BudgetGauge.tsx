"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { TrendingUp } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface BudgetGaugeProps {
  budgetUsed: number;
  budgetCap: number;
  pendingAmount: number;
}

export default function BudgetGauge({ budgetUsed, budgetCap, pendingAmount }: BudgetGaugeProps) {
  const pct      = Math.min(100, Math.round((budgetUsed / budgetCap) * 100));
  const afterPct = Math.min(100, Math.round(((budgetUsed + pendingAmount) / budgetCap) * 100));
  const remaining = budgetCap - budgetUsed;

  // SVG arc params — half circle
  const R = 56, cx = 70, cy = 70;
  const arcLen = Math.PI * R;  // half circumference
  const fill = (pct / 100) * arcLen;
  const pendFill = (afterPct / 100) * arcLen;

  const usedRef = useRef<SVGPathElement>(null);
  const pendRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (usedRef.current) {
      gsap.fromTo(
        usedRef.current,
        { strokeDashoffset: arcLen },
        { strokeDashoffset: arcLen - fill, duration: 1.2, ease: "power2.out", delay: 0.3 }
      );
    }
    if (pendRef.current && pendingAmount > 0) {
      gsap.fromTo(
        pendRef.current,
        { strokeDashoffset: arcLen },
        { strokeDashoffset: arcLen - pendFill, duration: 1.3, ease: "power2.out", delay: 0.5 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, afterPct]);

  const color = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#6366f1";

  // Mini bar breakdown
  const bars = [
    { label: "Used",      val: budgetUsed,        color: "#6366f1" },
    { label: "Pending",   val: pendingAmount,      color: "#f59e0b" },
    { label: "Available", val: remaining - pendingAmount, color: "#1a1d2e" },
  ];

  return (
    <div className="glass h-full p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-[var(--accent)]" />
        <h4 className="text-[13px] font-semibold text-[var(--fg)]">Budget Overview</h4>
        <span className="ml-auto text-[11px] font-mono text-[var(--fg-3)]">/ {formatUSD(budgetCap)}</span>
      </div>

      {/* Gauge SVG */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: 140, height: 80 }}>
          <svg width="140" height="80" viewBox="0 0 140 80">
            {/* Track */}
            <path
              d={`M 14 70 A ${R} ${R} 0 0 1 126 70`}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Pending arc (behind) */}
            {pendingAmount > 0 && (
              <path
                ref={pendRef}
                d={`M 14 70 A ${R} ${R} 0 0 1 126 70`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${arcLen}`}
                strokeDashoffset={arcLen - pendFill}
                opacity={0.4}
              />
            )}
            {/* Used arc */}
            <path
              ref={usedRef}
              d={`M 14 70 A ${R} ${R} 0 0 1 126 70`}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arcLen}`}
              strokeDashoffset={arcLen}
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <motion.p
              key={pct}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[22px] font-bold text-[var(--fg)] leading-none"
            >
              {pct}%
            </motion.p>
            <p className="text-[10px] font-mono text-[var(--fg-3)]">used</p>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="text-center -mt-2">
        <p className="text-[15px] font-bold text-[var(--fg)]">{formatUSD(budgetUsed)}</p>
        <p className="text-[11px] text-[var(--fg-3)] font-mono">{formatUSD(remaining)} remaining</p>
      </div>

      {/* Stacked bar */}
      <div className="mt-1">
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {bars.map((b) => {
            const w = Math.max(0, (b.val / budgetCap) * 100);
            return (
              <motion.div
                key={b.label}
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ background: b.color, minWidth: b.val > 0 ? 4 : 0 }}
                className="rounded-full"
              />
            );
          })}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {bars.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5 text-[10px] text-[var(--fg-3)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
