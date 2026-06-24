"""
LUCIUS — Apply referral ?ref= param capture to script.js
Adds:
  1. Read ?ref= from URL on page load, store in sessionStorage
  2. Pass referralCode to create-checkout in submitCheckoutModal
"""

path = r"/sessions/nice-vigilant-sagan/mnt/Torrolink/script.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ── 1. Capture ?ref= param near the top of the file ─────────────
# Insert after the first 'use strict' or at the very top before first function
# We'll insert it right after the closing of the DOMContentLoaded block that
# handles smooth scrolling (first block in the file, around line 33)

OLD_SCROLL = """document.querySelectorAll('a[href^="#"]').forEach(anchor => {"""

NEW_SCROLL = """// ── Referral code capture ─────────────────────────────────────
// If someone visits torrolink.com/?ref=ABCD1234, save the code so
// it gets passed to checkout and the referrer gets credit.
(function captureRefCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^[A-F0-9]{8}$/i.test(ref)) {
      sessionStorage.setItem('tl_ref', ref.toUpperCase());
    }
  } catch(e) {}
})();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {"""

src = src.replace(OLD_SCROLL, NEW_SCROLL, 1)

# ── 2. Pass referralCode in submitCheckoutModal fetch ────────────
OLD_FETCH = """    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: _pendingPlan,
        businessName,
        customerEmail: customerEmail || undefined,
        addMetrics: addMetrics || undefined,
      }),
    });"""

NEW_FETCH = """    const _refCode = (function() {
      try { return sessionStorage.getItem('tl_ref') || undefined; } catch(e) { return undefined; }
    })();

    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: _pendingPlan,
        businessName,
        customerEmail: customerEmail || undefined,
        addMetrics: addMetrics || undefined,
        referredBy: _refCode,
      }),
    });"""

src = src.replace(OLD_FETCH, NEW_FETCH, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done. script.js updated successfully.")
