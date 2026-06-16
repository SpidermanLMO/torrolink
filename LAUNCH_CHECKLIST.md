# Torrolink Launch Checklist

## Step 1 — Deploy code (run deploy.bat)
Double-click `deploy.bat` in C:\Users\Laign\TorroLink. Wait 2-3 min for Netlify to finish.

---

## Step 2 — Supabase: Run all migrations (CRITICAL)

**IMPORTANT — use the correct project.**  
The live site uses project `cayymmknkjpiybssiltu`. Find it at https://app.supabase.com → look for the project whose URL contains `cayymmknkjpiybssiltu`.

Go to **SQL Editor** and paste + run this entire block:

```sql
-- 1. Fix review submission (service_role needs INSERT on reviews)
GRANT ALL ON reviews TO service_role;

-- 2. New columns for admin features
ALTER TABLE customers ADD COLUMN IF NOT EXISTS free_until timestamptz;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;

-- 3. Background image column (may already exist — IF NOT EXISTS is safe)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_image text;
```

This fixes:
- **Review submissions returning "Failed to submit"** — service_role lacked INSERT on reviews
- Admin "Grant free month" feature (free_until column)
- Admin "Suspend profile" feature (suspended column)

---

## Step 2b — Photo Gallery + Documents (new feature)

Run this **after** Step 2. In the same SQL Editor:

```sql
-- profile_photos table (gallery grid + view tracking)
CREATE TABLE IF NOT EXISTS profile_photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption     TEXT        DEFAULT '',
  file_url    TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  sort_order  INTEGER     DEFAULT 0,
  view_count  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON profile_photos TO service_role;
GRANT SELECT ON profile_photos TO anon;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read photos" ON profile_photos FOR SELECT USING (true);

-- profile_documents table (PDFs, flyers, Word docs)
CREATE TABLE IF NOT EXISTS profile_documents (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'Document',
  file_url    TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  file_type   TEXT        NOT NULL DEFAULT 'pdf',
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
GRANT ALL ON profile_documents TO service_role;
GRANT SELECT ON profile_documents TO anon;
ALTER TABLE profile_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read documents" ON profile_documents FOR SELECT USING (true);
```

Also ensure the `qr-assets` Supabase Storage bucket exists and is **public**.
Go to Storage → `qr-assets` → Settings → make Public (if not already).

---

## Step 3 — Netlify: Add ADMIN_PASSWORD env var

Go to https://app.netlify.com → your site → **Site configuration → Environment variables** → Add:

| Key | Value |
|-----|-------|
| `ADMIN_PASSWORD` | (choose a strong password) |

Then trigger a redeploy. This enables the `/admin` dashboard.

---

## Step 4 — Stripe webhook endpoint
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

## Step 5 — Netlify: Add STRIPE_WEBHOOK_SECRET
Go to https://app.netlify.com → your site → Site configuration → Environment variables → Add:

| Key | Value |
|-----|-------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe step above) |

Click "Deploy" or trigger a redeploy for the env var to take effect.

---

## Step 6 — Email deliverability (SPF/DKIM via Resend)
Go to https://resend.com/domains → torrolink.com → copy the DNS records shown.

Add them in your DNS provider (wherever torrolink.com DNS is managed):
- **SPF** TXT record on `@` (or merge with existing SPF)
- **DKIM** TXT record on `resend._domainkey`
- **DMARC** TXT record on `_dmarc` (optional but recommended)

After adding, click **Verify** in Resend. Emails from `orders@torrolink.com` won't land in spam after this.

---

## Step 7 — Go live with Stripe
When ready to accept real payments, swap keys in Netlify env vars:

| Key | Change to |
|-----|-----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (from Stripe Dashboard → Developers → API keys) |

> Your Stripe test key starts with `sk_test_`. Live key starts with `sk_live_`.  
> The webhook in test mode has a different signing secret than live mode — you'll need to create a **separate** webhook endpoint in Stripe's **Live** mode and update `STRIPE_WEBHOOK_SECRET` with the live signing secret.

---

## Step 8 — Final smoke tests
After deploy + Supabase migrations:
- [ ] https://torrolink.com loads
- [ ] https://torrolink.com/portal — sign in works
- [ ] https://torrolink.com/terms — Terms of Service shows
- [ ] https://torrolink.com/privacy — Privacy Policy shows
- [ ] Click a Buy button → Stripe checkout opens
- [ ] (Test mode) Complete a test purchase → check email for QR code
- [ ] Submit a review on a profile page → no "Failed to submit" error
- [ ] /admin — dashboard loads after entering password

---

## Optional — OWNER_EMAIL env var
Add in Netlify if you want owner alerts to a different address than `laigno@gmail.com`:
| Key | Value |
|-----|-------|
| `OWNER_EMAIL` | `laigno@gmail.com` (already default, change if needed) |
