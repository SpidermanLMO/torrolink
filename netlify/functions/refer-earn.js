// ================================================
// TORROLINK — REFER & EARN
// POST /.netlify/functions/refer-earn
// Auth: Authorization: Bearer <supabase_access_token>
//
// Actions (sent as JSON body):
//   get  → returns referral code, credits, discount tier, referred list
//
// Discount tiers (active referrals = people still paying for Metrics):
//   1 referral  → 20% off  ($8.22/mo)
//   2 referrals → 40% off  ($6.17/mo)
//   3 referrals → 60% off  ($4.11/mo)
//   4 referrals → 80% off  ($2.06/mo)
//   5+ referrals → FREE    ($0/mo)
// ================================================

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function respond(status, data) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  };
}

function getDiscount(credits) {
  if (credits <= 0) return { pct: 0,   label: "No discount yet",  nextAt: 1,    nextLabel: "20% off ($8.22/mo)" };
  if (credits === 1) return { pct: 20,  label: "20% off",          nextAt: 2,    nextLabel: "40% off ($6.17/mo)" };
  if (credits === 2) return { pct: 40,  label: "40% off",          nextAt: 3,    nextLabel: "60% off ($4.11/mo)" };
  if (credits === 3) return { pct: 60,  label: "60% off",          nextAt: 4,    nextLabel: "80% off ($2.06/mo)" };
  if (credits === 4) return { pct: 80,  label: "80% off",          nextAt: 5,    nextLabel: "FREE 🎉"            };
  return                     { pct: 100, label: "FREE 🎉",          nextAt: null, nextLabel: null                 };
}

function generateCode() {
  // 8 uppercase hex chars — easy to share verbally
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function ensureReferralCode(customerId) {
  for (let i = 0; i < 10; i++) {
    const candidate = generateCode();
    const { data: clash } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!clash) {
      await supabaseAdmin
        .from("customers")
        .update({ referral_code: candidate })
        .eq("id", customerId);
      return candidate;
    }
  }
  return null; // extremely unlikely
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  // ── 1. Verify JWT ──────────────────────────────────────────────
  const token = (event.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "Missing auth token" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return respond(401, { error: "Invalid or expired session" });

  // ── 2. Get customer ────────────────────────────────────────────
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, referral_code, referral_credits, plan, metrics_active, stripe_subscription_id")
    .eq("email", user.email)
    .maybeSingle();

  if (!customer) return respond(404, { error: "No account found" });

  // ── 3. Ensure referral code exists ─────────────────────────────
  let referralCode = customer.referral_code;
  if (!referralCode) {
    referralCode = await ensureReferralCode(customer.id);
  }

  // ── 4. Build response ──────────────────────────────────────────
  const credits  = customer.referral_credits || 0;
  const discount = getDiscount(credits);
  const hasMetrics = !!(customer.metrics_active || customer.plan === "metrics");

  // Fetch referred customers (who signed up using this code)
  const { data: referred } = await supabaseAdmin
    .from("customers")
    .select("name, email, created_at, metrics_active, plan")
    .eq("referred_by", referralCode || "NONE")
    .order("created_at", { ascending: false });

  const SITE = process.env.DEPLOY_URL || "https://torrolink.com";
  const referralLink = referralCode ? `${SITE}/?ref=${referralCode}` : null;

  return respond(200, {
    referralCode,
    referralLink,
    credits,
    discount,
    hasMetrics,
    referred: (referred || []).map(r => ({
      name:     r.name || r.email.split("@")[0],
      active:   !!(r.metrics_active || r.plan === "metrics"),
      joinedAt: r.created_at,
    })),
  });
};
