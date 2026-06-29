# LUCIUS SECURITY AUDIT — TorroLink Member Portal + Public Landing
_Run: 2026-06-28 (Opus). Code review + live attack testing as a real logged-in member._
_Status: ✅ All CRITICAL/HIGH exploitable issues FIXED, DEPLOYED, and VERIFIED by attack._

Deploy shipping these fixes: commit `10445c1` (profile.js, portal-save.js) + Supabase RLS change (live).

---

## FIXED & VERIFIED (attacked in production, confirmed blocked)

### 1. CRITICAL — Stored XSS on every public landing page (profile.js)
Two sinks let any member (or review submitter) run JavaScript on visitors' browsers:
- **JSON-LD `<script>` breakout** — `business_name`, `tagline`, `bio`, `phone`, `logo_url`, review text were `JSON.stringify`'d into `<script type="application/ld+json">` raw. `JSON.stringify` doesn't escape `<`, so `</script><script>…` broke out.
  - Fix: escape `<` → `<` in the JSON-LD output.
- **Theme-color `<style>` breakout** — `theme.color1/color2` were interpolated into `<style>` with no validation; `red;}</style><script>…` broke out.
  - Fix: `_safeCssColor()` validates hex/rgb/hsl/named-color, else falls back to default. Applied in `getThemeCSS` (covers all CSS interpolations + the `theme-color` meta tag).
- **Live attack result:** saved `</script><script>window.__xss1=1</script>`, `<img onerror>`, and `color1:"red;}</style><script>…"` to a member profile → public page renders `"name":"</script>…"` (escaped), tagline `&lt;img…` (escaped), theme payload **gone** (sanitized). No script executes. ✅

### 2. CRITICAL — IDOR on profile save (portal-save.js)
The ownership check had a **fail-open** branch: if both customer lookups missed, it "proceeded" and updated the requested `profileId` regardless of owner. Any member could overwrite another member's profile.
- Fix: rewritten **fail-closed** — resolve the caller's own customer from their verified JWT email, confirm the target `profileId` belongs to them, else `403`. Never proceeds on unknown ownership.
- **Live attack result:** plumber POSTed chef's `profileId` → `403 "You don't have permission to edit this profile."` Chef's data untouched. ✅
- (Note: the Edit tool corrupted this file with NUL bytes over CIFS — cleaned and re-verified with `node --check`. Reminder: only edit large JS via Python, per CLAUDE.md.)

### 3. HIGH — Cross-tenant analytics (PII) leak (scan_events table)
`scan_events` (holds **IP address, city, region, country, device, OS, referrer** per scan) had RLS SELECT policies `USING (true)` for both `anon` and `authenticated` — i.e. **world-readable**. Anyone with the public anon key could dump every business's scanner IPs/locations by changing `profile_id`.
- Fix (Supabase, live): dropped the two permissive SELECT policies; added `scan_events_owner_select` (authenticated, scoped to profiles the caller owns via `auth.jwt()->>'email'`); granted SELECT to `authenticated` only. `anon` can no longer read; INSERT (scan logging) untouched.
- **Live attack result:** seeded a chef scan row with a secret IP; plumber's authenticated read of chef's `profile_id` and of "all" → **0 rows, secret not leaked**; plumber's own read works (no permission error). ✅

### Other vectors tested — already SAFE (no change needed)
| Attack (as logged-in plumber) | Result |
|---|---|
| Unauthenticated `portal-save` | 401 Missing auth token ✅ |
| Direct DB `UPDATE` on chef's profile (bypass function) | permission denied for table profiles ✅ |
| Read `customers` table (emails/PII) | self-only (1 row, own email) ✅ |
| `referral-partners` list chef's partners | 403 "Profile not found or not yours" ✅ |
| `portal-reviews` read chef's reviews | 403 Forbidden ✅ |
| Stripe webhook forgery | signature verified (constructEvent) ✅ |
| Secret leakage in client JS | none (only anon key shipped) ✅ |

---

## FOUND but NOT yet fixed — recommend, but carry risk / need your OK

These are lower severity and each has a reason I didn't change it unattended:

- **Admin password stored in plaintext** in `admin_config` (admin.js). Should be hashed. **Deferred:** hashing wrong could lock you out of /admin — do this with you present.
- **Non-timing-safe secret comparisons** (`admin.js` password/token, `agent-mailer.js` x-agent-secret use `===`). Low practical risk over a network. **Deferred:** editing admin auth unattended is risky.
- **agent-mailer allows arbitrary recipients** — anyone holding `ADMIN_SECRET` can send mail to anyone from any `@torrolink.com` address (phishing/relay if the secret leaks). **Deferred:** adding a recipient allowlist could break the agent email system; needs your sign-off on allowed recipients.
- **Signup user-enumeration + no rate limit** (`portal-signup.js` reveals "account already exists"; no CAPTCHA/throttle). Spam/enumeration vector. **Deferred:** needs a product decision (CAPTCHA vs. throttle).
- **`leads` table**: read is fully denied to clients (secure), which means the paid metrics dashboard's *leads* view can't load client-side. If you want owners to see their leads, apply the same owner-scoped pattern used for scan_events (GRANT SELECT to authenticated + owner policy). Functional, not a security hole.

---

## Net result
The member portal and public landing pages are now hardened against the high-impact web vulns: no stored XSS, no cross-tenant read/write of profiles, analytics, leads, partners, reviews, or customer emails. All fixes were verified by actually attacking the live site as a logged-in member.
