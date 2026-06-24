# Tasks
_PTorro Holdings LLC — Laign Orros_
_Updated: 2026-06-23 (overnight build)_

---

## Active

- [ ] **Execute 30-day social campaign** — Vicki Vale has content ready. Post daily on TikTok @lmorros + IG @laign_o. Started 2026-06-21 (Day 3 today)
- [ ] **Build roofing referral partner pipeline** — 15 targets in memory/roofing-tracker.md, none visited yet. Target: 20 new contacts/week for 30 days
- [ ] **Get first paying TorroLink customer** — door hangers, truck QR, job site outreach

---

## Waiting On

- [ ] **Review + approve marketing content** — Claude built it, Laign reviews each:
  - [ ] `marketing/torrolink/email/cold-smb-sequence.md`
  - [ ] `marketing/torrolink/email/nurture-sequence.md`
  - [ ] `marketing/torrolink/email/launch-announcement.md`
  - [ ] `marketing/waypoint/email/re-agent-sequence.md`
  - [ ] `marketing/waypoint/email/insurance-agent-sequence.md`
  - [ ] `marketing/waypoint/email/home-inspector-sequence.md`
  - [ ] `marketing/waypoint/email/mortgage-lender-sequence.md`
  - [ ] `marketing/torrolink/social/content-package-week1.md`
  - [ ] `marketing/waypoint/social/content-package-week1.md`
  - [ ] `marketing/BIOS.md` — pick TikTok + IG bios
- [ ] **Fill placeholders in Waypoint content** — confirm [CITY] and [PHONE] so Claude can fill all sequences (2 min)
- [ ] **Connect laign@wproofs.com to Cowork** — needed for Waypoint email outreach via Gmail MCP

---

## Someday

- [ ] **Apply reporting-scheduler.js fix** — review LUCIUS_FIX_reporting-scheduler.md, run LUCIUS_apply_scheduler_fix.py, syntax check, then deploy
- [ ] **Fix metrics_active Stripe webhook** — Stripe fires on new subscription but Supabase doesn't update metrics_active. Lucius has fix ready (task 19b in HOME_TODO.md)
- [ ] **Connect social accounts to Buffer or Meta Business Suite** — for scheduled posting
- [ ] **Decide on Waypoint email tool** — Instantly.ai, Mailchimp, or Gmail scheduling for laign@wproofs.com outreach
- [ ] **Print ptorro-flyer.html** — add Laign's phone number first, then print at FedEx/Staples
- [ ] **Upload logo to roofing profile** — torrolink.com/portal → Profile tab → makes it look professional
- [ ] **Add Google Reviews link to roofing profile** — portal → Links tab

---

## Waiting On — Deploy (ready now)

- [ ] **Run `_fix_deploy.bat`** — commit message updated. Deploys:
  - Feature A: Affiliate Refer & Earn program (scaling discounts up to FREE)
  - Feature B: Business Referral Partner Tracker (portal Partners tab now has live DB tables)
  - New portal "🎁 Refer & Earn" tab — referral link, progress bar, tier table
  - Supabase migration already applied ✅

After deploy: open `/portal` and confirm Partners tab + Refer & Earn tab both work.

---

## Done

- [x] ~~TorroLink launched~~ (2026-06-21) — torrolink.com live, Stripe live, all env vars set
- [x] ~~Portal (create account, sign in, forgot password)~~ — all working
- [x] ~~30-day marketing campaign built~~ — email sequences, social content, strategy docs all created
- [x] ~~Waypoint Roofing profile live~~ — torrolink.com/p/ptorro-holdings-llc
- [x] ~~ptorro-flyer.html created~~ — door hangers + business cards ready to print (add phone #)
- [x] ~~Lead notification emails fixed~~ — go to laigno@gmail.com with checkboxes filled
- [x] ~~Referral partner prospect list built~~ — 15 targets in memory/roofing-tracker.md (2026-06-22/23)
- [x] ~~Feature A: Affiliate referral program built~~ (2026-06-23 overnight) — refer-earn.js, stripe-webhook.js, portal.js, script.js, create-checkout.js all updated. Supabase migration applied.
- [x] ~~Feature B: Business Referral Partner Tracker built~~ (2026-06-23 overnight) — referral_partners + referral_logs tables live in Supabase. Partners tab in portal was already coded, now has backing DB.
