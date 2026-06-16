// ================================================
// TORROLINK — TRACK PHOTO VIEW
// POST /.netlify/functions/track-photo
// Body: { photoId }
// Increments view_count. No auth required (public action).
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const { photoId } = body;
  if (!photoId) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  // Atomic increment using RPC or fetch+update
  const { data: photo } = await supabaseAdmin
    .from("profile_photos")
    .select("id, view_count")
    .eq("id", photoId)
    .maybeSingle();

  if (photo) {
    await supabaseAdmin
      .from("profile_photos")
      .update({ view_count: (photo.view_count || 0) + 1 })
      .eq("id", photoId);
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
