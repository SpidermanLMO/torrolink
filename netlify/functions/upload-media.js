// ================================================
// TORROLINK — UPLOAD MEDIA
// POST /.netlify/functions/upload-media
// Body: { token, type: 'photo'|'document', base64, filename, caption, title }
// Uploads to Supabase Storage (qr-assets bucket), saves metadata to DB
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

  const { token, type, base64, filename, caption = "", title = "Document" } = body;

  if (!token || !type || !base64 || !filename) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }
  if (!["photo", "document"].includes(type)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid type" }) };
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
  if (!customer) return { statusCode: 404, body: JSON.stringify({ error: "No customer found" }) };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!profile) return { statusCode: 404, body: JSON.stringify({ error: "No profile found" }) };

  const profileId = profile.id;

  // ── Decode base64 ─────────────────────────────────────────────────
  const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const maxSize = type === "photo" ? 8 * 1024 * 1024 : 20 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `File too large (max ${type === "photo" ? "8 MB" : "20 MB"})` }),
    };
  }

  // ── Build storage path ────────────────────────────────────────────
  const ext = (filename.split(".").pop() || "").toLowerCase() || (type === "photo" ? "jpg" : "pdf");
  const uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const folder = type === "photo" ? "gallery" : "documents";
  const storagePath = `${folder}/${profileId}/${uid}.${ext}`;

  const mimeMap = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  const contentType = mimeMap[ext] || (type === "photo" ? "image/jpeg" : "application/octet-stream");

  // ── Upload to Storage ─────────────────────────────────────────────
  const { error: uploadErr } = await supabaseAdmin
    .storage.from("qr-assets")
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (uploadErr) {
    console.error("Storage upload error:", uploadErr);
    return { statusCode: 500, body: JSON.stringify({ error: "Upload failed: " + uploadErr.message }) };
  }

  const { data: urlData } = supabaseAdmin.storage.from("qr-assets").getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl;

  // ── Save metadata to DB ───────────────────────────────────────────
  const table = type === "photo" ? "profile_photos" : "profile_documents";

  const { data: existing } = await supabaseAdmin
    .from(table)
    .select("sort_order")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (existing?.sort_order ?? -1) + 1;

  let insertData;
  if (type === "photo") {
    insertData = { profile_id: profileId, caption, file_url: publicUrl, file_path: storagePath, sort_order: sortOrder };
  } else {
    insertData = {
      profile_id: profileId, title, file_url: publicUrl, file_path: storagePath,
      file_type: ext, sort_order: sortOrder,
    };
  }

  const { data: record, error: dbErr } = await supabaseAdmin
    .from(table)
    .insert(insertData)
    .select("*")
    .single();

  if (dbErr) {
    console.error("DB insert error:", dbErr);
    return { statusCode: 500, body: JSON.stringify({ error: "DB insert failed: " + dbErr.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, item: record }) };
};
