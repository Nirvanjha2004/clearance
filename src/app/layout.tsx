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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${jetMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const s=localStorage.getItem('clearance:theme');const d=s? s==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.classList.toggle('dark', d);}catch{}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col selection:bg-[var(--accent-soft)] transition-colors">
        {/* ambient lighting artifacts */}
        <div className="ambient" aria-hidden>
          <div className="orb orb--1" />
          <div className="orb orb--2" />
          <div className="orb orb--3" />
        </div>
        {children}
      </body>
    </html>
  );
}
