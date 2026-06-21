# Glossary

Full decoder ring for TorroLink / PTorro shorthand.

## Project Terms
| Term | Meaning |
|------|---------|
| TorroLink | The QR code profile product (torrolink.com) |
| PTorro | Parent company / brand (laign@ptorro.com) |
| portal | torrolink.com/portal — customer login + editor |
| admin | torrolink.com/admin — owner-only dashboard |
| profile | A customer's public-facing QR landing page |
| the big file | portal.js (1935 lines — the entire portal in one Netlify function) |

## People
| Name | Who |
|------|-----|
| Laign | The owner/founder. laigno@gmail.com / laign@ptorro.com. Non-developer. |

## Acronyms & Shorthand
| Term | Meaning |
|------|---------|
| SMB | Small/medium business (TorroLink's target customer) |
| QR | QR code (the physical sticker product) |
| CIFS | Windows filesystem accessed from Linux sandbox — Edit tool unreliable on large files |
| env var | Environment variable (stored in Netlify, never in code) |
| Netlify | Hosting platform — runs serverless functions, auto-deploys from GitHub |
| Supabase | Backend: auth + Postgres database |

## File Shortcuts
| Reference | Path |
|-----------|------|
| _fix_deploy.bat | C:\Laign\Torrolink\_fix_deploy.bat |
| portal.js | C:\Laign\Torrolink\netlify\functions\portal.js |
| LAUNCH_CHECKLIST.md | C:\Laign\Torrolink\LAUNCH_CHECKLIST.md |
| workspace (bash) | /sessions/tender-stoic-dirac/mnt/Torrolink/ |

## Common Commands
| What | How |
|------|-----|
| Deploy code | User runs _fix_deploy.bat (Claude updates commit message first) |
| Check for errors | Chrome MCP → navigate portal → read_console_messages |
| Check functions loaded | Chrome MCP javascript_tool: typeof signInWithPassword |
| Edit large file | Python script via bash (read → string replace → write) |
| Verify syntax | node --check on simulated template output |
