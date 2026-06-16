# Overnight Improvement Log — 2026-06-16

## STATUS: All changes saved. Awaiting deploy via `_fix_deploy.bat`.

---

## SESSION 3 CHANGES (current context — all pass `node --check`)

### Security Fixes
- **`netlify/functions/portal-save.js`** — Video URL server-side validation: only YouTube (`youtube.com/watch?v=`, `youtu.be/`) and Vimeo (`vimeo.com/<id>`) URLs are accepted; all other values are stored as `null`. Prevents embedding arbitrary URLs in iframes on profile pages.
- **`netlify/functions/profile.js`** — `toEmbedUrl()` previously returned the raw URL as-is for non-YouTube/Vimeo input, allowing arbitrary URLs in an `<iframe src="">`. Fixed to return `""` for unrecognized URLs. Video section only renders when embed URL is non-empty. `escHtml()` now applied to the embed URL in the iframe `src` attribute.

### UX / Dirty State — `netlify/functions/portal.js`
All user actions that change profile data now correctly call `markDirty()`, triggering the orange save button outline and `beforeunload` warning if the user navigates away with unsaved changes. Previously missing in:
- Headshot / logo / background image uploads
- Background pattern selection (`selectPattern`)
- Background image removal (`removeBgImage`)
- Card style selection (`selectCardStyle`)
- Photo layout selection (`setPhotoLayout`) — also fixed false-positive: initial population via `populateThemeControls` now passes `silent=true` so loading doesn't mark the form dirty
- QR dot style selection (`setQRDotStyle`)
- Adding a content item (link / update / menu / service)
- Removing a content item (✕ button)
- Drag-to-reorder content items (on `dragend`)
- Adding a lead-form checkbox option (`addCheckbox` user-initiated)
- Removing a lead-form checkbox option (✕ button)

### Performance (Core Web Vitals)
- **`netlify/functions/profile.js`** — Added `fetchpriority="high"` to all above-the-fold hero images (logo, headshot, duo layout). These are the LCP candidates; the hint allows the browser to prioritize fetching them in the preload scanner.

### Bug Fix
- **`netlify.toml`** — File was CIFS-truncated — entire redirects section was missing from disk. Restored full file with all route redirects intact. Without this fix, `/p/:handle`, `/q/:code`, `/portal`, `/metrics/:handle` etc. would all 404 after the next deploy.

---

## SESSION 2 CHANGES (all deployed or pending deploy)

### Security Fixes
- **`netlify/functions/profile.js`** — XSS: `escJs()` had wrong replacement order (escaped `'` before `\`, so defensive backslash got doubled by second pass). Fixed: escape `\` first, then `'`.
- **`netlify/functions/portal-reviews.js`** — Critical: PATCH handler missing ownership check. Fixed.
- **`netlify/functions/portal.js`** — XSS via `escAttr()` in HTML content context. Fixed to `escHtml()`.

### Data Integrity / Validation
- **`netlify/functions/portal-save.js`** — Server-side field length limits: `business_name` 80, `tagline` 120, `bio` 1000, `phone` 30, `owner_name` 100.
- **`netlify/functions/portal.js`** — `maxlength` on all profile fields.
- **`netlify/functions/profile.js`** — `maxlength` on review form (name:100, text:1000) and lead form (name:100, phone:30, email:200, comment:1000).

### UX Improvements
- **`netlify/functions/portal.js`** — URL auto-normalization for link items (prepend `https://`).
- **`netlify/functions/portal.js`** — Metrics "View Analytics" link added to QR tab.
- **`success.html`** — Plan-aware post-purchase messaging + `noindex`.

### Rate Limiting (session 1)
- **`netlify/functions/review-submit.js`** — 24-hour rate limit per reviewer name per profile.
- **`netlify/functions/lead-notify.js`** — 15-minute rate limit per lead name per profile.

### Business Model Fix (session 1)
- **`netlify/functions/portal.js`** — Lead form toggle gated behind `metrics_active` flag.

### Other Session 1 Changes
- `qr.js` iPad/Android tablet detection fix; `profile.js` favicon + theme-color + review JSON-LD; `vcard.js` URL fix; `script.js` XSS + res.ok; `index.html` theme-color + FAQ + cache-bust; `netlify.toml` CSS/JS cache headers.

---

## DEPLOY STEPS
1. Double-click `_fix_deploy.bat` from File Explorer → deploys to Netlify (~2-3 min)

## SUPABASE SQL MIGRATIONS (pending — must be done manually in SQL Editor for project cayymmknkjpiybssiltu)
```sql
GRANT ALL ON profiles TO service_role;
GRANT ALL ON customers TO service_role;
GRANT ALL ON reviews TO service_role;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS free_until timestamptz;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS background_image text;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS has_metrics boolean DEFAULT false;
```

## SUPABASE STORAGE
- Make `qr-assets` bucket public (required for gallery photos, documents, background images)

## KNOWN MINOR ISSUES (no immediate action needed)
- `track-photo.js` — view_count read-then-write race condition. Fix requires Supabase RPC `increment_view_count`.
- `contact.js` — no server-side rate limiting. Low risk (admin-only inbox).
