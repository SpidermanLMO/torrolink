# Technical Context — TorroLink

## CRITICAL: The Template Literal Trap (portal.js)

**This is the most important thing to know about portal.js.**

`portal.js` is a Node.js serverless function that wraps the ENTIRE 1900-line HTML page — including all embedded `<script>` JavaScript — in a single Node.js template literal:

```javascript
const html = `<!DOCTYPE html>...[entire page]...`;
```

**The trap:** Node.js processes escape sequences inside template literals BEFORE sending the HTML to the browser. This means:
- `\'` in the source → `'` in the browser (backslash consumed)
- `\/` in the source → `/` in the browser
- `\.` in the source → `.` in the browser
- `\\` in the source → `\` in the browser

**Symptoms:** SyntaxErrors in the browser console (`Unexpected string`, `Unexpected token`, `Invalid regular expression flags`) that crash the entire `<script>` block, preventing ALL functions from loading. This is why the Sign In button "does nothing" — `signInWithPassword` was never defined.

**Fixes applied (June 17 2026):**
1. `buildPatternGrid()` onclick handlers — use `&apos;` instead of `\'` for HTML attribute quoting
2. Password strength regex `var sym = /[...]/` — doubled all backslashes (`\[` → `\\[`, `\'` → `\\'`, `\/` → `\\/`, `\\` → `\\\\`)
3. URL protocol check `!/^https?:\/\//i` — doubled `\/` to `\\/`
4. Gallery/document innerHTML strings (15 lines, 1742-1772) — doubled all `\'` to `\\'`
5. File extension regex `/\.[^.]+$/` — doubled `\.` to `\\.`

**Rule going forward:** Any `\X` pattern inside portal.js that's inside the JS `<script>` block needs doubled backslashes. Use `&apos;` for single quotes in HTML attribute onclick handlers. Verify with `node --check` (simulating template evaluation first).

## CIFS File Editing Rule

**NEVER use the Edit tool on large files** (portal.js, profile.js, admin.js, etc.) when working via the Cowork filesystem. Use Python scripts via bash instead:

```python
path = '/sessions/tender-stoic-dirac/mnt/Torrolink/netlify/functions/portal.js'
with open(path, 'r', encoding='utf-8') as f:
    src = f.read()
# Make changes to src
src = src.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(src)
```

Bash writes may not sync to Windows/git immediately — use file tools (Read/Write) for final verification.

## Deploy Flow

1. Make code changes via Python/bash
2. Update `_fix_deploy.bat` commit message
3. User double-clicks `_fix_deploy.bat`
4. Script: clears git lock → `git add -A` → `git commit` → `git push origin main`
5. Netlify auto-deploys in 2-3 minutes
6. Verify: Chrome MCP → navigate to portal → check console for errors

## Verifying Portal JS Health

```javascript
// Run in Chrome DevTools or via Chrome MCP javascript_tool:
const fns = ['signInWithPassword','createAccount','signOut','saveProfile',
  'buildPatternGrid','togglePatternGroup','selectPattern'];
const r = {}; fns.forEach(f => r[f] = typeof window[f]); r
// All should be "function"
```

Zero console errors on page load = clean. Any SyntaxError = script crashed, nothing works.

## Supabase Notes

- Project ID: `cayymmknkjpiybssiltu`
- Go to: https://app.supabase.com → find project with that ID in URL
- SQL Editor: run migrations from LAUNCH_CHECKLIST.md before launch
- service_role key: server-side only, never in browser/client code
- anon key: safe for client-side (used in portal.js Supabase JS client)

## Stripe Notes

- Currently on TEST mode (`sk_test_51Tfs7N7y...`)
- Test webhooks have different signing secrets than live webhooks
- To go live: swap STRIPE_SECRET_KEY in Netlify + create NEW webhook endpoint in Stripe Live mode + update STRIPE_WEBHOOK_SECRET
- Webhook URL: `https://torrolink.com/.netlify/functions/stripe-webhook`
- Events needed: checkout.session.completed, customer.subscription.created/deleted, invoice.payment_succeeded/failed

## Resend (Email)

- API key in Netlify env var RESEND_API_KEY
- Sending domain: torrolink.com (orders@torrolink.com)
- Must verify SPF/DKIM records in Resend dashboard → DNS provider
- Without this, order confirmation emails land in spam

## Bash Session Path

When the Torrolink folder is connected in Cowork, the bash path is:
`/sessions/tender-stoic-dirac/mnt/Torrolink/`

## node --check Pattern

When validating portal.js syntax, simulate template evaluation first:
```bash
# Extract the HTML/JS content (skip first 11 lines of Node wrapper)
# Replace \` with real backtick, \' with ' to simulate template evaluation
# Then run node --check on the result
```
