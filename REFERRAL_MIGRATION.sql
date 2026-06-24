-- ================================================
-- TORROLINK — REFERRAL SYSTEM MIGRATION
-- Run ALL of this in Supabase SQL Editor (one paste, one run)
-- Safe to run multiple times — all use IF NOT EXISTS
-- ================================================

-- ── Feature B: Referral Partner Tracker ──────────────────────────
-- (Partners tab in portal — already coded, just needs these tables)

CREATE TABLE IF NOT EXISTS referral_partners (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  company     TEXT        DEFAULT '',
  category    TEXT        DEFAULT 'other',
  phone       TEXT        DEFAULT '',
  email       TEXT        DEFAULT '',
  notes       TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID        NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes       TEXT        DEFAULT '',
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_partners_profile ON referral_partners(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_logs_partner     ON referral_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_logs_profile     ON referral_logs(profile_id, logged_at DESC);

ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_logs     ENABLE ROW LEVEL SECURITY;

GRANT ALL ON referral_partners TO service_role;
GRANT ALL ON referral_logs     TO service_role;


-- ── Feature A: Affiliate Referral Program ─────────────────────────
-- Adds referral tracking columns to customers table

ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code    TEXT UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referred_by      TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0;

-- Index for fast lookup by referral_code and referred_by
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_customers_referred_by   ON customers(referred_by);

-- Also ensure stripe_subscription_id column exists (needed to apply discounts)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ── Grants ────────────────────────────────────────────────────────
GRANT ALL ON TABLE public.customers TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
