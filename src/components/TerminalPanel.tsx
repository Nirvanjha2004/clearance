"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Circle } from "lucide-react";

interface TerminalPanelProps {
  logs: string[];
}

function colorizeLine(line: string): string {
  if (line.includes("[error]") || line.includes("failed") || line.includes("ERR"))
    return `<span class="t-red">${escapeHtml(line)}</span>`;
  if (line.includes("[human]") || line.includes("Approved") || line.includes("✓"))
    return `<span class="t-green">${escapeHtml(line)}</span>`;
  if (line.includes("[harness]") || line.includes("HOLD") || line.includes("checkpoint"))
    return `<span class="t-amber">${escapeHtml(line)}</span>`;
  if (line.includes("#") || line.startsWith("$"))
    return `<span class="t-dim">${escapeHtml(line)}</span>`;
  return escapeHtml(line);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function TerminalPanel({ logs }: TerminalPanelProps) {
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        {/* Traffic lights */}
        <div className="flex gap-1.5 mr-2">
          <Circle size={8} className="fill-[#ff5f57] text-[#ff5f57]" />
          <Circle size={8} className="fill-[#ffbd2e] text-[#ffbd2e]" />
          <Circle size={8} className="fill-[#28c840] text-[#28c840]" />
        </div>
        <Terminal size={13} className="text-[var(--fg-3)]" />
        <span className="text-[12px] font-mono text-[var(--fg-3)]">sandbox · isolated exec</span>
        <span className="ml-auto text-[10px] font-mono text-[var(--fg-3)]">secrets in harness</span>
      </div>

      {/* Terminal body */}
      <div
        ref={termRef}
        className="terminal flex-1 overflow-auto"
        style={{ borderRadius: 0, border: "none", borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}
      >
        {logs.length > 0 ? (
          logs.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              dangerouslySetInnerHTML={{ __html: colorizeLine(line) }}
            />
          ))
        ) : (
          <>
            <div className="t-dim">$ waiting for run…</div>
            <div className="t-dim"># Click "Run Clearance" to start the agent pipeline</div>
          </>
        )}
        {/* blinking cursor */}
        <span className="inline-block w-1.5 h-3.5 bg-[#7dd3fc] opacity-80 animate-pulse ml-0.5" style={{ verticalAlign: "text-bottom" }} />
      </div>
    </div>
  );
}
