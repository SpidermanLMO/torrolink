// ================================================
// TORROLINK — PORTAL LOAD
// GET /.netlify/functions/portal-load
// Verifies JWT via service_role (bypasses client-side RLS entirely).
// Returns { customer, profile }.
// Auto-creates customer + profile if they don't exist yet (new self-signups).
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

function randStr(len) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function emailToHandle(email) {
  const user = (email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14);
  return (user || "user") + randStr(5);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method not allowed" });
  }

  // ── 1. Verify JWT ────────────────────────────────────────────────────────────
  const authHeader = event.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "Missing auth token" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return respond(401, { error: "Invalid or expired session. Please sign in again." });
  }

  const email = user.email;

  // ── 2. Load or auto-create customer ─────────────────────────────────────────
  let { data: customer, error: cLoadErr } = await supabaseAdmin
    .from("customers")
    .select("id, plan, metrics_active, email, free_until")
    .eq("email", email)
    .maybeSingle();

  if (!customer) {
    // New self-signup — create customer row now
    const { data: newCustomer, error: cCreateErr } = await supabaseAdmin
      .from("customers")
      .insert({ email, plan: "free", metrics_active: false })
      .select("id, plan, metrics_active, email, free_until")
      .single();

    if (cCreateErr || !newCustomer) {
      console.error("portal-load: failed to create customer:", cCreateErr);
      return respond(500, {
        error: "Could not set up your account. Please contact support at orders@torrolink.com",
      });
    }
    customer = newCustomer;
  }

  // ── 3. Load or auto-create profile ──────────────────────────────────────────
  let { data: profile, error: pLoadErr } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    // No profile yet — create one with a unique handle + code
    let profileData = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const handle = emailToHandle(email);
      const code = randStr(6);

      const { data: p, error: pCreateErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          customer_id: customer.id,
          handle,
          code,
          is_active: true,
        })
        .select("*")
        .single();

      if (p) { profileData = p; break; }

      // Only retry on unique-constraint violations
      const isUnique = pCreateErr?.message?.includes("unique") ||
                       pCreateErr?.message?.includes("duplicate") ||
                       pCreateErr?.code === "23505";
      if (!isUnique) {
        console.error("portal-load: profile insert error:", pCreateErr);
        return respond(500, {
          error: "Could not create your profile. Please contact support at orders@torrolink.com",
        });
      }
    }

    if (!profileData) {
      return respond(500, {
        error: "Could not generate a unique profile ID. Please try again.",
      });
    }
    profile = profileData;
  }

  // ── 4. Return data ───────────────────────────────────────────────────────────
  return respond(200, { customer, profile });
};
