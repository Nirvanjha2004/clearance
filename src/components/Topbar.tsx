"use client";

import { ShieldCheck } from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-2)]"
      style={{ backdropFilter: "blur(12px)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[var(--fg-3)]">Clearance</span>
        <span className="text-[var(--fg-3)]">/</span>
        <span className="text-[13px] font-semibold text-[var(--fg)]">Dashboard</span>
      </div>

      {/* Right: status indicators only — no fake action buttons */}
      <div className="ml-auto flex items-center gap-3">
        {/* Live harness indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono text-[var(--fg-3)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" style={{ boxShadow: "0 0 4px #10b98180" }} />
          TrueForge
        </div>

        {/* Built for hackathon */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[11px] font-mono text-[#a5b4fc]">
          <ShieldCheck size={11} />
          WeMakeDevs Hackathon
        </div>
      </div>
    </header>
  );
}
