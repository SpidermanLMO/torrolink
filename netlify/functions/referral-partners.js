// ================================================
// TORROLINK — REFERRAL PARTNER TRACKER
// POST /.netlify/functions/referral-partners
// Auth: Authorization: Bearer <supabase_access_token>
//
// Actions (sent as JSON body):
//   list         → returns partners + logs for a profile
//   add          → create a new partner
//   update       → edit partner fields
//   delete       → remove a partner (cascades logs)
//   log          → add a referral log entry for a partner
//   delete-log   → remove a specific log entry
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function respond(status, data) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

function escText(s) {
  return String(s || "").trim().slice(0, 500);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  // ── 1. Verify JWT ──────────────────────────────────────────────
  const authHeader = event.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "Missing auth token" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return respond(401, { error: "Invalid or expired session" });

  const userEmail = user.email;

  // ── 2. Parse body ───────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return respond(400, { error: "Invalid JSON" }); }

  const { action, profileId, partnerId, logId } = body;
  if (!action) return respond(400, { error: "Missing action" });

  // ── 3. Verify profile ownership ────────────────────────────────
  // Look up customer by email, then verify profileId belongs to them
  if (!profileId) return respond(400, { error: "Missing profileId" });

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("email", userEmail)
    .maybeSingle();

  if (!customer) return respond(403, { error: "No account found" });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!profile) return respond(403, { error: "Profile not found or not yours" });

  // ── 4. Route actions ────────────────────────────────────────────

  // LIST: return all partners + their referral logs
  if (action === "list") {
    const { data: partners, error } = await supabaseAdmin
      .from("referral_partners")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });

    if (error) return respond(500, { error: "DB error" });

    // Fetch all logs for this profile in one query
    const { data: logs } = await supabaseAdmin
      .from("referral_logs")
      .select("*")
      .eq("profile_id", profileId)
      .order("logged_at", { ascending: false });

    // Attach logs to their partners
    const logsMap = {};
    (logs || []).forEach(log => {
      if (!logsMap[log.partner_id]) logsMap[log.partner_id] = [];
      logsMap[log.partner_id].push(log);
    });

    const result = (partners || []).map(p => ({
      ...p,
      logs: logsMap[p.id] || [],
    }));

    return respond(200, { partners: result });
  }

  // ADD partner
  if (action === "add") {
    const { name, company, category, email, phone, notes } = body;
    if (!name) return respond(400, { error: "Name required" });

    const { data, error } = await supabaseAdmin
      .from("referral_partners")
      .insert({
        profile_id: profileId,
        name:       escText(name),
        company:    escText(company),
        category:   escText(category) || "other",
        email:      escText(email),
        phone:      escText(phone),
        notes:      escText(notes),
      })
      .select()
      .single();

    if (error) return respond(500, { error: "Failed to add partner" });
    return respond(200, { partner: { ...data, logs: [] } });
  }

  // UPDATE partner
  if (action === "update") {
    if (!partnerId) return respond(400, { error: "Missing partnerId" });
    const { name, company, category, email, phone, notes } = body;

    const updates = {};
    if (name    !== undefined) updates.name     = escText(name);
    if (company !== undefined) updates.company  = escText(company);
    if (category!== undefined) updates.category = escText(category);
    if (email   !== undefined) updates.email    = escText(email);
    if (phone   !== undefined) updates.phone    = escText(phone);
    if (notes   !== undefined) updates.notes    = escText(notes);

    const { data, error } = await supabaseAdmin
      .from("referral_partners")
      .update(updates)
      .eq("id", partnerId)
      .eq("profile_id", profileId)
      .select()
      .single();

    if (error) return respond(500, { error: "Failed to update partner" });
    return respond(200, { partner: data });
  }

  // DELETE partner (cascades to referral_logs)
  if (action === "delete") {
    if (!partnerId) return respond(400, { error: "Missing partnerId" });

    const { error } = await supabaseAdmin
      .from("referral_partners")
      .delete()
      .eq("id", partnerId)
      .eq("profile_id", profileId);

    if (error) return respond(500, { error: "Failed to delete partner" });
    return respond(200, { ok: true });
  }

  // LOG a referral from a partner
  if (action === "log") {
    if (!partnerId) return respond(400, { error: "Missing partnerId" });

    // Verify partnerId belongs to this profile
    const { data: partner } = await supabaseAdmin
      .from("referral_partners")
      .select("id")
      .eq("id", partnerId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!partner) return respond(403, { error: "Partner not found" });

    const { data, error } = await supabaseAdmin
      .from("referral_logs")
      .insert({
        partner_id: partnerId,
        profile_id: profileId,
        notes:      escText(body.notes),
      })
      .select()
      .single();

    if (error) return respond(500, { error: "Failed to log referral" });
    return respond(200, { log: data });
  }

  // DELETE a referral log entry
  if (action === "delete-log") {
    if (!logId) return respond(400, { error: "Missing logId" });

    const { error } = await supabaseAdmin
      .from("referral_logs")
      .delete()
      .eq("id", logId)
      .eq("profile_id", profileId);

    if (error) return respond(500, { error: "Failed to delete log" });
    return respond(200, { ok: true });
  }

  return respond(400, { error: "Unknown action" });
};
