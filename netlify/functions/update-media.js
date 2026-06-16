// ================================================
// TORROLINK — UPDATE MEDIA METADATA
// POST /.netlify/functions/update-media
// Body: { token, type: 'photo'|'document', itemId, caption?, title? }
// Updates caption (photos) or title (documents)
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

  const { token, type, itemId, caption, title } = body;
  if (!token || !type || !itemId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // ── Verify auth ───────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // ── Get profile ───────────────────────────────────────────────────
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

  if (!profile) return { statusCode: 404, body: JSON.stringify({ error: "No profile" }) };

  const table = type === "photo" ? "profile_photos" : "profile_documents";
  const updates = type === "photo"
    ? { caption: caption ?? "" }
    : { title: title || "Document" };

  const { error: updateErr } = await supabaseAdmin
    .from(table)
    .update(updates)
    .eq("id", itemId)
    .eq("profile_id", profile.id);

  if (updateErr) {
    return { statusCode: 500, body: JSON.stringify({ error: updateErr.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
