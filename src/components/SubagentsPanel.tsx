"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Layers, Check, Clock, AlertCircle } from "lucide-react";

export interface Subagent {
  id: string;
  name: string;
  task: string;
  status: "queued" | "running" | "done" | "error";
  output?: string;
  latencyMs?: number;
}

interface SubagentsPanelProps {
  agents: Subagent[];
}

const STATUS_META = {
  queued:  { color: "var(--fg-3)",    icon: Clock,        pulse: false },
  running: { color: "var(--amber)",   icon: Clock,        pulse: true  },
  done:    { color: "var(--green)",   icon: Check,        pulse: false },
  error:   { color: "var(--red)",     icon: AlertCircle,  pulse: false },
};

const AGENT_ICONS: Record<string, { bg: string; emoji: string }> = {
  "Price-Auditor":  { bg: "rgba(6,182,212,0.12)",   emoji: "🔍" },
  "Policy-Checker": { bg: "rgba(99,102,241,0.12)",  emoji: "📋" },
  "Vendor-Graph":   { bg: "rgba(16,185,129,0.12)",  emoji: "🗄️" },
};

export default function SubagentsPanel({ agents }: SubagentsPanelProps) {
  return (
    <div className="glass h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
        <Layers size={14} className="text-[var(--accent)]" />
        <h4 className="text-[13px] font-semibold text-[var(--fg)]">Subagents</h4>
        <span className="badge badge-cyan text-[10px] ml-auto">3 parallel</span>
      </div>

      {/* Agents list */}
      <div className="flex-1 px-3 py-3 space-y-2.5 overflow-auto no-scroll">
        <AnimatePresence>
          {agents.map((agent, i) => {
            const meta = STATUS_META[agent.status];
            const Icon = meta.icon;
            const iconMeta = AGENT_ICONS[agent.name] ?? { bg: "rgba(99,102,241,0.12)", emoji: "🤖" };

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-sm p-3 relative overflow-hidden"
              >
                {/* Running shimmer */}
                {agent.status === "running" && (
                  <div className="absolute inset-0 shimmer pointer-events-none" />
                )}

                <div className="flex items-start gap-3">
                  {/* Agent icon */}
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center text-[14px] shrink-0"
                    style={{ background: iconMeta.bg }}
                  >
                    {iconMeta.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[var(--fg)]">{agent.name}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {meta.pulse && (
                          <span
                            className="h-1.5 w-1.5 rounded-full animate-pulse"
                            style={{ background: meta.color }}
                          />
                        )}
                        <Icon
                          size={11}
                          style={{ color: meta.color }}
                        />
                        {agent.latencyMs && (
                          <span className="text-[10px] font-mono text-[var(--fg-3)]">{agent.latencyMs}ms</span>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--fg-3)] mt-0.5 truncate">{agent.task}</p>
                    {agent.output && (
                      <p className="text-[10.5px] text-[var(--fg-2)] mt-1.5 break-words line-clamp-2 bg-[rgba(255,255,255,0.03)] rounded-md px-2 py-1">
                        {agent.output}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
