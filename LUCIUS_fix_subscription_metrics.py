"""
LUCIUS — Fix handleSubscriptionCreated in stripe-webhook.js
Adds metrics_active: true update when a subscription is created.
This covers cases where subscription is created outside of checkout flow.

Run: python3 LUCIUS_fix_subscription_metrics.py
Then: node --check netlify/functions/stripe-webhook.js
"""

import os

TARGET = os.path.join(os.path.dirname(__file__), "netlify", "functions", "stripe-webhook.js")

with open(TARGET, "r", encoding="utf-8") as f:
    content = f.read()

OLD = """    if (customer) {
      // Save subscription ID so we can apply referral discounts later
      await supabase
        .from("customers")
        .update({ stripe_subscription_id: subscriptionId })
        .eq("id", customer.id);
    }"""

NEW = """    if (customer) {
      // Save subscription ID and ensure metrics_active is set
      await supabase
        .from("customers")
        .update({ stripe_subscription_id: subscriptionId, metrics_active: true })
        .eq("id", customer.id);
    }"""

if OLD not in content:
    print("ERROR: Could not find target block. File may have changed.")
    exit(1)

content = content.replace(OLD, NEW, 1)

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(content)

print(f"✅ Fix applied to: {TARGET}")
print("Run: node --check netlify/functions/stripe-webhook.js")
