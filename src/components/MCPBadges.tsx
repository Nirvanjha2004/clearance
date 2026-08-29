"use client";

import { motion } from "framer-motion";
import { Mail, Database, GitBranch, Search, Cpu } from "lucide-react";

const MCPS = [
  { icon: Mail,      label: "Gmail",    color: "#6366f1", status: "live" },
  { icon: Database,  label: "Postgres", color: "#06b6d4", status: "live" },
  { icon: GitBranch, label: "GitHub",   color: "#10b981", status: "live" },
  { icon: Search,    label: "Exa",      color: "#8b5cf6", status: "live" },
  { icon: Cpu,       label: "Sandbox",  color: "#f59e0b", status: "ready" },
];

export default function MCPBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {MCPS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
          style={{
            background: `${m.color}12`,
            borderColor: `${m.color}28`,
          }}
        >
          <m.icon size={11} style={{ color: m.color }} />
          <span className="text-[11px] font-medium" style={{ color: m.color }}>{m.label}</span>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: m.status === "live" ? "#10b981" : "#f59e0b",
              boxShadow: `0 0 4px ${m.status === "live" ? "#10b981" : "#f59e0b"}80`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
