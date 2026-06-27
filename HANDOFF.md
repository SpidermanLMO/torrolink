# HANDOFF.md — Session Handoff Index
_Written: 2026-06-26 9:10 PM by Lucius_
_Read this at the start of every new session BEFORE doing anything else._

---

## ⚡ TL;DR — Where Things Stand Right Now

| Domain | Status | Next Action |
|--------|--------|-------------|
| **TorroLink** | 🟢 LIVE — 4 bugs just fixed + deployed | No open bugs. Monitor for new sign-ups. |
| **PTorro Digital** | 🟢 READY TO PITCH — 8 sites live | Beachhead walks in and pitches |
| **Waypoint Roofing** | 🟡 Day 5, 0 visits | Start referral partner visits TODAY |

---

## SESSION RECAP — What Was Done 2026-06-26

### Objective 1: Fix Deploy ✅ COMPLETE
- **Root cause:** Netlify's secret scanner was blocking builds because pitch-site HTML files (all 8) had `SUPABASE_URL` + anon key hardcoded at line 534 as client-side JS constants
- **Fix:** Added `SECRETS_SCAN_OMIT_PATHS = "ptorro-digital/"` to `[build.environment]` in `netlify.toml`
- **Also fixed:** `netlify.toml` was truncated by an Edit tool CIFS issue — rewrote it via Python script
- **Result:** Deployed at 9:10 PM — `main@4dd557b` — Published ✅
- **Note:** `_fix_deploy.bat` now runs correctly via File Explorer address bar trick (Ctrl+L → paste path → Enter). Windows shows it on monitor 2 (not captured in screenshots) but it runs fine.

### Objective 2: 4 TorroLink Portal Bug Fixes ✅ COMPLETE (fixes now live)
All fixes in `netlify/functions/portal.js` and `netlify/functions/profile.js`:

**Fix 1 — Referral partner duplicate submit** (`portal.js` ~line 1820)
- Double-submit guard on `savePartnerModal()`: button disabled immediately on click
- `_saveBtn.disabled = true` + text → 'Saving…', reset in finally block

**Fix 2 — Lead gen checkbox repeat** (`portal.js` line 1451)
- Added `document.getElementById('checkboxList').innerHTML = ''` before repopulating
- Was causing checkboxes to multiply on every `populateEditor()` call

**Fix 2b — Content blocks exponential growth** (`portal.js` ~line 1414)
- Added `contentList.innerHTML = ''` before rebuilding block list
- Had caused 11,760 content_blocks in DB for ptorro-holdings-llc — DB cleaned via Supabase SQL

**Fix 3 — 6MB profile crash** (`profile.js` line 193)
- `safeBgImage` check: only embeds background-image if value starts with `https?://`
- Rejects base64 data URLs that were overloading Netlify's 6MB response limit

**Fix 4 — QR code null guard** (`portal.js`)
- If `p.code` is null, falls back to `origin + /p/ + p.handle` instead of crashing

