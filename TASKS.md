# Tasks — PTorro Holdings LLC
_Updated: 2026-06-27 by Bruce (morning auto-refresh)_

---

## 🔴 Active Right Now

- [ ] **[STALE] Roofing visits — Day 6, 0/15 visited** — Zero visits since outreach launched June 22. 15 targets in `memory/roofing-tracker.md` with names, addresses, pitches ready. Monday is the move. 3–5 partners per day: realtors first, then insurance agents.
- [ ] **[STALE] Beachhead: Go pitch the 8 targets** — All 8 pitch sites built, deployed, functional. No pitches made. `ptorro-digital/pitch-rundown.html` on phone/tablet → walk in this week.
- [ ] **Social post — check Day 5 (Friday)** — Confirm Friday's TikTok @lmorros + IG @laign_o post happened. If missed, post today. Content at `marketing/torrolink/social/content-package-week1.md`. Monday = Week 2 begins.

---

## 🟡 Up Next

- [ ] **Create Stripe products for PTorro Digital tiers** — Launch ($529.28), Growth ($693.88), Maintenance ($59/mo or $499/yr). Needed before first close.
- [ ] **After first PTorro Digital close** — update pitch site: swap `.netlify.app` domain to client's real `.com`, update OWNER_EMAIL in pitch-lead.js.
- [ ] **Review marketing content** — Claude built these, Laign approves before publishing: `email/cold-smb-sequence.md`, `email/nurture-sequence.md`, `email/launch-announcement.md`, `social/content-package-week1.md`, `BIOS.md` (pick TikTok + IG bios).
- [ ] **Get first paying TorroLink customer** — Site is clean, all bugs fixed. Push via social or outreach.

---

## ⏳ Waiting On Laign

- [ ] **Start roofing visits** — 6 days in, 0 visits. Laign must walk in. See `memory/roofing-tracker.md` for 15 targets with full addresses.
- [ ] **Fill [CITY] and [PHONE] in Waypoint email sequences** — 2-min fix that unlocks Huntress email outreach.
- [ ] **Connect laign@wproofs.com to Cowork** — needed for Waypoint Roofing email outreach via Cowork.
- [ ] **Add phone number to ptorro-flyer.html** — then print at FedEx/Staples.

---

## 🟢 Done This Week (2026-06-21 to 2026-06-27)

- [x] TorroLink launched — torrolink.com live, Stripe live (2026-06-21)
- [x] Portal sign-in fixed — apostrophe bug causing JS crash (2026-06-24)
- [x] Set-password page built and deployed — `/set-password` route live (2026-06-24)
- [x] No-cache headers added to portal + set-password — fixes mobile stale cache (2026-06-25)
- [x] Feature A (Refer & Earn program) — live and verified ✅
- [x] Feature B (Partners tab + referral_partners DB) — live and verified ✅
- [x] stripe-webhook.js: `metrics_active = true` on `subscription.created` — deployed (2026-06-25)
- [x] reporting-scheduler.js: real Supabase subscriber data — deployed (2026-06-25)
- [x] PTorro Digital — DUKE.md created, pricing set, pitch playbook written
- [x] PTorro Digital — 8 custom pitch sites built (real photos, mobile-first, full nav) ✅
- [x] PTorro Digital — pitch-lead.js email function live (owner + customer auto-reply) ✅
- [x] Scarlett — 100-business target list → Excel ✅
- [x] Daily TASKS.md auto-refresh scheduled — runs every morning at 7am
- [x] Fix 4 TorroLink portal bugs (2026-06-26) ✅ — referral dup guard, checkbox list clear, 6MB base64 crash fix, QR null guard
- [x] DB cleanup: content_blocks truncated 11,760 duplicate entries → 2 ✅
- [x] Netlify deploy unblocked — SECRETS_SCAN_OMIT_PATHS added for ptorro-digital/, deployed 9:10 PM (2026-06-26) ✅
- [x] Pitch site audit — all 8 sites: nav, phone links (5 per site), lead form POST all verified ✅

---

## 🗄️ Someday / Backlog

- [ ] Connect social accounts to Buffer/Meta Business Suite for scheduled posting
- [ ] Decide on Waypoint email tool (Instantly.ai, Mailchimp, or Gmail scheduling)
- [ ] Upload logo to Waypoint roofing TorroLink profile
- [ ] Add Google Reviews link to roofing profile
- [ ] Draft PTorro Digital simple 1-page contract/terms
- [ ] Build Scarlett's full 5-business target list for Pflugerville

---

## TorroLink Status
_Quick health check_
- Site: torrolink.com — 🟢 LIVE
- Last deploy: 2026-06-26 9:10 PM — commit 4dd557b (4 portal bugs fixed + pitch-site secret scan fix)
- Open bugs: none known
- Portal: checkboxList repeat fixed ✅ · referral dup fixed ✅ · 6MB crash fixed ✅ · QR guard added ✅

## PTorro Digital Status
- Phase: Phase 2 — **READY TO PITCH** (8 custom sites live + functional, lead emails working)
- Templates built: 8 specific pitch sites built; vertical templates (trades/services) still pending
- Pitches made: 0 — Beachhead has not walked in yet
- Clients: 0 — first sale pending
- Pitch rundown: `ptorro-digital/pitch-rundown.html` — open on phone before walking in

## Waypoint Roofing Status
- Outreach day: Day 6 (started 2026-06-22)
- Partners visited: 0 of 15 identified — **critical: no visits in 6 days**
- Pipeline: Empty — no referrals in yet
- All 15 targets in `memory/roofing-tracker.md` with addresses + contact info

---

## Quick File Reference

| File | Purpose |
|------|---------|
| `DUKE.md` | PTorro Digital full business plan |
| `HAWK.md` | Waypoint Roofing agent |
| `BRUCE.md` | Master agent — all domains |
| `memory/web-design-tracker.md` | PTorro Digital client pipeline |
| `memory/roofing-tracker.md` | Waypoint referral partner pipeline (15 targets) |
| `ptorro-digital/sales/pitch-playbook.md` | Beachhead's full sales scripts |
| `ptorro-digital/pitch-data.md` | Website ROI statistics for pitches |
| `ptorro-digital/pitch-rundown.html` | Quick-reference before walking in |
| `ptorro-flyer.html` | Flyer — needs phone number added, then print |
| `_fix_deploy.bat` | Git commit + push → Netlify deploy |

---

Auto-refreshed by Bruce at 7am — 2026-06-27
