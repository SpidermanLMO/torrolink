-- ================================================
-- TORROLINK — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor once.
-- ================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "uuid-ossp";

-- ── CUSTOMERS ─────────────────────────────────────────────────────────────────
create table if not exists customers (
  id                  uuid primary key default uuid_generate_v4(),
  email               text unique not null,
  name                text,
  stripe_customer_id  text unique,
  stripe_subscription_id text,
  plan                text default 'free',   -- 'free' | 'metrics'
  created_at          timestamptz default now()
);

-- ── PROFILES ──────────────────────────────────────────────────────────────────
-- One profile per QR code. Customers can have multiple codes eventually.
create table if not exists profiles (
  id                    uuid primary key default uuid_generate_v4(),
  customer_id           uuid references customers(id) on delete cascade,

  -- Identifiers
  handle                text unique not null,   -- URL slug: torrolink.com/p/johnsplumbing
  code                  text unique not null,   -- QR code identifier: torrolink.com/q/abc123

  -- Profile content
  business_name         text,
  tagline               text,
  logo_url              text,
  photo_url             text,
  video_url             text,
  links                 jsonb default '[]',     -- [{label, url}, ...]
  socials               jsonb default '{}',     -- {instagram, facebook, twitter, tiktok, youtube, linkedin, yelp, google}

  -- Lead form (only shown when has_metrics = true)
  lead_form_enabled     boolean default false,
  lead_form_checkboxes  text[] default '{}',    -- custom interest options
  lead_form_has_textbox boolean default false,

  -- Plan & status
  has_metrics           boolean default false,  -- $10.28/mo plan active
  has_branding          boolean default false,  -- custom branded QR delivered
  is_active             boolean default true,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── SCAN EVENTS ───────────────────────────────────────────────────────────────
create table if not exists scan_events (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles(id) on delete cascade,
  scanned_at  timestamptz default now(),
  ip_address  text,
  country     text,
  city        text,
  device_type text,  -- 'mobile' | 'tablet' | 'desktop'
  os          text,
  referrer    text
);

-- ── LEADS ─────────────────────────────────────────────────────────────────────
create table if not exists leads (
  id           uuid primary key default uuid_generate_v4(),
  profile_id   uuid references profiles(id) on delete cascade,
  name         text,
  phone        text,
  email        text,
  comment      text,
  interests    text[] default '{}',
  submitted_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- ⚠️  REQUIRED: Run these GRANTs in Supabase SQL Editor
-- Tables created via raw SQL do NOT auto-grant to service_role like Table Editor does.
-- Without these, serverless functions using SUPABASE_SERVICE_KEY will get
-- "permission denied for table" (error 42501) on ALL table operations.
-- ══════════════════════════════════════════════════════════════════════════════
grant all on table public.profiles   to service_role;
grant all on table public.customers  to service_role;
grant all on table public.leads      to service_role;
grant all on table public.scan_events to service_role;

-- Also grant to anon and authenticated roles (needed for RLS policies to work):
grant select         on table public.profiles   to anon, authenticated;
grant select         on table public.customers  to authenticated;
grant insert         on table public.scan_events to anon, authenticated;
grant insert         on table public.leads       to anon, authenticated;
grant select, update on table public.profiles    to authenticated;

-- Sequences (for auto-generated IDs):
grant usage, select on all sequences in schema public to service_role, anon, authenticated;

-- ── SCHEMA ADDITIONS (run these after initial setup) ─────────────────────────
-- Added for branding tiers and webhook processing

alter table customers add column if not exists metrics_active boolean default false;

alter table profiles add column if not exists branding_tier   text;    -- 'standard' | 'custom' | null
alter table profiles add column if not exists branding_status text;    -- 'pending_upload' | 'approved' | null

-- Added for customer portal
alter table profiles add column if not exists bio   text;
alter table profiles add column if not exists phone text;

-- Added for theme system (Task 13/14)
alter table profiles add column if not exists theme      jsonb default '{}';   -- full theme settings object
alter table profiles add column if not exists owner_name text;                 -- rep/owner name shown under headshot
-- Note: photo_url already exists in the main table definition above

-- Added qr_url for branded QR storage (stripe-webhook generates & stores QR PNG)
alter table profiles add column if not exists qr_url text;

-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists idx_profiles_handle     on profiles(handle);
create index if not exists idx_profiles_code       on profiles(code);
create index if not exists idx_scan_events_profile on scan_events(profile_id, scanned_at desc);
create index if not exists idx_leads_profile       on leads(profile_id, submitted_at desc);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- Allow serverless functions (using service_role key) to do everything.
-- Public anon key can only read active profiles (for the profile page).

alter table profiles enable row level security;
alter table scan_events enable row level security;
alter table leads enable row level security;
alter table customers enable row level security;

-- Profiles: public can read active profiles (needed for profile page)
create policy "Public read active profiles"
  on profiles for select
  using (is_active = true);

-- Scan events: anon can insert (needed for qr.js logging)
create policy "Anon can log scans"
  on scan_events for insert
  with check (true);

-- Leads: anon can insert (needed for lead form submissions)
create policy "Anon can submit leads"
  on leads for insert
  with check (true);

-- Customers: authenticated users can read their own record (needed f

-- ── Reviews table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating        int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text   text,
  is_visible    bool NOT NULL DEFAULT true,
  is_featured   bool NOT NULL DEFAULT false,
  submitted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_profile_id_idx ON reviews(profile_id, is_visible);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read visible reviews (anon client used in profile.js)
CREATE POLICY IF NOT EXISTS "public read visible reviews"
  ON reviews FOR SELECT USING (is_visible = true);

-- Anyone can submit a review
CREATE POLICY IF NOT EXISTS "public insert reviews"
  ON reviews FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON reviews TO anon;
GRANT SELECT, INSERT ON reviews TO authenticated;

-- ── Content blocks column on profiles ───────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]';

-- Background image for custom theme
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_image text;

-- Admin: grant free months of metrics
ALTER TABLE customers ADD COLUMN IF NOT EXISTS free_until timestamptz;
-- Admin: suspend profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended boolean default false;
