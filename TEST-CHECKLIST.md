# Torrolink — End-to-End Test Checklist

Run this checklist before promoting the site to real customers.
Use Stripe's **test mode** with card number `4242 4242 4242 4242` (any future expiry, any CVC).

---

## 1. Homepage

- [ ] torrolink.com loads without errors
- [ ] Pricing section shows all 5 plans with correct prices
- [ ] Competitor comparison table renders correctly
- [ ] Clicking "Get My QR Code" (any plan) opens the pre-checkout modal
- [ ] Modal shows correct plan label
- [ ] Submitting empty business name shows validation error
- [ ] Entering business name + clicking "Continue to Payment" redirects to Stripe Checkout

---

## 2. Stripe Checkout (test mode)

- [ ] Stripe Checkout page loads with correct price
- [ ] Business name is passed as metadata (visible in Stripe dashboard)
- [ ] Test card `4242 4242 4242 4242` processes successfully
- [ ] After payment, redirects to torrolink.com/success.html

---

## 3. Stripe Webhook → QR Delivery

- [ ] Check Netlify function logs (Functions tab) — `stripe-webhook` was called
- [ ] Check Supabase — new row in `customers` table with correct email
- [ ] Check Supabase — new row in `profiles` table with handle + code
- [ ] Check email inbox — QR code delivery email received from hello@torrolink.com
- [ ] QR code image in email is valid and scannable

---

## 4. QR Code Scan

- [ ] Scan QR code with phone camera
- [ ] Redirects to torrolink.com/p/:handle (profile page)
- [ ] Profile page loads with business name
- [ ] Check Supabase — new row in `scan_events` table
- [ ] Scan logged with device type and timestamp

---

## 5. Customer Portal

- [ ] Go to torrolink.com/portal
- [ ] Login screen appears
- [ ] Enter test customer email → "Send Sign-In Link" button works
- [ ] Check email — magic link received with Torrolink branding
- [ ] Click magic link → redirected back to /portal and logged in
- [ ] Business name pre-filled from database
- [ ] Edit business name + tagline → Save Changes → success message
- [ ] Refresh page → changes persisted
- [ ] Upload logo image → preview appears
- [ ] Save → logo appears on profile page at /p/:handle
- [ ] Upload headshot → preview appears, owner name field works
- [ ] Add a custom link → save → appears on profile page
- [ ] Add social media URL → save → appears on profile page
- [ ] Open Themes tab → pattern swatches render
- [ ] Select a pattern → color picker changes swatch preview
- [ ] Toggle dark mode → preview link shows dark profile
- [ ] Save theme → profile page reflects new theme
- [ ] Enable lead form → checkboxes editor appears
- [ ] Add 2 checkbox options → save → lead form appears on profile page
- [ ] QR Code tab → shows QR image + profile URL
- [ ] Sign out → returns to login screen

---

## 6. Profile Page

- [ ] /p/:handle loads correctly
- [ ] Business name, tagline display
- [ ] Logo carousel shows logo (swipe if headshot also uploaded)
- [ ] Custom links appear and are clickable
- [ ] Social media buttons appear
- [ ] Theme/colors match what was set in portal
- [ ] Dark mode works if enabled
- [ ] Lead form appears if enabled
- [ ] Submit lead form → check Supabase `leads` table for new row
- [ ] Page is mobile-responsive

---

## 7. Metrics Dashboard (metrics plan only)

- [ ] Go to torrolink.com/metrics/:handle
- [ ] Login screen appears (same magic link flow)
- [ ] After login — if no metrics plan, upsell box appears
- [ ] If metrics plan active — dashboard loads with scan counts
- [ ] 30-day chart renders (Chart.js)
- [ ] Leads table shows submitted leads
- [ ] CSV export downloads valid file

---

## 8. Admin Dashboard

- [ ] Go to torrolink.com/admin
- [ ] Browser prompts for password
- [ ] Enter ADMIN_PASSWORD from Netlify env vars → dashboard loads
- [ ] All customers listed
- [ ] All profiles listed with scan counts
- [ ] Stats cards show correct totals

---

## 9. Final Checks

- [ ] No console errors on any page (open browser DevTools)
- [ ] All Netlify functions show no errors in function logs
- [ ] Supabase tables have correct data throughout
- [ ] ADMIN_PASSWORD env var is set in Netlify (not the default "changeme")
- [ ] Stripe is switched to **live mode** before real customers
- [ ] Live webhook is active (not sandbox)
- [ ] Resend domain verified ✅ (already done)

---

## Environment Variables Checklist (Netlify)

| Variable | Set? |
|----------|------|
| SUPABASE_URL | ✅ |
| SUPABASE_ANON_KEY | ✅ |
| SUPABASE_SERVICE_KEY | ✅ |
| STRIPE_SECRET_KEY | verify live key |
| STRIPE_WEBHOOK_SECRET | verify live key |
| RESEND_API_KEY | ✅ |
| DEPLOY_URL | verify = https://torrolink.com |
| ADMIN_PASSWORD | ⚠️ set a strong password |

---

*Last updated: 2026-06-11*
