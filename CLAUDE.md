# Memory

## Me
Laign (laign@ptorro.com — business email, use this for everything PTorro/TorroLink). Personal Gmail (laigno@gmail.com) is personal only — never use it for business notifications, code defaults, or any TorroLink system. Founder of PTorro, building TorroLink — a QR-code profile platform for small businesses. Non-developer: I rely on Claude for all code, debugging, and deploys.

## Active Projects
| Name | What | Status |
|------|------|--------|
| **TorroLink** | QR code profile platform for SMBs | 🟢 LIVE at torrolink.com (launched 2026-06-21) |
→ Details: memory/projects/torrolink.md

## Key Tools & Shortcuts
| Term | Meaning |
|------|---------|
| `_fix_deploy.bat` | Git commit + push → triggers Netlify auto-deploy (~2-3 min) |
| `deploy.bat` | Old deploy script — stale commit message, avoid |
| portal | torrolink.com/portal — customer login + profile editor |
| admin | torrolink.com/admin — owner dashboard |
| CIFS rule | **NEVER use Edit tool on large JS files** — use Python scripts via bash |

## Tech Stack (Quick Ref)
| Layer | Tool |
|-------|------|
| Hosting | Netlify (serverless functions in `netlify/functions/`) |
| Auth + DB | Supabase (project ID: cayymmknkjpiybssiltu) |
| Payments | Stripe (LIVE keys active as of 2026-06-21) |
| Email | Resend (domain: torrolink.com verified) — orders@, billing@, leads@, hello@ all active |
| Repo | C:\Laign\Torrolink + GitHub + Google Drive backup |

## Netlify Environment Variables
| Var | Purpose |
|-----|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase client-side key (safe in browser) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side DB queries only) |
| `RESEND_API_KEY` | Resend email API |
| `STRIPE_SECRET_KEY` | Stripe secret (LIVE — sk_live_ active) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `OWNER_EMAIL` | laign@ptorro.com — all owner notifications route here |
| `ADMIN_PASSWORD` | Admin dashboard password |
| `ADMIN_SECRET` | Admin secret token |
| `ANTHROPIC_API_KEY` | Claude API for AI agents |
| `URL` | Netlify site URL |
| `DEPLOY_URL` | Netlify deploy URL |

## SESSION START — Read These Files Every Session
Before doing anything, read these files in order:
1. `TASKS.md` — current task list, what's active, what's waiting, what's done
2. `BRUCE.md` — master agent overview, current priorities, all domain status
3. `HAWK.md` — Waypoint Roofing field agent, referral partner system
4. `memory/roofing-tracker.md` — visit log, pipeline, referral partners
5. `memory/projects/torrolink.md` — TorroLink full project context

---

## Agent System
PTorro Holdings runs on a named-agent system. Each agent owns a domain.

| Agent | Role | File |
|-------|------|------|
| **Bruce** | Master agent — oversees everything | BRUCE.md |
| **Hawk** | Waypoint Roofing — field sales, referral partners, pipeline | HAWK.md |
| **El Chappo** | TorroLink — product, revenue, tech | EL_CHAPPO.md |
| **Lucius** | Tech & QA — code fixes, deploys | LUCIUS.md |
| **Alfred** | Customer Success | ALFRED.md |
| **Oracle** | Intelligence & reporting | ORACLE.md |
| **Nightwing** | Marketing — PTorro Holdings | NIGHTWING.md |
| **Vicki Vale** | Social & Content — TorroLink + Waypoint | VICKI_VALE.md |
| **The Huntress** | Email & Outreach — TorroLink + Waypoint | THE_HUNTRESS.md |
| **Peter Parker** | Web Research | PETER_PARKER.md |

**To activate an agent:** Read their .md file and act within that agent's domain.

---

## Roofing
**Brand:** Waypoint Roofing (PTorro Holdings LLC)
**Agent:** Hawk (HAWK.md)
**Profile:** torrolink.com/p/ptorro-holdings-llc
**Waypoint email:** laign@wproofs.com
**Tracker:** memory/roofing-tracker.md — visit log, referral partners, pipeline
**Outreach started:** 2026-06-22 (Day 1)

## Email Access (for agents)
| Account | How agents access |
|---------|------------------|
| laigno@gmail.com | Gmail MCP — create_draft tool (connected) |
| laign@ptorro.com | Gmail MCP — same connector if authorized, else show draft in chat |
| laign@wproofs.com | Gmail (Google account) — needs second Gmail connector in Cowork settings |
| TorroLink system emails | agent-mailer Netlify function (deploy needed) |

**Email guardrail:** Agents ALWAYS show draft first. Laign approves → then send. Never auto-send to real people without approval.

**agent-mailer function:** POST to /.netlify/functions/agent-mailer with x-agent-secret header (= ADMIN_SECRET value). Allowed senders: hello@, orders@, billing@, leads@, supervisor@, hawk@ — all @torrolink.com.

## Preferences
- No code in chat — always write to files
- Run `_fix_deploy.bat` to deploy (I run it, Claude updates the commit message first)
- Netlify env vars hold all secrets — never hardcode keys in files
- Full autonomous permission for code fixes during active sessions
→ Full technical context: memory/context/tech-stack.md
