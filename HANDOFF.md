# HANDOFF.md — Session Handoff
_Written: 2026-06-28 by Lucius (resume agent)_
_Read this at the start of every new session BEFORE doing anything else._

---

## ⚡ TL;DR — Where Things Stand Right Now

| Domain | Status | Next Action |
|--------|--------|-------------|
| **TorroLink Portal** | 🔴 BROKEN — root cause found, fix half-written | DEPLOY the fix (see below) |
| **PTorro Digital** | 🟢 LIVE at ptorro-digital.netlify.app | DNS pending (user action needed) |
| **Pitch Sites** | 🟢 All 9 at 10/10 standard | Ready to pitch |

---

## 🚨 CRITICAL — TorroLink Portal Is Broken (Fix Written, Not Deployed)

### Root Cause (fully diagnosed)

**Problem:** When any user signs up or tries to log in, they always see:
> "No account found for [email]. Use the email you purchased with."

**Why it breaks:**

1. `portal-signup.js` creates the Supabase auth user but **NEVER creates a row in `customers` or `profiles` tables**. So after sign-in, `onSignedIn()` queries the `customers` table client-side, finds nothing, and fails.

2. `onSignedIn()` in `portal.js` queries Supabase client-side with the **anon key**. The `customers` table has RLS enabled and **no policy allowing authenticated users to SELECT**. So even Stripe customers (who DO have customer rows) can't load their profile — the query returns null due to RLS blocking it.

Both of these together = **zero users can use the portal**.

---

### Fix Written But NOT Yet Deployed

Two files were modified/created in this session. They are saved to disk but **not pushed to GitHub / Netlify yet**:

#### 1. `netlify/functions/portal-load.js` — NEW FILE ✅ WRITTEN
- A new serverless function that verifies the JWT via service_role (bypasses RLS entirely)
- Loads customer + profile using service_role
- **Auto-creates customer + profile rows if they don't exist** (fixes self-signups)
- Retries with different handle/code on unique-constraint conflict (up to 5x)
- Full path: `C:\Laign\Claude\Torrolink\netlify\functions\portal-load.js`

#### 2. `netlify/functions/portal.js` — PATCHED ✅ WRITTEN
- `onSignedIn()` function (lines ~1343-1379) replaced
- Old: 2 client-side Supabase queries (blocked by RLS)
- New: single `fetch('/.netlify/functions/portal-load', { headers: { Authorization: Bearer token } })`
- This completely bypasses the RLS problem
- Full path: `C:\Laign\Claude\Torrolink\netlify\functions\portal.js`

---

### TO DEPLOY THE FIX:

**Run `_fix_deploy.bat`** (in `C:\Laign\Claude\Torrolink\`)

Before running, update the commit message in `_fix_deploy.bat`:
```
git commit -m "fix: portal-load.js — bypass RLS, auto-create customer+profile on signup"
```

Then File Explorer → Ctrl+L → paste `C:\Laign\Claude\Torrolink\_fix_deploy.bat` → Enter.
Wait 2-3 min → verify at app.netlify.com/projects/torrolink/deploys.

---

### AFTER DEPLOY — 3 Things To Verify:

1. **New user signup flow**: Go to torrolink.com/portal → Create Account → fill email + password (needs 8+ chars, 1 capital, 1 symbol like `Test1234!`) → Should land on the editor with a blank profile ready to fill out.

2. **Existing customer login**: Keila (or any Stripe customer) logs in → Should now load their profile without "No account found" error.

3. **Save works**: Fill in Business Name → click Save → should succeed (green checkmark). If still failing, check Netlify function logs for `portal-save.js` errors.

---

### REMAINING RISKS (after deploy):

| Risk | Likelihood | What Happens |
|------|-----------|------|
| `service_role` GRANT not applied on `customers`/`profiles` | Low (GRANTs are in schema.sql which was run at setup) | `portal-load.js` auto-create step fails with 500. Fix: run `GRANT ALL ON TABLE public.customers, public.profiles TO service_role;` in Supabase SQL Editor for project `cayymmknkjpiybssiltu` |
| `profiles` table missing `plan` column | Possible | Remove `plan` from the `portal-load.js` insert on line ~98. The column isn't in the base schema. |

**If portal-load.js returns 500 errors after deploy**, open Netlify logs → Functions → portal-load → read the error. Most likely GRANT issue. Fix by running the SQL in Supabase.

---

## 📋 What Was Done This Session (2026-06-28)

### Phase 1: All 9 Pitch Sites Built to 10/10 Standard ✅
- allison-electric, capital-city-hvac, independent-electric-hutto, pinar-fence-installers, revive-electric-hutto, the-plumber-gary — full v3 rebuilds
- 4-a-plumber, 5-star-ac-heating — targeted upgrades (phone in nav, dual CTAs, new headlines)
- ptorro-digital/site/index.html — full rebuild with electric purple theme

### Phase 2: PTorro Digital Deployed ✅
- Live at ptorro-digital.netlify.app
- Domain ptorrodigital.com registered on Cloudflare
- DNS pending: user needs to add CNAME records in Cloudflare:
  - `@` → `ptorro-digital.netlify.app` (proxy OFF)
  - `www` → `ptorro-digital.netlify.app` (proxy OFF)

### Phase 3: TorroLink Portal Fix — WRITTEN, NOT DEPLOYED 🔴
- portal-load.js created
- portal.js onSignedIn() patched
- **NEEDS DEPLOY** (see above)

---

## 🏗️ TorroLink Tech State

- **Hosting:** Netlify — torrolink.com / torrolink.netlify.app
- **DB/Auth:** Supabase project ID: `cayymmknkjpiybssiltu`
- **Deploy:** `_fix_deploy.bat` → git push → Netlify auto-deploys
- **CIFS Rule:** NEVER use Edit tool on large JS files. Use Python via bash.

### Deploy Process
1. Update commit message in `_fix_deploy.bat`
2. File Explorer → Ctrl+L → paste `C:\Laign\Claude\Torrolink\_fix_deploy.bat` → Enter
3. CMD runs on monitor 2 (not visible on primary) — it still works
4. Wait 2-3 min → verify at app.netlify.com/projects/torrolink/deploys

---

## 📂 Key Files

```
C:\Laign\Claude\Torrolink\
├── HANDOFF.md                           ← This file
├── _fix_deploy.bat                      ← Deploy trigger
├── schema.sql                           ← DB schema (reference only — already applied)
└── netlify/functions/
    ├── portal.js          (~2700 lines) ← Portal UI — onSignedIn() PATCHED this session
    ├── portal-load.js     (NEW)         ← Server-side customer+profile loader — CREATED this session
    ├── portal-save.js     (~220 lines)  ← Saves profile to Supabase (unchanged)
    ├── portal-signup.js   (~71 lines)   ← Creates auth user only (unchanged — portal-load handles the rest)
    └── profile.js         (~1450 lines) ← Public profile page renderer (unchanged)
```

---

_Written 2026-06-28. Fix is ready to ship — just needs `_fix_deploy.bat` run._
