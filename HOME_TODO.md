# HOME TO-DO LIST
### Everything Laign and Claude knock out together when Laign gets home
Last updated: 2026-06-20

---

## 🔴 PRIORITY 1 — TorroLink Launch Blockers (do these first)
*Site is deployed but not live for real customers until all 6 are done*

| # | Task | Where | Est. Time |
|---|------|--------|-----------|
| 1 | Run Supabase SQL migrations | app.supabase.com → SQL Editor | 5 min |
| 2 | Create Stripe live webhook endpoint | dashboard.stripe.com → Webhooks | 5 min |
| 3 | Add STRIPE_WEBHOOK_SECRET to Netlify | app.netlify.com → Site env vars | 2 min |
| 4 | Swap STRIPE_SECRET_KEY to sk_live_ | app.netlify.com → Site env vars | 2 min |
| 5 | Set ADMIN_PASSWORD in Netlify env vars | app.netlify.com → Site env vars | 2 min |
| 6 | Verify SPF/DKIM for orders@torrolink.com | resend.com → Domain settings | 5 min |

**Total: ~21 minutes. Once done, TorroLink is live.**

---

## 🔴 PRIORITY 2 — Email Setup (needed before any campaigns send)

| # | Task | Where | Est. Time |
|---|------|--------|-----------|
| 7 | Add hello@torrolink.com as verified sender in Resend | resend.com → Domains | 3 min |
| 8 | Connect laign@wproofs.com to Cowork | Cowork app → Settings → Connected accounts | 3 min |

---

## 🟡 PRIORITY 3 — Marketing Review & Approve (Claude built it, Laign reviews)

| # | Task | File to Review |
|---|------|----------------|
| 9 | Review TorroLink cold SMB email sequence | marketing/torrolink/email/cold-smb-sequence.md |
| 10 | Review TorroLink nurture sequence (new signups) | marketing/torrolink/email/nurture-sequence.md |
| 11 | Review TorroLink launch announcement email | marketing/torrolink/email/launch-announcement.md |
| 12 | Review Waypoint RE agent email sequence | marketing/waypoint/email/re-agent-sequence.md |
| 13 | Review Waypoint insurance agent sequence | marketing/waypoint/email/insurance-agent-sequence.md |
| 14 | Review Waypoint home inspector outreach | marketing/waypoint/email/home-inspector-sequence.md |
| 15 | Review Waypoint mortgage lender sequence | marketing/waypoint/email/mortgage-lender-sequence.md |
| 16 | Review TorroLink social content package (Week 1) | marketing/torrolink/social/content-package-week1.md |
| 17 | Review Waypoint social content package (Week 1) | marketing/waypoint/social/content-package-week1.md |
| 18 | Pick social media bios (TikTok + Instagram) | marketing/BIOS.md |

**For each: Laign reads → edits if needed → marks STATUS: Approved → content goes live**

---

## 🟡 PRIORITY 4 — Fill In Placeholders

All Waypoint content has two placeholders that need Laign's input:

| Placeholder | Needed For |
|-------------|-----------|
| **[CITY]** | All Waypoint email sequences + social posts |
| **[PHONE]** | All Waypoint email sequences — what number gets replies? |

Takes 2 minutes. Claude fills them in once Laign confirms.

---

## 🔴 PRIORITY 1b — Additional Code Fix (discovered during agent review)

| # | Task | Why |
|---|------|-----|
| 19b | Wire Stripe webhook to update metrics_active in Supabase on new subscription | Right now a customer can pay and still not see their analytics dashboard — Stripe fires but Supabase doesn't get updated automatically. Lucius has the fix ready. |

---

## 🟡 PRIORITY 5 — Code Fix (deploy when ready)

| # | Task | How |
|---|------|-----|
| 19 | Apply reporting-scheduler.js fix | Review LUCIUS_FIX_reporting-scheduler.md, then Claude runs LUCIUS_apply_scheduler_fix.py, then syntax check, then Laign runs _fix_deploy.bat |

---

## 🟢 PRIORITY 6 — Social Media (quick wins)

| # | Task | Time |
|---|------|------|
| 20 | Add bio to TikTok @lmorros | 2 min — pick from BIOS.md |
| 21 | Add bio to Instagram @laign_o | 2 min — pick from BIOS.md |
| 22 | Add TorroLink link to both bios | Included with bio update |

---

## 🟢 PRIORITY 7 — Future (not urgent today)

- Connect social media accounts to Buffer or Meta Business Suite for scheduled posting
- Decide on email campaign tool for laign@wproofs.com outreach (Instantly.ai, Mailchimp, or Gmail scheduling)
- Print ptorro-flyer.html — need to add Laign's phone number first
- Wire video editing workflow (see next section)

---

## Video Editing (addressed separately)
Laign asked about video editing — see Claude's response in chat. Short version: native video editing isn't a direct capability, but there's a solid workflow using CapCut (free, on phone) for quick cuts, and Claude can write detailed edit instructions for any video Laign shoots.

---

*This file lives at C:\Laign\Torrolink\HOME_TODO.md — update it as items get done*
