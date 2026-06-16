# Torrolink Launch Checklist

## Step 1 — Deploy code (run deploy.bat)
Run `deploy.bat` in C:\Users\Laign\TorroLink. Wait 2-3 min for Netlify to finish.

---

## Step 2 — Supabase: Run background image migration
Go to https://app.supabase.com → your project → SQL Editor → paste and run:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_image text;
```

---

## Step 3 — Stripe webhook endpoint
Go to https://dashboard.stripe.com/webhooks → **Add endpoint**

**Endpoint URL:**
```
https://torrolink.com/.netlify/functions/stripe-webhook
```

**Events to select:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

After saving, click the endpoint → copy **Signing Secret** (starts with `whsec_...`)

---

## Step 4 — Netlify: Add STRIPE_WEBHOOK_SECRET
Go to https://app.netlify.com → your site → Site configuration → Environment variables → Add:

| Key | Value |
|-----|-------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe step above) |

Click "Deploy" or trigger a redeploy for the env var to take effect.

---

## Step 5 — Email deliverability (SPF/DKIM via Resend)
Go to https://resend.com/domains → torrolink.com → copy the DNS records shown.

Add them in your DNS provider (wherever torrolink.com DNS is managed):
- **SPF** TXT record on `@` (or merge with existing SPF)
- **DKIM** TXT record on `resend._domainkey`
- **DMARC** TXT record on `_dmarc` (optional but recommended)

After adding, click **Verify** in Resend. Emails from `orders@torrolink.com` won't land in spam after this.

---

## Step 6 — Go live with Stripe
When ready to accept real payments, swap keys in Netlify env vars:

| Key | Change to |
|-----|-----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (from Stripe Dashboard → Developers → API keys) |

> Your Stripe test key starts with `sk_test_`. Live key starts with `sk_live_`.  
> The webhook in test mode has a different signing secret than live mode — you'll need to create a **separate** webhook endpoint in Stripe's **Live** mode and update `STRIPE_WEBHOOK_SECRET` with the live signing secret.

---

## Step 7 — Final smoke tests
After deploy:
- [ ] https://torrolink.com loads
- [ ] https://torrolink.com/portal — sign in works
- [ ] https://torrolink.com/terms — Terms of Service shows
- [ ] https://torrolink.com/privacy — Privacy Policy shows
- [ ] Click a Buy button → Stripe checkout opens
- [ ] (Test mode) Complete a test purchase → check email for QR code

---

## Optional — OWNER_EMAIL env var
Add in Netlify if you want owner alerts to a different address than `laigno@gmail.com`:
| Key | Value |
|-----|-------|
| `OWNER_EMAIL` | `laigno@gmail.com` (already default, change if needed) |
