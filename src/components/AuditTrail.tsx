"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle2, XCircle, Info } from "lucide-react";

interface AuditEntry {
  t: string;
  msg: string;
  ok?: boolean;
}

interface AuditTrailProps {
  entries: AuditEntry[];
}

export default function AuditTrail({ entries }: AuditTrailProps) {
  return (
    <div className="glass h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
        <Eye size={14} className="text-[var(--accent)]" />
        <h4 className="text-[13px] font-semibold text-[var(--fg)]">Audit Trail</h4>
        <span className="badge badge-green text-[10px] ml-auto">persists refresh</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto no-scroll px-5 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[var(--border)]" />

          <AnimatePresence>
            {entries.map((entry, i) => {
              const Icon = entry.ok === true ? CheckCircle2 : entry.ok === false ? XCircle : Info;
              const iconColor = entry.ok === true ? "var(--green)" : entry.ok === false ? "var(--red)" : "var(--fg-3)";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="flex gap-4 pb-4 relative"
                >
                  {/* Icon dot */}
                  <div
                    className="h-9 w-9 rounded-full grid place-items-center shrink-0 bg-[var(--surface-2)] border border-[var(--border)] z-10"
                  >
                    <Icon size={13} style={{ color: iconColor }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--fg-3)]">{entry.t}</span>
                    </div>
                    <p
                      className={`text-[12px] mt-0.5 break-words leading-relaxed ${
                        entry.ok === true
                          ? "text-[var(--fg-2)]"
                          : entry.ok === false
                          ? "text-[rgba(239,68,68,0.8)]"
                          : "text-[var(--fg-3)]"
                      }`}
                    >
                      {entry.msg}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
