// ================================================
// TORROLINK — DELETE MEDIA
// POST /.netlify/functions/delete-media
// Body: { token, type: 'photo'|'document', itemId }
// Deletes from Supabase Storage + DB; verifies ownership
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { token, type, itemId } = body;
  if (!token || !type || !itemId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // ── Verify auth ───────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // ── Get profile (for ownership check) ────────────────────────────
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const table = type === "photo" ? "profile_photos" : "profile_documents";

  // ── Fetch record ──────────────────────────────────────────────────
  const { data: record } = await supabaseAdmin
    .from(table)
    .select("id, file_path, profile_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!record) {
    return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
  }
  if (record.profile_id !== profile?.id) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── Delete from Storage ───────────────────────────────────────────
  if (record.file_path) {
    const { error: storageErr } = await supabaseAdmin
      .storage.from("qr-assets")
      .remove([record.file_path]);
    if (storageErr) console.error("Storage delete error:", storageErr);
  }

  // ── Delete from DB ────────────────────────────────────────────────
  const { error: dbErr } = await supabaseAdmin.from(table).delete().eq("id", itemId);
  if (dbErr) {
    return { statusCode: 500, body: JSON.stringify({ error: "DB delete failed: " + dbErr.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
