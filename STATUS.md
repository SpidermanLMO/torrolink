# Torrolink — Session Status
Last updated: 2026-06-10 (post-restart save)

---

## ✅ ALL CODE COMPLETE — GitHub: SpidermanLMO/torrolink (push pending — run git commands below)

### Functions live in netlify/functions/
- `profile.js` — profile page at /p/:handle
- `qr.js` — QR redirect + scan logging at /q/:code
- `create-checkout.js` — Stripe Checkout for all plan combos
- `lead-router-agent.js` — lead form → Supabase + email
- `stripe-webhook.js` — payment → DB record → email QR or design portal link
- `design-portal.js` — customer logo upload + branded QR generation (GET/POST)
- `portal.js` — ⭐ NEW: customer login + profile editor at /portal
- `portal-save.js` — ⭐ NEW: API endpoint for portal saves (verifies Supabase JWT)
- `metrics.js` — ⭐ NEW: scan analytics + lead dashboard at /metrics/:handle

### Pricing
| Plan key | Price | Mode |
|----------|-------|------|
| qr-code | $28.33 | one-time |
| branding | $9.28 | one-time |
| custom-branding | $18.28 | one-time |
| qr-code-branding | $37.61 | one-time |
| qr-code-custom-branding | $46.61 | one-time |
| metrics | $10.28 | subscription/mo |

### Routing (netlify.toml)
- /p/:handle → profile
- /q/:code → qr
- /design/:code → design-portal
- /* → index.html

### package.json dependencies
@anthropic-ai/sdk, jimp, qrcode, resend, stripe, @supabase/supabase-js

---

## ❌ STILL NEEDED BEFORE LIVE

### 1. Netlify Environment Variables
Go to: app.netlify.com → torrolink site → Site configuration → Environment variables
```
SUPABASE_URL          = https://cayymmknkjpiybssiltu.supabase.co
SUPABASE_ANON_KEY     = [already set ✅]
SUPABASE_SERVICE_KEY  = [already set ✅]
STRIPE_SECRET_KEY     = sk_live_... (Stripe dashboard → Developers → API keys)
STRIPE_WEBHOOK_SECRET = whsec_... (see step 2 below)
RESEND_API_KEY        = re_... (resend.com dashboard)
DEPLOY_URL            = https://torrolink.com
```

### 2. Stripe Webhook Setup
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://torrolink.com/.netlify/functions/stripe-webhook`
3. Events: `checkout.session.completed`
4. Copy Signing secret → paste as `STRIPE_WEBHOOK_SECRET` in Netlify

### 3. Supabase — Schema additions + Storage bucket
Run in Supabase SQL Editor (copy from schema.sql, the ALTER TABLE section):
```sql
alter table customers add column if not exists metrics_active boolean default false;
alter table profiles add column if not exists branding_tier text;
alter table profiles add column if not exists branding_status text;
```
Create bucket: Storage → New bucket → Name: **qr-assets** → Public: false

### 4. Resend domain verification
- Verify torrolink.com at resend.com
- From address: hello@torrolink.com

---

## PUSH TO GITHUB (do this when you return)
```
cd TorroLink
git add .
git commit -m "Add portal, metrics dashboard, pre-checkout modal"
git push
```

## BUILT THIS SESSION (Tasks 10-12)
- Task 10: Pre-checkout modal — collects businessName before Stripe redirect (index.html + script.js + styles.css)
- Task 11: Customer portal — /portal with Supabase magic-link login + full profile editor (portal.js + portal-save.js)
- Task 12: Metrics dashboard — /metrics/:handle with scan chart, device/country breakdown, leads table + CSV export (metrics.js)
- New routes added to netlify.toml: /portal, /metrics/:handle
- schema.sql updated: bio + phone columns, Supabase Auth redirect URL instructions

## STILL NEEDED (config, not code)
### Supabase Auth URL config (portal + metrics magic links)
Go to: Supabase → Authentication → URL Configuration
- Site URL: https://torrolink.com
- Redirect URLs (add both):
  - https://torrolink.com/portal
  - https://torrolink.com/metrics/*

### New schema columns (run in Supabase SQL Editor)
```sql
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists phone text;
```

---

## KEY URLS
- GitHub: https://github.com/SpidermanLMO/torrolink
- Netlify: https://app.netlify.com/projects/torrolink/deploys
- Supabase: https://cayymmknkjpiybssiltu.supabase.co
- Live site: https://torrolink.com

## BACKUP
Google Drive (laign@ptorro.com → TorroLink folder):
- /Agent Functions/ → stripe-webhook.js, design-portal.js
- /Project Docs/ → package.json, netlify.toml, schema.sql

## SESSION NOTES
- Git + gh CLI now fully set up on this machine — use `git add . && git commit -m "..." && git push` from C:\Users\Laign\TorroLink
- netlify.toml ignore rule: only triggers deploy on code file changes (not schema.sql, STATUS.md)
- QR: teal #0a4d4d, 1200px, error correction H
- jimp compositing: logo at 22% of QR width, white bg pad 15%, Lanczos3 resize
- Customer self-approves their own branding design (no manual bottleneck)
- Supabase project URL: https://cayymmknkjpiybssiltu.supabase.co
