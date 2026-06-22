"""
LUCIUS — Apply billing-agent.js fix
Wires Supabase metrics_active updates into the Stripe webhook handler.

What this fixes:
- customer.subscription.created  → sets metrics_active = true in Supabase
- customer.subscription.deleted  → sets metrics_active = false in Supabase

Run: python3 LUCIUS_apply_billing_metrics_fix.py
Then: node --check netlify/functions/billing-agent.js
"""

import os

TARGET = os.path.join(os.path.dirname(__file__), "netlify", "functions", "billing-agent.js")

with open(TARGET, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add supabase import after the resend import
OLD_IMPORT = 'const { Resend } = require("resend");\nconst resend = new Resend(process.env.RESEND_API_KEY);'
NEW_IMPORT = ('const { Resend } = require("resend");\n'
              'const { createClient } = require("@supabase/supabase-js");\n'
              'const resend = new Resend(process.env.RESEND_API_KEY);')

if OLD_IMPORT not in content:
    print("ERROR: Could not find import block to patch. File may have changed.")
    exit(1)

content = content.replace(OLD_IMPORT, NEW_IMPORT, 1)

# 2. After the new subscription email, add Supabase metrics_active = true
OLD_SUB_CREATED = (
    '        await resend.emails.send({\n'
    '          from: "Torrolink Billing <billing@torrolink.com>",\n'
    '          to: OWNER_EMAIL,\n'
    '          subject: `\U0001f4b0 New Subscriber: ${customer.email}`,\n'
    '          html: `<p><strong>${customer.name || customer.email}</strong> just subscribed to <strong>${data.items.data[0]?.price?.nickname || "a plan"}</strong>.</p><p>Amount: $${(data.items.data[0]?.price?.unit_amount / 100).toFixed(2)}/mo</p>`,\n'
    '        });\n'
    '        break;\n'
    '      }'
)

NEW_SUB_CREATED = (
    '        await resend.emails.send({\n'
    '          from: "Torrolink Billing <billing@torrolink.com>",\n'
    '          to: OWNER_EMAIL,\n'
    '          subject: `\U0001f4b0 New Subscriber: ${customer.email}`,\n'
    '          html: `<p><strong>${customer.name || customer.email}</strong> just subscribed to <strong>${data.items.data[0]?.price?.nickname || "a plan"}</strong>.</p><p>Amount: $${(data.items.data[0]?.price?.unit_amount / 100).toFixed(2)}/mo</p>`,\n'
    '        });\n'
    '        // Unlock metrics dashboard in Supabase\n'
    '        const supabaseOnCreate = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);\n'
    '        await supabaseOnCreate.from("customers").update({ metrics_active: true }).eq("email", customer.email);\n'
    '        break;\n'
    '      }'
)

# 3. After the cancellation email, add Supabase metrics_active = false
OLD_SUB_DELETED = (
    '        await resend.emails.send({\n'
    '          from: "Torrolink Billing <billing@torrolink.com>",\n'
    '          to: OWNER_EMAIL,\n'
    '          subject: `\U0001f4c9 Cancellation: ${customer.email}`,\n'
    '          html: `<p><strong>${customer.email}</strong> has cancelled their subscription. Consider a win-back email.</p>`,\n'
    '        });\n'
    '        break;\n'
    '      }\n'
    '    }\n'
    '\n'
    '    return respond(200, { received: true });'
)

NEW_SUB_DELETED = (
    '        await resend.emails.send({\n'
    '          from: "Torrolink Billing <billing@torrolink.com>",\n'
    '          to: OWNER_EMAIL,\n'
    '          subject: `\U0001f4c9 Cancellation: ${customer.email}`,\n'
    '          html: `<p><strong>${customer.email}</strong> has cancelled their subscription. Consider a win-back email.</p>`,\n'
    '        });\n'
    '        // Lock metrics dashboard in Supabase\n'
    '        const supabaseOnDelete = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);\n'
    '        await supabaseOnDelete.from("customers").update({ metrics_active: false }).eq("email", customer.email);\n'
    '        break;\n'
    '      }\n'
    '    }\n'
    '\n'
    '    return respond(200, { received: true });'
)

if OLD_SUB_CREATED not in content:
    print("WARNING: Could not find subscription.created block — string mismatch.")
    print("Manual patch needed. See LUCIUS_FIX_billing_metrics.md for the change.")
else:
    content = content.replace(OLD_SUB_CREATED, NEW_SUB_CREATED, 1)
    print("Patched: customer.subscription.created -> metrics_active = true")

if OLD_SUB_DELETED not in content:
    print("WARNING: Could not find subscription.deleted block — string mismatch.")
    print("Manual patch needed. See LUCIUS_FIX_billing_metrics.md for the change.")
else:
    content = content.replace(OLD_SUB_DELETED, NEW_SUB_DELETED, 1)
    print("Patched: customer.subscription.deleted -> metrics_active = false")

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done. Run: node --check netlify/functions/billing-agent.js")
