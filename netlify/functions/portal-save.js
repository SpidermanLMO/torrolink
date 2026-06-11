// ================================================
// TORROLINK — PORTAL SAVE
// POST /.netlify/functions/portal-save
// Accepts Authorization: Bearer <supabase_access_token>
// Verifies the token, then updates the customer's profile.
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  // ── 1. Verify JWT ────────────────────────────────
  const authHeader = event.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "Missing auth token" });

  // Use Supabase auth admin to get the user from the JWT
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return respond(401, { error: "Invalid or expired session. Please sign in again." });
  }

  const userEmail = user.email;

  // ── 2. Parse body ────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, { error: "Invalid JSON" });
  }

  const {
    profileId,
    businessName,
    tagline,
    bio,
    phone,
    videoUrl,
    ownerName,
    links,
    socials,
    theme,
    leadFormEnabled,
    leadFormHasTextbox,
    leadFormCheckboxes,
    logoBase64,
    headshotBase64,
  } = body;

  if (!profileId) return respond(400, { error: "profileId required" });

  // ── 3. Verify ownership ──────────────────────────
  // The profile must belong to the customer whose email matches the JWT
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id, customer_id, logo_url, photo_url, customers(email)")
    .eq("id", profileId)
    .maybeSingle();

  if (profErr || !profile) {
    return respond(404, { error: "Profile not found" });
  }

  const ownerEmail = profile.customers?.email;
  if (ownerEmail !== userEmail) {
    return respond(403, { error: "You don't have permission to edit this profile." });
  }

  // ── 4. Handle image uploads ──────────────────────
  const uploadImage = async (base64, pathKey) => {
    try {
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const ext    = base64.includes("image/png") ? "png" : "jpg";
      const buffer = Buffer.from(base64Data, "base64");
      const { error: uploadErr } = await supabaseAdmin
        .storage.from("qr-assets")
        .upload(pathKey + "." + ext, buffer, {
          contentType: ext === "png" ? "image/png" : "image/jpeg",
          upsert: true,
        });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabaseAdmin
        .storage.from("qr-assets")
        .getPublicUrl(pathKey + "." + ext);
      return urlData?.publicUrl || null;
    } catch (e) {
      console.error("Image upload failed:", pathKey, e);
      return null;
    }
  }

  let logoUrl     = profile.logo_url  || null;
  let photoUrl    = profile.photo_url || null;

  if (logoBase64)     { const url = await uploadImage(logoBase64,     `logos/${profileId}`);     if (url) logoUrl  = url; }
  if (headshotBase64) { const url = await uploadImage(headshotBase64, `headshots/${profileId}`); if (url) photoUrl = url; }

  // ── 5. Update profile ────────────────────────────
  const updates = {
    business_name: businessName || null,
    tagline:       tagline      || null,
    bio:           bio          || null,
    phone:         phone        || null,
    video_url:     videoUrl     || null,
    owner_name:    ownerName    || null,
    links:         Array.isArray(links) ? links : [],
    socials:       socials || {},
    theme:                theme   || {},
    lead_form_enabled:    typeof leadFormEnabled === 'boolean' ? leadFormEnabled : false,
    lead_form_has_textbox: typeof leadFormHasTextbox === 'boolean' ? leadFormHasTextbox : false,
    lead_form_checkboxes: Array.isArray(leadFormCheckboxes) ? leadFormCheckboxes : [],
    logo_url:             logoUrl,
    photo_url:            photoUrl,
    updated_at:    new Date().toISOString(),
  };

  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (updateErr) {
    console.error("Profile update error:", updateErr);
    return respond(500, { error: "Failed to save profile. Please try again." });
  }

  return respond(200, { ok: true });
};

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
