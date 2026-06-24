"""
LUCIUS — Apply referral program changes to stripe-webhook.js
Adds:
  1. Referral code generation for new customers
  2. Referrer crediting when a referred customer buys Metrics
  3. Stripe discount application based on credit tier
  4. De-crediting when a referred customer cancels
  5. Saves stripe_subscription_id in handleSubscriptionCreated
"""

import re

path = r"/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/stripe-webhook.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ── 1. Add crypto require and helper functions after the existing requires ──────
OLD_REQUIRES = """const { createClient } = require("@supabase/supabase-js");
const { Resend }        = require("resend");
const QRCode            = require("qrcode");
const stripe            = require("stripe")(process.env.STRIPE_SECRET_KEY);"""

NEW_REQUIRES = """const { createClient } = require("@supabase/supabase-js");
const { Resend }        = require("resend");
const QRCode            = require("qrcode");
const stripe            = require("stripe")(process.env.STRIPE_SECRET_KEY);
const crypto            = require("crypto");"""

src = src.replace(OLD_REQUIRES, NEW_REQUIRES, 1)

# ── 2. Add referral helper functions after the escHtml function ──────────────
OLD_ESCAPE = """function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}"""

NEW_ESCAPE = """function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── REFERRAL PROGRAM HELPERS ─────────────────────────────────────

function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function ensureReferralCode(customerId) {
  for (let i = 0; i < 10; i++) {
    const candidate = generateReferralCode();
    const { data: clash } = await supabase
      .from("customers")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!clash) {
      await supabase
        .from("customers")
        .update({ referral_code: candidate })
        .eq("id", customerId);
      return candidate;
    }
  }
  return null;
}

// Discount tiers: 1 ref=20%, 2=40%, 3=60%, 4=80%, 5+=100%
function discountPct(credits) {
  if (credits <= 0) return 0;
  if (credits === 1) return 20;
  if (credits === 2) return 40;
  if (credits === 3) return 60;
  if (credits === 4) return 80;
  return 100;
}

const COUPON_IDS = {
  20: "TORROLINK-REFER-20",
  40: "TORROLINK-REFER-40",
  60: "TORROLINK-REFER-60",
  80: "TORROLINK-REFER-80",
  100: "TORROLINK-REFER-100",
};

async function ensureCoupon(pct, couponId) {
  try {
    await stripe.coupons.retrieve(couponId);
  } catch {
    await stripe.coupons.create({
      id: couponId,
      percent_off: pct,
      duration: "forever",
      name: `Torrolink Referral Reward — ${pct}% off`,
    });
  }
}

async function applyReferralDiscount(subscriptionId, credits) {
  if (!subscriptionId) return;
  const pct = discountPct(credits);
  try {
    if (pct === 0) {
      await stripe.subscriptions.deleteDiscount(subscriptionId).catch(() => {});
      return;
    }
    const couponId = COUPON_IDS[pct];
    if (!couponId) return;
    await ensureCoupon(pct, couponId);
    await stripe.subscriptions.update(subscriptionId, { coupon: couponId });
  } catch (e) {
    console.error("applyReferralDiscount error:", e.message);
  }
}

async function creditReferrer(referralCode) {
  if (!referralCode) return;
  const { data: referrer } = await supabase
    .from("customers")
    .select("id, referral_credits, stripe_subscription_id")
    .eq("referral_code", referralCode)
    .maybeSingle();
  if (!referrer) return;

  const newCredits = (referrer.referral_credits || 0) + 1;
  await supabase
    .from("customers")
    .update({ referral_credits: newCredits })
    .eq("id", referrer.id);

  await applyReferralDiscount(referrer.stripe_subscription_id, newCredits);
}

async function decreditReferrer(referredByCode) {
  if (!referredByCode) return;
  const { data: referrer } = await supabase
    .from("customers")
    .select("id, referral_credits, stripe_subscription_id")
    .eq("referral_code", referredByCode)
    .maybeSingle();
  if (!referrer) return;

  const newCredits = Math.max(0, (referrer.referral_credits || 0) - 1);
  await supabase
    .from("customers")
    .update({ referral_credits: newCredits })
    .eq("id", referrer.id);

  await applyReferralDiscount(referrer.stripe_subscription_id, newCredits);
}"""

src = src.replace(OLD_ESCAPE, NEW_ESCAPE, 1)

# ── 3. After new customer is created, generate referral code ─────────────────
OLD_NEW_CUSTOMER = """      if (existingCustomer) {
      customerId = existingCustomer.id;
      // Back-fill stripe_customer_id if missing (happens when customer was created before this field)
      if (stripeCustomerId && !existingCustomer.stripe_customer_id) {
        await supabase.from("customers").update({ stripe_customer_id: stripeCustomerId }).eq("id", customerId);
      }
      // Update plan on re-purchase / upgrade
      await supabase.from("customers").update({ plan }).eq("id", customerId);
    } else {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          email:              customerEmail,
          name:               customerName,
          stripe_customer_id: stripeCustomerId,
          plan,
          metrics_active:     isMetricsUpgrade,
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }"""

