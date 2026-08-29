import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jetMono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clearance — License to Spend | TrueForge Agent Harness",
  description: "Approval-gated procurement agent on TrueForge. Never spends without human LGTM. Built for WeMakeDevs Agent Harness Hackathon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${jetMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#080a0f] text-slate-200 selection:bg-[#00ff88]/20">{children}</body>
    </html>
  );
}
