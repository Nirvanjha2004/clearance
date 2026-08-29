import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetch real Gmail inbox via IMAP (app password) — falls back to seed if IMAP fails/disabled
// Uses GMAIL_USER + GMAIL_APP_PASSWORD from .env.local
export async function GET() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const useImap = !!(user && pass);

  if (!useImap) {
    return NextResponse.json({
      ok: true,
      source: "seed (no Gmail creds)",
      count: 3,
      invoices: seed(),
    });
  }

  try {
    // dynamic import to avoid bundling issues
    const Imap = (await import("imap")).default as unknown as new (opts: unknown) => {
      once: (ev: string, cb: (...a: unknown[]) => void) => void;
      on: (ev: string, cb: (...a: unknown[]) => void) => void;
      connect: () => void;
      end: () => void;
      openBox: (name: string, ro: boolean, cb: (err: Error | null, box: { messages: { total: number } }) => void) => void;
      search: (criteria: unknown, cb: (err: Error | null, results: number[]) => void) => void;
      fetch: (uids: number[], opts: unknown) => {
        on: (ev: string, cb: (msg: unknown, seq: number) => void) => void;
        once: (ev: string, cb: () => void) => void;
      };
    };
    const { simpleParser } = await import("mailparser");

    const invoices: Array<{
      id: string;
      vendor: string;
      subject: string;
      amount: number;
      items: { name: string; qty: number; unit: number }[];
      date: string;
      risk: string;
      from: string;
      hasPdf: boolean;
    }> = [];

    const result = await new Promise<typeof invoices>((resolve, reject) => {
      const imap = new Imap({
        user,
        password: pass,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 8000,
      });

      const toFetch: typeof invoices = [];

      imap.once("ready", () => {
        imap.openBox("INBOX", true, (err, box) => {
          if (err) return reject(err);
          // last 10 unseen or recent
          imap.search(["ALL"], (err2, results) => {
            if (err2) return reject(err2);
            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }
            const uids = results.slice(-10).reverse();
            const f = imap.fetch(uids, { bodies: "", struct: true });
            let pending = 0;
            f.on("message", (msg: unknown) => {
              const m = msg as { on: (ev: string, cb: (stream: unknown, info: unknown) => void) => void; once: (ev: string, cb: () => void) => void };
              pending++;
              m.on("body", (stream) => {
                simpleParser(stream as never)
                  .then((parsed) => {
                    const subject = parsed.subject ?? "(no subject)";
                    const from = parsed.from?.text ?? "";
                    const text = (parsed.text as string | undefined) ?? "";
                    const attachments = (parsed.attachments as Array<{ filename?: string; contentType?: string }> | undefined) ?? [];
                    const hasPdf = attachments.some((a) => (a.filename ?? "").toLowerCase().endsWith(".pdf") || a.contentType === "application/pdf");
                    // procurement filter — keep only mails that look like invoices/quotes
                    const hay = `${subject} ${text}`.toLowerCase();
                    const isProc = hasPdf || /\b(invoice|quote|po\b|procurement|bill|payment|vendor|purchase|requisition|total)\b/i.test(hay) || /\$[\d,]+/.test(subject + " " + text.slice(0,800));
                    if (!isProc) {
                      // stash for fallback but don't push as invoice — keep Gmail noise out of procurement inbox
                      // we still parse but mark; we'll filter later
                    }
                    // amount parse — ignore unrealistic salary $700k+
                    const amtMatch = subject.match(/\$[\d,]+(?:\.\d{2})?/) ?? text.slice(0,2000).match(/\$[\d,]+(?:\.\d{2})?/) ?? text.match(/₹[\d,]+/);
                    let amount = amtMatch ? Number(amtMatch[0].replace(/[$,₹]/g, "")) : 0;
                    if (amount > 50000) amount = 0; // likely salary, not procurement PO
                    // qty parse like 12x or 12 x
                    const qtyMatch = subject.match(/(\d+)\s*[x×]/i) ?? text.match(/(\d+)\s*[x×]/i);
                    const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
                    const vendor = from.match(/"?([^"<]+)"?\s*<.*>/)?.[1]?.trim() ?? from.split("@")[0] ?? "Unknown Vendor";
                    const id = `MAIL-${parsed.messageId?.slice(1, 8) ?? String(pending).padStart(4, "0")}`;
                    const date = parsed.date ? new Date(parsed.date).toLocaleString() : "Today";
                    const risk = amount > 5000 ? "high" : amount > 2000 ? "medium" : "low";
                    if (!isProc && !hasPdf) {
                      // skip non-procurement noise (job alerts etc) — keeps inbox clean
                      return;
                    }
                    toFetch.push({
                      id,
                      vendor: vendor.slice(0, 40),
                      subject: subject.slice(0, 100),
                      amount: amount || 4200,
                      items: amount ? [{ name: subject.slice(0, 30) || "Line item", qty, unit: Math.round((amount || 4200) / qty) }] : [{ name: "Line item", qty: 1, unit: 4200 }],
                      date,
                      risk,
                      from,
                      hasPdf,
                    });
                  })
                  .catch(() => {})
                  .finally(() => {
                    pending--;
                    if (pending === 0) {
                      // wait a bit for all parses
                      setTimeout(() => {
                        imap.end();
                      }, 300);
                    }
                  });
              });
            });
            (f as unknown as { once: (ev: string, cb: (err?: unknown) => void) => void }).once("error", (err: unknown) => reject(err as Error));
            f.once("end", () => {
              if (pending === 0) setTimeout(() => { imap.end(); resolve(toFetch); }, 500);
              else setTimeout(() => resolve(toFetch), 1500);
            });
          });
        });
      });
      imap.once("error", (err: unknown) => reject(err as Error));
      imap.once("end", () => resolve(toFetch));
      imap.connect();
      setTimeout(() => reject(new Error("IMAP timeout 10s — check Gmail IMAP enabled + App Password without spaces")), 10000);
    });

    if (result.length === 0) {
      return NextResponse.json({ ok: true, source: "gmail (empty) -> seed fallback", count: 3, invoices: seed(), note: "No mails found in INBOX — send test mail to " + user });
    }
    return NextResponse.json({ ok: true, source: "gmail live via IMAP", count: result.length, inbox: user, note: `Fetched ${result.length} recent mails`, invoices: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: true, source: "seed fallback (IMAP error)", error: msg, count: 3, invoices: seed(), hint: "Enable Gmail Settings -> Forwarding and POP/IMAP -> IMAP Enable + use App Password without spaces. Or send mail and retry." });
  }
}

function seed() {
  return [
    { id: "INV-2419", vendor: "Acme Workstations", subject: "Quote for 12× MacBook Air M3 — $4,200", amount: 4200, items: [{ name: "MacBook Air M3 16/512", qty: 12, unit: 350 }], date: "Today 09:14", risk: "medium", from: "seed@demo.local", hasPdf: false },
    { id: "INV-2420", vendor: "Vercel Inc.", subject: "Pro plan + overages — July $892", amount: 892, items: [{ name: "Pro seats ×8", qty: 1, unit: 240 }, { name: "Bandwidth overage", qty: 1, unit: 652 }], date: "Today 08:02", risk: "low", from: "seed@demo.local", hasPdf: false },
    { id: "INV-2421", vendor: "Bright Data", subject: "Scraping API — 5M requests $6,100", amount: 6100, items: [{ name: "API credits", qty: 1, unit: 6100 }], date: "Yesterday", risk: "high", from: "seed@demo.local", hasPdf: false },
  ];
}
