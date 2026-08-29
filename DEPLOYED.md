# Deployed — Clearance

Local: http://localhost:3000 (PID 35044, npm run dev, .env.local wired)
Vercel Production: https://clearance-jade.vercel.app (alias, auto)
Latest Deploy: https://clearance-ppthjchfa-nirvan-jhas-projects.vercel.app
Health: https://clearance-jade.vercel.app/api/health -> {ok:true, checks:{openrouter:true,exa:true,github:true,gmail:true,stripe:true,db:true}}
Vercel Project: nirvan-jhas-projects/clearance (Next.js, linked to Nirvanjha2004/clearance)
Env: 7 vars Production (OPENROUTER, EXA, GITHUB, GMAIL_USER, GMAIL_APP_PASSWORD, DATABASE_URL, STRIPE) — Sensitive
Build: Next 16.3.3 Turbopack, 8 routes, 12s duration
GitHub: https://github.com/Nirvanjha2004/clearance (8 commits master, pushed)
TrueForge: npx @truefoundry/trueforge@0.1.4 standalone available, catalog/mcp.yaml wired
