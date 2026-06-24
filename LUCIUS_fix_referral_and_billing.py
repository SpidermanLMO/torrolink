"""
LUCIUS — Fix referral + billing-agent bugs

Fixes:
1. stripe-webhook.js: extract referredBy from Stripe metadata and save to customers.referred_by
2. billing-agent.js: fix dead /billing link → /portal
3. billing-agent.js: add base64 body handling for Stripe signature verification

Run: python3 LUCIUS_fix_referral_and_billing.py
Then verify with: node --check netlify/functions/stripe-webhook.js
                  node --check netlify/functions/billing-agent.js
"""

import os
import sys

BASE = os.path.dirname(__file__)


# ── FIX 1: stripe-webhook.js — referredBy not saved to customers.referred_by ──

WEBHOOK = os.path.join(BASE, "netlify", "functions", "stripe-webhook.js")

with open(WEBHOOK, "r", encoding="utf-8") as f:
    content = f.read()

# 1a. Extract referredBy from session metadata
OLD_META = """  const addMetrics    = session.metadata?.addMetrics === "true";
  const stripeCustomerId = session.customer || null;"""

NEW_META = """  const addMetrics    = session.metadata?.addMetrics === "true";
  const referredBy    = (session.metadata?.referredBy || "").trim() || null;
  const stripeCustomerId = session.customer || null;"""

if OLD_META not in content:
    print("ERROR: Could not find metadata block in stripe-webhook.js")
    sys.exit(1)

content = content.replace(OLD_META, NEW_META, 1)

# 1b. Save referred_by in the customer INSERT
OLD_INSERT = """        .insert({
          email:              customerEmail,
          name:               customerName,
          stripe_customer_id: stripeCustomerId,
          plan,
          metrics_active:     isMetricsUpgrade,
        })"""

NEW_INSERT = """        .insert({
          email:              customerEmail,
          name:               customerName,
          stripe_customer_id: stripeCustomerId,
          plan,
          metrics_active:     isMetricsUpgrade,
          referred_by:        referredBy || null,
        })"""

if OLD_INSERT not in content:
    print("ERROR: Could not find customer INSERT block in stripe-webhook.js")
    sys.exit(1)

content = content.replace(OLD_INSERT, NEW_INSERT, 1)

with open(WEBHOOK, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched: stripe-webhook.js — referredBy now saved to customers.referred_by")


# ── FIX 2 + 3: billing-agent.js — dead /billing link + base64 body handling ──

BILLING = os.path.join(BASE, "netlify", "functions", "billing-agent.js")

with open(BILLING, "r", encoding="utf-8") as f:
    bc = f.read()

# Fix dead /billing link
OLD_LINK = 'href="https://torrolink.com/billing"'
NEW_LINK = 'href="https://torrolink.com/portal"'

if OLD_LINK not in bc:
    print("WARNING: /billing link not found in billing-agent.js — may already be fixed")
else:
    bc = bc.replace(OLD_LINK, NEW_LINK, 1)
    print("Patched: billing-agent.js — /billing → /portal")

# Fix base64 body handling for Stripe signature verification
OLD_SIG = """  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );"""

NEW_SIG = """  // Netlify may base64-encode the raw body; decode it first so the
  // HMAC is computed against the exact bytes Stripe signed.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );"""

if OLD_SIG not in bc:
    print("WARNING: Stripe constructEvent block not found in billing-agent.js — may already be fixed")
else:
    bc = bc.replace(OLD_SIG, NEW_SIG, 1)
    print("Patched: billing-agent.js — base64 body handling added to Stripe signature verification")

with open(BILLING, "w", encoding="utf-8") as f:
    f.write(bc)

print("")
print("All patches applied. Run:")
print("  node --check netlify/functions/stripe-webhook.js")
print("  node --check netlify/functions/billing-agent.js")
