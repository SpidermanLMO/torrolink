# Tasks — PTorro Holdings LLC
_Updated: 2026-06-25 (overnight build by Bruce + full agent team)_

---

## 🔴 Active Right Now

- [ ] **Run `_fix_deploy.bat`** — commit message updated. Deploys:
  - `stripe-webhook.js`: `metrics_active = true` now set on `subscription.created` event
  - `reporting-scheduler.js`: now pulls real Supabase subscriber data (was using mockSubscribers = [])
  - _After deploy: confirm no Netlify function errors in logs_

---

## 🟡 Up Next — PTorro Digital

- [ ] **Beachhead: Walk FM 1825 corridor, Pflugerville TX 78660** — confirm 5 real businesses with no/bad websites. Note: business name, address, vertical. Report back so Snake Eyes can mock-build.
- [ ] **Snake Eyes: Mock-build 5 sites** — once Beachhead has the target list. Use trades or services template. Fill in real business name, phone, and services.
- [ ] **Create Stripe products for PTorro Digital tiers** — Launch ($529.28 one-time), Growth ($749 one-time), Monthly Maintenance ($59/mo), Annual Maintenance ($499/yr)
- [ ] **Beachhead pitches + closes** — laptop/tablet in hand, site already built

---

## 🟡 Up Next — TorroLink

- [ ] **Review marketing content** — Claude built it, Laign reviews each:
  - `marketing/torrolink/email/cold-smb-sequence.md`
  - `marketing/torrolink/email/nurture-sequence.md`
  - `marketing/torrolink/email/launch-announcement.md`
  - `marketing/torrolink/social/content-package-week1.md`
  - `marketing/BIOS.md` — pick TikTok + IG bios
- [ ] **Execute 30-day social campaign** — Post daily TikTok @lmorros + IG @laign_o. Started 2026-06-21 (Day 4 today).
- [ ] **Build roofing referral partner pipeline** — 15 targets in memory/roofing-tracker.md, none visited yet

---

## ⏳ Waiting On Laign

- [ ] **Approve + run `_fix_deploy.bat`** — two TorroLink fixes ready to ship (see Active above)
- [ ] **Fill [CITY] and [PHONE] in Waypoint email sequences** — 2 min, unlocks Huntress outreach
- [ ] **Connect laign@wproofs.com to Cowork** — needed for Waypoint email outreach
- [ ] **Add phone number to ptorro-flyer.html** — then print at FedEx/Staples
- [ ] **Beachhead field recon** — walk FM 1825, Pflugerville (see Up Next above)
- [ ] **Approve PTorro Digital pricing** — $529.28 Launch | $749 Growth | $59/mo | $499/yr — locked in DUKE.md, confirm or adjust

---

## 🟢 Done This Week (2026-06-21 to 2026-06-25)

- [x] TorroLink launched — torrolink.com live, Stripe live (2026-06-21)
- [x] Portal sign-in fixed — apostrophe bug causing JS crash (2026-06-24)
- [x] Set-password page built and deployed — `/set-password` route live (2026-06-24)
- [x] No-cache headers added to portal + set-password — fixes mobile stale cache (2026-06-25)
- [x] netlify.toml truncation fixed — was missing `/success` and `/*` redirects (2026-06-25)
- [x] Feature A (Refer & Earn program) — live and verified ✅
- [x] Feature B (Partners tab + referral_partners DB) — live and verified ✅
- [x] **PTorro Digital — full overnight build:**
  - [x] DUKE.md created — full business plan, GI Joe agent roster, competitive research
  - [x] Pricing finalized — $529.28 Launch | $749 Growth | $59/mo | $499/yr annual
  - [x] Trades template built — `ptorro-digital/templates/trades/index.html`
  - [x] Services template built — `ptorro-digital/templates/services/index.html`
  - [x] Lead form function template — `ptorro-digital/functions/lead-form-template.js`
  - [x] Pitch playbook written (Roadblock) — `ptorro-digital/sales/pitch-playbook.md`
  - [x] Scarlett research done — Pflugerville TX FM 1825 corridor recommended
  - [x] Web design tracker created — `memory/web-design-tracker.md`
- [x] stripe-webhook.js — metrics_active fix prepared (deploy pending)
- [x] reporting-scheduler.js — real subscriber data fix prepared (deploy pending)
- [x] Daily TASKS.md auto-refresh scheduled — runs every morning at 7am

---

## 🗄️ Someday / Backlog

- [ ] Connect social accounts to Buffer/Meta Business Suite for scheduled posting
- [ ] Decide on Waypoint email tool (Instantly.ai, Mailchimp, or Gmail scheduling)
- [ ] Upload logo to roofing TorroLink profile
- [ ] Add Google Reviews link to roofing profile
- [ ] Build `memory/web-design-tracker.md` client section (first clients pending)
- [ ] Build Scarlett's full 5-business target list for Pflugerville
- [ ] Draft PTorro Digital simple 1-page contract/terms

---

## System Status

| System | Status |
|--------|--------|
| torrolink.com | 🟢 LIVE |
| Stripe payments | 🟢 LIVE (sk_live active) |
| Supabase DB | 🟢 LIVE — all tables including referral_partners, referral_logs |
| Resend email | 🟢 LIVE — all domains verified |
| Feature A (Refer & Earn) | 🟢 DEPLOYED + VERIFIED |
| Feature B (Partners Tab) | 🟢 DEPLOYED + VERIFIED |
| metrics_active webhook fix | 🟡 BUILT — needs deploy |
| reporting-scheduler fix | 🟡 BUILT — needs deploy |
| PTorro Digital | 🟡 BUILDING — templates + pitch playbook ready, no sites sold yet |
| Waypoint Roofing outreach | 🟡 DAY 3 — 15 targets identified, 0 visits made |

---

## Quick File Reference

| File | Purpose |
|------|---------|
| `DUKE.md` | PTorro Digital full business plan |
| `HAWK.md` | Waypoint Roofing agent |
| `BRUCE.md` | Master agent — all domains |
| `memory/web-design-tracker.md` | PTorro Digital client pipeline |
| `memory/roofing-tracker.md` | Waypoint referral partner pipeline |
| `memory/scarlett-target-research.md` | First target neighborhood — Pflugerville TX |
| `ptorro-digital/templates/trades/` | Trades site template (plumber/HVAC/electrical) |
| `ptorro-digital/templates/services/` | Services site template (salon/cleaning/lawn) |
| `ptorro-digital/sales/pitch-playbook.md` | Beachhead's full sales scripts |
| `ptorro-digital/functions/lead-form-template.js` | Client lead form Netlify function |
| `_fix_deploy.bat` | Git commit + push → Netlify deploy |
