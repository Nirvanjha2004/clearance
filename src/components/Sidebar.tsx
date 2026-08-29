"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

export default function Sidebar() {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sidebar-item",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power2.out", delay: 0.1 }
      );
    }, sidebarRef);
    return () => ctx.revert();
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex w-[240px] shrink-0 flex-col h-screen sticky top-0 overflow-y-auto no-scroll border-r border-[var(--border)] bg-[var(--bg-2)]"
      style={{ zIndex: 10 }}
    >
      {/* Logo */}
      <div className="sidebar-item px-5 pt-6 pb-5 flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-xl grid place-items-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}
        >
          <ShieldCheck size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-bold text-[var(--fg)] tracking-tight">Clearance</span>
        <span className="ml-auto badge badge-accent text-[10px] px-1.5 py-0.5">v0.1</span>
      </div>

      {/* Status pill */}
      <div className="sidebar-item mx-4 mb-5 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--green)]" />
        </span>
        <span className="text-[11px] font-mono text-[var(--fg-2)]">TrueForge harness online</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="nav-item active w-full text-left cursor-default">
          <span className="icon-wrap">
            <LayoutDashboard size={14} />
          </span>
          Dashboard
        </div>
      </nav>

      {/* Pro card — purely decorative */}
      <div
        className="sidebar-item mx-3 mt-4 mb-2 rounded-xl overflow-hidden relative p-4 border border-[rgba(99,102,241,0.25)]"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.06) 100%)" }}
      >
        <div
          className="absolute top-2 right-2 h-14 w-14 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(8px)" }}
        />
        <p className="text-[11px] font-semibold text-[var(--fg)] leading-snug">Clearance Pro</p>
        <p className="text-[10px] text-[var(--fg-3)] mt-0.5">Advanced controls</p>
      </div>

      {/* User */}
      <div className="px-3 pb-5 border-t border-[var(--border)] pt-3 mt-2">
        <div className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="User"
            className="h-7 w-7 rounded-full object-cover ring-1 ring-[var(--border)]"
          />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[var(--fg)] truncate">Nirva</p>
            <p className="text-[10px] text-[var(--fg-3)] font-mono truncate">Founder</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
