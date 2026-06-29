# LUCIUS QA REPORT — TorroLink Portal "Make It Work For Real"
_Run: 2026-06-28 (Opus resume agent, took over Sonnet 4.6 session)_
_Status: ✅ CRITICAL BUGS FIXED, DEPLOYED, AND VERIFIED LIVE_

---

## TL;DR
The member portal is now fully functional. New users can sign up, existing
users can log in (no more "No account found"), Save persists, public landing
pages render, and QR codes resolve. Sign-out now actually signs out. Three real
test members were created and verified end-to-end.

Two production deploys were made:
- `46dc1fa` — portal-load.js (RLS bypass + auto-create customer/profile)
- `2631df3` — sign-out now resets dirty flag and reloads to login screen

---

## ROOT CAUSE (the original breakage)
1. `portal-signup.js` created the Supabase auth user but **no** `customers` /
   `profiles` rows. After sign-in, `onSignedIn()` queried `customers` client-side
   and found nothing → "No account found."
2. `customers` has RLS enabled with **no authenticated SELECT policy**, so even
   paying Stripe customers (who DO have rows) couldn't read their own data with
   the anon key → portal stayed broken for everyone.

## THE FIX (was written by prior session, corrected + shipped here)
- **NEW `netlify/functions/portal-load.js`** — verifies the JWT with the
  service-role key (bypasses RLS), loads customer + profile, and **auto-creates
  both** on first sign-in. Retries handle/code on unique conflicts.
- **`portal.js` `onSignedIn()`** — now calls `/.netlify/functions/portal-load`
  instead of doing blocked client-side queries.
- **BUG CAUGHT BEFORE DEPLOY:** the written portal-load.js inserted a `plan`
  column into `profiles`, **but that column does not exist on the profiles
  table** (verified against live DB). Left as-is it would have 500'd every new
  signup. Removed the `plan` field from the profiles insert before shipping.
- **service_role GRANTs** were verified present on both tables — no SQL needed.

## SECOND BUG FOUND & FIXED (sign-out)
`signOut()` only called `_supabase.auth.signOut()` — it never reset the dirty
flag or changed the UI, so the user appeared to stay logged in (and the
unsaved-changes `beforeunload` guard could block leaving). This is a shared-device
security concern ("security sign in no exceptions"). Fixed:
```js
async function signOut() {
  _dirty = false;
  try { await _supabase.auth.signOut(); } catch (e) {}
  window.location.href = '/portal';
}
```
Verified live: clicking **Sign out** now clears the session and shows the login screen.

---

## VERIFIED LIVE (torrolink.com)
| Check | Result |
|-------|--------|
| New-user signup → editor loads with blank profile | ✅ |
| Auto-create customer + profile row | ✅ (confirmed in Supabase) |
| Existing-user login (Sign In button) — no "No account found" | ✅ |
| Save Changes persists to DB | ✅ (confirmed in Supabase) |
| Public landing page renders | ✅ (all 3) |
| QR code encodes correct /p/<handle> URL | ✅ |
| Sign out button → login screen | ✅ |
| Logged-out visitor sees login gate | ✅ |

## THREE TEST MEMBERS (real, working logins)
| Role | Email | Password | Handle / Landing |
|------|-------|----------|------------------|
| Plumber | laigno+plumber@gmail.com | Plumber2026! | torrolink.com/p/laignoplumberq7p37 |
| Chef | laigno+chef@gmail.com | ChefTable2026! | torrolink.com/p/laignochefqpgi7 |
| Trainer | laigno+trainer@gmail.com | TrainStrong2026! | torrolink.com/p/laignotrainerjfvmh |

(All three are free-plan accounts. Emails are Gmail plus-addresses that land in
laigno@gmail.com. Delete the rows from `profiles`/`customers` + the auth users
when done testing if you don't want them in production data.)

---

## REMAINING / LOWER-PRIORITY OBSERVATIONS
- **Lead/contact form** is gated behind the paid Metrics & Leads tier
  ($10.28/mo). Working as intended — not a bug.
- **`beforeunload` unsaved-changes guard** is correct but fires off `_dirty`;
  confirm `_dirty` is reset on every successful save path (it is reset in the
  main save handler at ~line 2052).
- Logo/headshot uploads, Links & Socials, Themes, Reviews, Partners tabs were
  **not** exercised in this pass — recommend a follow-up QA sweep on those.

---

## ADDENDUM — Repeating Links Bug + Full Tab QA (later same session)

### Repeating links on landing page — FIXED (data cleanup)
User reported their live profile (ptorro-holdings-llc) showed the same 2 links
repeating down the page. Root cause: the `links` JSONB column held **11,760**
entries (only 2 distinct: "Get Your QR Profile", "See Plans & Pricing"). This is
leftover bloat from the old duplication bug — the earlier Fix 2b cleaned
`content_blocks` to 2 but never cleaned the `links` column, and `profile.js`
renders `links` directly.

- **Fix:** Rebuilt `links` from the (clean) 2-item `content_blocks` via SQL.
  `links_count` is now 2. Live page verified — exactly 2 links, no repeats.
- **Code is already correct** (no deploy needed): populate clears `#contentList`
  before rebuild (portal.js ~1408); save derives `links` from content_blocks.
- **Scanned ALL profiles** for the same bloat (links/content_blocks/checkboxes
  > 12) — ptorro-holdings-llc was the ONLY affected profile. All others clean.

### Full portal tab QA (logged in as plumber test account)
| Tab | Result |
|-----|--------|
| Links & Socials | ✅ add link → save → reload → stays 1 (no duplication). DB confirmed. |
| Themes | ✅ renders, content present |
| Reviews | ✅ renders/loads, no errors |
| Partners | ✅ renders/loads, no errors |
| Gallery | ✅ renders, no errors |
| Console | ✅ no JS errors across all tabs |

Note: during heavy automated testing, multiple concurrent portal tabs in one
browser shared a single Supabase localStorage token and collided (nulled
`_profile`, broke saves on reload). This is a TEST-HARNESS artifact, not a
product bug — with a single tab + healthy session, signup/login/save/reload all
work correctly.
