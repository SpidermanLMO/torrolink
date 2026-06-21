# Memory

## Me
Laign (laigno@gmail.com / laign@ptorro.com). Founder of PTorro, building TorroLink — a QR-code profile platform for small businesses. Non-developer: I rely on Claude for all code, debugging, and deploys.

## Active Projects
| Name | What | Status |
|------|------|--------|
| **TorroLink** | QR code profile platform for SMBs | Live at torrolink.com, pre-launch |
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
| Payments | Stripe (currently on TEST keys — needs swap to live before launch) |
| Email | Resend (orders@torrolink.com) |
| Repo | C:\Laign\Torrolink + GitHub + Google Drive backup |

## Preferences
- No code in chat — always write to files
- Run `_fix_deploy.bat` to deploy (I run it, Claude updates the commit message first)
- Netlify env vars hold all secrets — never hardcode keys in files
- Full autonomous permission for code fixes during active sessions
→ Full technical context: memory/context/tech-stack.md