### Objective 3: Pitch Site Audit ✅ COMPLETE
All 8 pitch sites verified fully functional:
- **Nav links:** Anchor links (#home, #about, #services, #gallery, #faq, #contact) — all work
- **Phone links:** 5x `href="tel:..."` per site — all work  
- **Lead form:** `submitForm()` POSTs to `https://torrolink.netlify.app/.netlify/functions/pitch-lead` — CORS OK, emails laign@ptorro.com + auto-replies to customer

---

## 🏗️ TorroLink Tech State

### Architecture
- **Hosting:** Netlify — torrolink.com (also torrolink.netlify.app)
- **Functions:** `netlify/functions/` — 36 serverless functions
- **DB/Auth:** Supabase — project `cayymmknkjpiybssiltu`
- **Payments:** Stripe LIVE (sk_live_ active)
- **Email:** Resend — hello@, orders@, billing@, leads@, hawk@torrolink.com all active
- **Repo:** GitHub — SpidermanLMO/torrolink (main branch → auto-deploy to Netlify)

### Key Files
| File | Lines | What It Does |
|------|-------|--------------|
| `netlify/functions/portal.js` | ~2700 | Full portal UI (HTML + JS) — customer login, editor, referrals, QR |
| `netlify/functions/profile.js` | ~1450 | Public profile renderer — /p/:handle |
| `netlify/functions/portal-save.js` | ~480 | Saves profile data to Supabase |
| `netlify/functions/stripe-webhook.js` | ~1080 | Stripe event handler |
| `netlify/functions/reporting-scheduler.js` | ~480 | Scheduled metrics + email reports |
| `netlify/functions/pitch-lead.js` | ~200 | Lead form handler for pitch sites |
| `netlify.toml` | 135 | Build config + redirects + headers + SECRETS_SCAN_OMIT_PATHS |

### CIFS Rule (CRITICAL)
**NEVER use Edit tool on large JS files.** Use Python scripts via bash instead.
- Edit tool corrupts files via NTFS/CIFS mount (truncation, encoding issues)
- Safe pattern: `python3 -c "content = ...; f.write(content)"`
- netlify.toml and small config files: Edit tool is OK if <50 lines and simple content

### Deploy Process
1. Update `_fix_deploy.bat` commit message to describe the change
2. Run `_fix_deploy.bat` via File Explorer address bar trick:
   - Click File Explorer taskbar icon → thumbnails appear → click Torrolink thumbnail
   - Ctrl+L (focus address bar) → Ctrl+A → Ctrl+V (paste bat path) → Enter
   - The cmd window runs on monitor 2 (not visible on primary) but it works
3. Wait 2-3 min → Netlify auto-deploys from GitHub push
4. Verify at app.netlify.com/projects/torrolink/deploys

---

## 🎯 PTorro Digital State

### What's Built
- 8 custom pitch sites (one per target business), all live at torrolink.netlify.app subdirectories
- `pitch-lead.js` — lead form handler: emails laign@ptorro.com + customer auto-reply
- `pitch-data.md` — website ROI stats for sales conversations (real cited data)
- `pitch-rundown.html` — quick-reference for walking into a pitch
- `ptorro-digital/sales/pitch-playbook.md` — full scripts + objection handling

### Pitch Sites (all 8)
All deployed on `https://torrolink.netlify.app/.netlify/functions/pitch-lead` as lead endpoint:
- 4 A Plumber (4-a-plumber)
- 5-Star AC & Heating (5-star-ac-heating)
- Allison Electric (allison-electric)
- Capital City HVAC (capital-city-hvac)
- Independent Electric Hutto (independent-electric-hutto)
- Pinar Fence Installers (pinar-fence-installers)
- Revive Electric Hutto (revive-electric-hutto)
- The Plumber Gary (the-plumber-gary)

### Pricing
- **Launch:** $529.28 one-time (4-page site + lead form + QR code TorroLink profile)
- **Growth:** $749 one-time (above + booking + reviews widget)
- **Maintenance:** $59/mo or $499/yr

---

## 🏠 Waypoint Roofing State

- **Profile:** torrolink.com/p/ptorro-holdings-llc
- **Email:** laign@wproofs.com (not yet connected to Cowork)
- **Referral targets:** 15 identified in `memory/roofing-tracker.md` (realtors, insurance agents, home inspectors in Wells Branch / North Austin)
- **Pipeline:** 0 leads, 0 visits — Day 5 with no activity
- **Outreach emails:** Built in `marketing/waypoint/email/` — needs [CITY] and [PHONE] filled in

---

## 📌 Known Issues / Gotchas for Next Session

1. **CIFS mount file mode noise** — git diff from Linux shows `100644 → 100755` mode changes on every file. This is CIFS artifact, not real content changes. Safe to ignore.

2. **Git staging from Linux** — `git status` from bash shows many "deleted" staged files alongside "untracked" files. This is CIFS confusion. Do NOT run `git add -A` from Linux — it will delete pitch sites from the repo. Always deploy via `_fix_deploy.bat` from Windows.

3. **File Explorer on monitor 2** — All File Explorer windows open on the secondary monitor (laptop screen). They don't appear in screenshots from the primary monitor (external PHL 276E9Q display). The address bar keyboard trick (Ctrl+L → paste → Enter) still works because keyboard focus transfers.

4. **netlify.toml fragility** — Any Edit tool write to netlify.toml risks truncation via CIFS. Use Python script to rewrite it if changes needed.

5. **Content blocks DB** — ptorro-holdings-llc profile was cleaned (2 content_blocks now). Fix 2b prevents future growth. If any other profiles show runaway growth, SQL fix: `UPDATE profiles SET content_blocks = '[]'::jsonb WHERE id = '...'` via Supabase MCP.

6. **pitch-lead.js CORS** — `Access-Control-Allow-Origin: '*'` is intentional (pitch sites are on different domains). Don't "fix" this.

---

## 🚀 What To Do Next Session

### Priority 1: Roofing (Revenue generating NOW)
Read `HAWK.md` → `memory/roofing-tracker.md` → Go make 3-5 referral partner visits

### Priority 2: PTorro Digital (Revenue generating SOON)
Read `DUKE.md` → `ptorro-digital/pitch-rundown.html` → Beachhead goes pitching

### Priority 3: TorroLink monitoring
- Check Stripe for any new sign-ups
- Check Supabase for any new profiles/users
- No open bugs as of 2026-06-26 9:10 PM

---

## 📂 File Map (critical files only)

```
C:\Laign\Torrolink\
├── CLAUDE.md              ← Project instructions (read every session)
├── TASKS.md               ← This task list
├── HANDOFF.md             ← This file
├── BRUCE.md               ← Master agent
├── HAWK.md                ← Waypoint Roofing agent
├── EL_CHAPPO.md           ← TorroLink product agent
├── LUCIUS.md              ← Tech + QA agent
├── DUKE.md                ← PTorro Digital (web design biz)
├── _fix_deploy.bat        ← Deploy trigger
├── netlify.toml           ← Build config (has SECRETS_SCAN_OMIT_PATHS)
├── netlify/functions/
│   ├── portal.js          ← Portal UI (4 bugs fixed 2026-06-26)
│   ├── profile.js         ← Profile renderer (6MB fix 2026-06-26)
│   └── pitch-lead.js      ← Lead form handler for pitch sites
├── ptorro-digital/
│   ├── pitch-data.md      ← Website ROI stats for pitches
│   ├── pitch-rundown.html ← Pitch quick-ref
│   ├── pitch-sites/       ← 8 custom sites (all functional)
│   └── sales/pitch-playbook.md
└── memory/
    ├── projects/torrolink.md
    ├── roofing-tracker.md
    └── web-design-tracker.md
```

---

_Written by Lucius at session end — 2026-06-26 9:10 PM_
_All 3 objectives from this session are COMPLETE._