NEW_NEW_CUSTOMER = """      const referredBy = session.metadata?.referredBy || null;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Back-fill stripe_customer_id if missing (happens when customer was created before this field)
      if (stripeCustomerId && !existingCustomer.stripe_customer_id) {
        await supabase.from("customers").update({ stripe_customer_id: stripeCustomerId }).eq("id", customerId);
      }
      // Update plan on re-purchase / upgrade
      await supabase.from("customers").update({ plan }).eq("id", customerId);
    } else {
      const insertData = {
        email:              customerEmail,
        name:               customerName,
        stripe_customer_id: stripeCustomerId,
        plan,
        metrics_active:     isMetricsUpgrade,
      };
      if (referredBy) insertData.referred_by = referredBy;

      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert(insertData)
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;

      // Generate referral code for every new customer
      await ensureReferralCode(customerId);
    }"""

src = src.replace(OLD_NEW_CUSTOMER, NEW_NEW_CUSTOMER, 1)

# ── 4. After metrics upgrade activation, credit referrer ─────────────────────
OLD_METRICS_UPGRADE_RETURN = """      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // ── 2b. UPGRADE: Branding only (customer already has QR) ────"""

NEW_METRICS_UPGRADE_RETURN = """      // Credit referrer if this customer was referred
      const { data: thisCustomer } = await supabase
        .from("customers")
        .select("referred_by")
        .eq("id", customerId)
        .maybeSingle();
      if (thisCustomer?.referred_by) {
        await creditReferrer(thisCustomer.referred_by).catch(e => console.error("creditReferrer error:", e.message));
      }

      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // ── 2b. UPGRADE: Branding only (customer already has QR) ────"""

src = src.replace(OLD_METRICS_UPGRADE_RETURN, NEW_METRICS_UPGRADE_RETURN, 1)

# ── 5. In handleSubscriptionCreated, save subscription ID ────────────────────
OLD_SUB_CREATED = """async function handleSubscriptionCreated(subscription) {
  try {
    const stripeCustomerId = subscription.customer;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    const email = customer?.email || "unknown";
    const amount = (subscription.items?.data?.[0]?.price?.unit_amount / 100 || 0).toFixed(2);
    await resend.emails.send({
      from:    "Torrolink Alerts <orders@torrolink.com>",
      to:      OWNER_EMAIL,
      subject: `💰 New Subscriber: ${email}`,
      html:    `<p><strong>${email}</strong> just subscribed to Metrics &amp; Leads. Amount: $${amount}/mo</p>`,
    }).catch(() => {});
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionCreated error:", err);
    return { statusCode: 500, body: err.message };
  }
}"""

NEW_SUB_CREATED = """async function handleSubscriptionCreated(subscription) {
  try {
    const stripeCustomerId = subscription.customer;
    const subscriptionId   = subscription.id;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (customer) {
      // Save subscription ID so we can apply referral discounts later
      await supabase
        .from("customers")
        .update({ stripe_subscription_id: subscriptionId })
        .eq("id", customer.id);
    }

    const email  = customer?.email || "unknown";
    const amount = (subscription.items?.data?.[0]?.price?.unit_amount / 100 || 0).toFixed(2);
    await resend.emails.send({
      from:    "Torrolink Alerts <orders@torrolink.com>",
      to:      OWNER_EMAIL,
      subject: `💰 New Subscriber: ${email}`,
      html:    `<p><strong>${email}</strong> just subscribed to Metrics &amp; Leads. Amount: $${amount}/mo</p>`,
    }).catch(() => {});
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionCreated error:", err);
    return { statusCode: 500, body: err.message };
  }
}"""

src = src.replace(OLD_SUB_CREATED, NEW_SUB_CREATED, 1)

# ── 6. In handleSubscriptionDeleted, de-credit the referrer ─────────────────
OLD_SUB_DELETED_END = """    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionDeleted error:", err);
    return { statusCode: 500, body: err.message };
  }
}"""

NEW_SUB_DELETED_END = """    // De-credit referrer if this customer was referred
    if (customer) {
      const { data: fullCustomer } = await supabase
        .from("customers")
        .select("referred_by")
        .eq("id", customer.id)
        .maybeSingle();
      if (fullCustomer?.referred_by) {
        await decreditReferrer(fullCustomer.referred_by).catch(e => console.error("decreditReferrer error:", e.message));
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionDeleted error:", err);
    return { statusCode: 500, body: err.message };
  }
}"""

src = src.replace(OLD_SUB_DELETED_END, NEW_SUB_DELETED_END, 1)

# Write output
with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done. stripe-webhook.js updated successfully.")
