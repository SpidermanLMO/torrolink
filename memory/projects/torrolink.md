# TorroLink

**What:** QR code profile platform for small businesses. Customer scans their QR sticker → lands on a live profile page with their name, bio, links, socials, gallery, and contact form.

**Live site:** https://torrolink.com  
**Portal:** https://torrolink.com/portal (customer login + profile editor)  
**Admin:** https://torrolink.com/admin (owner dashboard — needs ADMIN_PASSWORD env var)  
**Repo:** C:\Laign\Torrolink (also on GitHub, and Google Drive backup)

---

## Business Model
- One-time purchase of a QR code sticker ($10-15 range)
- Monthly add-ons: Metrics & Leads ($10.28/mo), possibly others
- Payments via Stripe checkout → webhook activates account
- Email confirmations via Resend (orders@torrolink.com)

## Current Status (as of June 17, 2026)
**Code:** Fully functional, deployed on Netlify  
**Sign In:** ✅ Fixed (was broken due to template literal escape bug — see tech context)  
**Stripe:** ⚠️ Still on TEST keys — must swap to `sk_live_` before real sales  
**Supabase migrations:** ⚠️ May not be run yet — see LAUNCH_CHECKLIST.md  
**Webhook:** ⚠️ Needs Stripe webhook endpoint configured  
**SPF/DKIM:** ⚠️ Email deliverability not yet verified via Resend  

## Launch Blocklist (must do before going to market)
1. Run Supabase SQL migrations (Steps 2 & 2b in LAUNCH_CHECKLIST.md)
2. Configure Stripe webhook + add STRIPE_WEBHOOK_SECRET to Netlify
3. Swap STRIPE_SECRET_KEY to `sk_live_...` in Netlify env vars
4. Verify SPF/DKIM in Resend dashboard
5. Set ADMIN_PASSWORD in Netlify env vars

## Tech Architecture

### Netlify Functions (netlify/functions/)
| Function | Purpose |
|----------|---------|
| portal.js | **THE BIG ONE** — 1935 lines, serves entire portal HTML + all client JS |
| profile.js | Public profile page (what visitors see) |
| portal-save.js | Saves profile edits to Supabase |
| portal-signup.js | Creates new customer account |
| portal-reset.js | Password reset flow |
| portal-reviews.js | Review management |
| stripe-webhook.js | Handles Stripe payment events |
| create-checkout.js | Creates Stripe checkout session |
| billing-agent.js | Manages subscription lifecycle |
| admin.js | Owner dashboard |
| qr.js | QR redirect handler |
| metrics.js | Profile view tracking |
| upload-media.js / delete-media.js / update-media.js / track-photo.js | Gallery/doc management |
| order-agent.js / onboarding-agent.js / qr-generator-agent.js | AI agent pipeline |
| reporting-agent.js / reporting-scheduler.js | Automated reports |

### Database (Supabase — project cayymmknkjpiybssiltu)
Key tables: `profiles`, `customers`, `reviews`, `profile_photos`, `profile_documents`  
Storage bucket: `qr-assets` (must be public)

### Environment Variables (in Netlify — NEVER in code)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY (swap to sk_live_ for production)
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- ADMIN_PASSWORD

## Features Built
- ✅ Customer portal: sign in, create account, password reset
- ✅ Profile editor: bio, links, socials, video, lead form config
- ✅ Theme picker: 15+ patterns (camo, leopard, tropical + sub-variants), color pickers, dark mode
- ✅ QR code customizer: dot styles, colors, download
- ✅ Photo gallery with view tracking and captions
- ✅ Document uploads (PDFs, flyers)
- ✅ Reviews tab (view + respond)
- ✅ Upgrade tab
- ✅ Admin dashboard: customer list, usage stats, grant free month, suspend
- ✅ AI agent team: onboarding, order processing, QR generation, reporting
