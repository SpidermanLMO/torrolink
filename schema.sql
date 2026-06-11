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

-- ── SCHEMA ADDITIONS (run these after initial setup) ─────────────────────────
-- Added for branding tiers and webhook processing

alter table customers add column if not exists metrics_active boolean default false;

alter table profiles add column if not exists branding_tier   text;    -- 'standard' | 'custom' | null
alter table profiles add column if not exists branding_status text;    -- 'pending_upload' | 'approved' | null

-- Added for customer portal
alter table profiles add column if not exists bio   text;
alter table profiles add column if not exists phone text;

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

-- ── SUPABASE AUTH — PORTAL MAGIC LINK ────────────────────────────────────────
-- In Supabase Dashboard → Authentication → URL Configuration, add:
--   Site URL:          https://torrolink.com
--   Redirect URLs:     https://torrolink.com/portal
--                      https://torrolink.com/metrics/*

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ================================================
-- DONE. After running this, also do:
--
-- 1. Add env vars to Netlify:
--      SUPABASE_URL         → your project URL
--      SUPABASE_ANON_KEY    → your anon/public key
--      SUPABASE_SERVICE_KEY → your service_role key
--      STRIPE_SECRET_KEY    → from Stripe dashboard
--      STRIPE_WEBHOOK_SECRET → from Stripe webhook endpoint
--      RESEND_API_KEY       → from resend.com
--      DEPLOY_URL           → https://torrolink.com
--
-- 2. Create a Supabase Storage bucket named "qr-assets":
--      Go to Storage → New bucket → Name: qr-assets → Public: false
--      This is where branded QR PNGs are stored after approval.
-- ================================================
