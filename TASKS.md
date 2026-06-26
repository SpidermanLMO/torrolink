# Tasks — PTorro Holdings LLC
_Updated: 2026-06-26 by Bruce (morning auto-refresh)_

---

## 🔴 Active Right Now

- [ ] **Social campaign — Day 5 (Friday)** — post today on TikTok @lmorros + IG @laign_o. Content package in `marketing/torrolink/social/content-package-week1.md`
- [ ] **Roofing visits — [STALE: Day 5, 0/15 visited]** — 15 targets identified, zero visits made since June 22. Today is ideal: 3–5 partner visits (realtors + insurance agents). See `memory/roofing-tracker.md` for names, addresses, pitches.

---

## 🟡 Up Next — PTorro Digital

- [ ] **DEPLOY PITCH SITES** — Run `ptorro-digital/deploy-pitch-sites.bat`. Needs Netlify token from app.netlify.com/user/applications. Takes 2 min. Then run `_fix_deploy.bat` to deploy pitch-lead.js (email handler).
- [ ] **Beachhead: Go pitch the 8 targets** — sites are live, pitch rundown at `ptorro-digital/pitch-rundown.html`. Open it on phone/tablet before you walk in.
- [ ] **Create Stripe products for PTorro Digital tiers** — Launch ($529.28 one-time), Growth ($749 one-time), Maintenance ($59/mo or $499/yr)
- [ ] **After first close** — update pitch site: swap `.netlify.app` domain to client's real `.com`, update OWNER_EMAIL in pitch-lead.js to client's actual email

---

## 🟡 Up Next — TorroLink

- [ ] **Review marketing content** — Claude built it, Laign reviews each:
  - `marketing/torrolink/email/cold-smb-sequence.md`
  - `marketing/torrolink/email/nurture-sequence.md`
  - `marketing/torrolink/email/launch-announcement.md`
  - `marketing/torrolink/social/content-package-week1.md`
  - `marketing/BIOS.md` — pick TikTok + IG bios

---

## ⏳ Waiting On Laign

- [ ] **Start roofing visits** — 5 days in, 0 visits. Schedule time this week to walk target offices. (See roofing-tracker.md for the full list with addresses.)
- [ ] **Fill [CITY] and [PHONE] in Waypoint email sequences** — 2 min fix, unlocks Huntress outreach
- [ ] **Connect laign@wproofs.com to Cowork** — needed for Waypoint email outreach via Cowork
- [ ] **Add phone number to ptorro-flyer.html** — then print at FedEx/Staples

---

## 🟢 Done This Week (2026-06-21 to 2026-06-26)

- [x] TorroLink launched — torrolink.com live, Stripe live (2026-06-21)
- [x] Portal sign-in fixed — apostrophe bug causing JS crash (2026-06-24)
- [x] Set-password page built and deployed — `/set-password` route live (2026-06-24)
- [x] No-cache headers added to portal + set-password — fixes mobile stale cache (2026-06-25)
- [x] netlify.toml truncation fixed — was missing `/success` and `/*` redirects (2026-06-25)
- [x] Feature A (Refer & Earn program) — live and verified ✅
- [x] Feature B (Partners tab + referral_partners DB) — live and verified ✅
- [x] stripe-webhook.js: `metrics_active = true` on `subscription.created` — deployed (2026-06-25)
- [x] reporting-scheduler.js: real Supabase subscriber data (was using mockSubscribers) — deployed (2026-06-25)
- [x] PTorro Digital — DUKE.md created, pricing set, pitch playbook written
- [x] PTorro Digital — Trades template built (`ptorro-digital/templates/trades/index.html`) ✅
- [x] PTorro Digital — Services template built (`ptorro-digital/templates/services/index.html`) ✅
- [x] PTorro Digital — Lead form function template built
- [x] Scarlett research — Pflugerville TX FM 1825 corridor recommended as first target
- [x] web-design-tracker.md created
- [x] Daily TASKS.md auto-refresh scheduled — runs every morning at 7am
- [x] Scarlett — 100-business target list → Excel (PTorro_Digital_Target_List.xlsx) ✅
- [x] Snake Eyes — 8 custom pitch sites built (all verified no-website targets) ✅
- [x] Mainframe — pitch-lead.js email function built (owner notification + customer auto-reply) ✅
- [x] Supabase pitch_pageviews table created — visitor tracking live ✅
- [x] 8 Netlify sites created with reserved URLs (ready for deploy-pitch-sites.bat) ✅

---

## 🗄️ Someday / Backlog

- [ ] Connect social accounts to Buffer/Meta Business Suite for scheduled posting
- [ ] Decide on Waypoint email tool (Instantly.ai, Mailchimp, or Gmail scheduling)
- [ ] Upload logo to roofing TorroLink profile
- [ ] Add Google Reviews link to roofing profile
- [ ] Draft PTorro Digital simple 1-page contract/terms
- [ ] Build Scarlett's full 5-business target list for Pflugerville (or delegate to Beachhead)

---

## TorroLink Status
_Quick health check_
- Site: torrolink.com — 🟢 LIVE
- Last deploy: 2026-06-25 (stripe-webhook + reporting-scheduler fixes)
- Open bugs: none known

## PTorro Digital Status
- Phase: Phase 2 — Ready to Pitch (8 custom sites built, deploy pending)
- 8 pitch sites: built ✅ · Netlify sites reserved ✅ · Deploy = run deploy-pitch-sites.bat
- Pitch rundown: `ptorro-digital/pitch-rundown.html` — open on phone before walking in
- Clients: 0 — first pitch this week

## Waypoint Roofing Status
- Outreach day: Day 5 (started 2026-06-22)
- Partners visited: 0 of 15 identified — **needs action this week**
- Pipeline: Empty — no referrals in yet

---

## Quick File Reference

| File | Purpose |
|------|---------|
| `DUKE.md` | PTorro Digital full business plan |
| `HAWK.md` | Waypoint Roofing agent |
| `BRUCE.md` | Master agent — all domains |
| `memory/web-design-tracker.md` | PTorro Digital client pipeline |
| `memory/roofing-tracker.md` | Waypoint referral partner pipeline (15 targets) |
| `ptorro-digital/templates/trades/` | Trades site template ✅ |
| `ptorro-digital/templates/services/` | Services site template ✅ |
| `ptorro-digital/sales/pitch-playbook.md` | Beachhead's full sales scripts |
| `ptorro-digital/functions/lead-form-template.js` | Client lead form Netlify function |
| `ptorro-flyer.html` | Flyer — needs phone number added, then print |
| `_fix_deploy.bat` | Git commit + push → Netlify deploy |

---

_Auto-refreshed by Bruce at 7am — 2026-06-26_
