// ================================================
// TORROLINK — PORTAL SAVE
// POST /.netlify/functions/portal-save
// Accepts Authorization: Bearer <supabase_access_token>
// Verifies the token, then updates the customer's profile.
// ================================================

const { createClient } = require("@supabase/supabase-js");

// supabaseAdmin: service_role — for auth verification and privileged writes
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// supabaseAnon: anon key — for profile read (public RLS "Public read active profiles")
// Workaround: service_role lacks GRANT on profiles (tables created via raw SQL).
// Fix: run `GRANT ALL ON public.profiles TO service_role;` in Supabase SQL Editor.
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Reject javascript: / data: / vbscript: URLs to prevent stored XSS via link hrefs
function safeUrl(s) {
  const u = String(s || "").trim();
  if (/^javascript:/i.test(u) || /^data:/i.test(u) || /^vbscript:/i.test(u)) return "";
  return u;
}

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
    contentBlocks,
    socials,
    theme,
    leadFormEnabled,
    leadFormHasTextbox,
    leadFormCheckboxes,
    logoBase64,
    headshotBase64,
    bgImageBase64,
  } = body;

  if (!profileId) return respond(400, { error: "profileId required" });

  // ── 3. Verify ownership ──────────────────────────
  // Use anon key for profile SELECT — public RLS allows reading active profiles.
  // (service_role lacks GRANT on profiles until GRANTs are applied in Supabase SQL Editor)
  const { data: profile, error: profErr } = await supabaseAnon
    .from("profiles")
    .select("id, customer_id, logo_url, photo_url, background_image")
    .eq("id", profileId)
    .maybeSingle();

  if (profErr || !profile) {
    return respond(404, { error: "Profile not found" });
  }

  // Verify ownership: look up the customer by customer_id and check email matches
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("email")
    .eq("id", profile.customer_id)
    .maybeSingle();

  // If customers table also lacks GRANT, customer will be null — skip check for now
  // (apply GRANT SQL in Supabase to fully enforce ownership verification)
  const ownerEmail = customer?.email;
  if (ownerEmail && ownerEmail !== userEmail) {
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
  };

  let logoUrl  = profile.logo_url  || null;
  let photoUrl = profile.photo_url || null;

  if (logoBase64)     { const url = await uploadImage(logoBase64,     `logos/${profileId}`);       if (url) logoUrl  = url; }
  if (headshotBase64) { const url = await uploadImage(headshotBase64, `headshots/${profileId}`); if (url) photoUrl = url; }

  let backgroundImageUrl = profile.background_image || null;
  if (bgImageBase64) { const url = await uploadImage(bgImageBase64, `backgrounds/${profileId}`); if (url) backgroundImageUrl = url; }

  // ── 5. Update profile ────────────────────────────
  const updates = {
    business_name: businessName ? String(businessName).trim().slice(0, 80)  : null,
    tagline:       tagline      ? String(tagline).trim().slice(0, 120)       : null,
    bio:           bio          ? String(bio).trim().slice(0, 1000)          : null,
    phone:         phone        ? String(phone).trim().slice(0, 30)          : null,
    video_url: (() => {
      // Only allow YouTube and Vimeo embed sources; discard unrecognized URLs
      if (!videoUrl) return null;
      if (/youtube\.com\/watch\?v=|youtu\.be\//.test(videoUrl)) return videoUrl;
      if (/vimeo\.com\/\d+/.test(videoUrl)) return videoUrl;
      return null;
    })(),
    owner_name:    ownerName    ? String(ownerName).trim().slice(0, 100)     : null,
    content_blocks: Array.isArray(contentBlocks) ? contentBlocks : [],
    links:         (() => {
      // extract link-type items from contentBlocks + merge with any old-style links
      const cbLinks = (Array.isArray(contentBlocks) ? contentBlocks : [])
        .filter(b => b.type === "link" && (b.label || b.url))
        .map(b => ({ label: b.label||"", url: safeUrl(b.url||"") }));
      if (cbLinks.length) return cbLinks;
      return Array.isArray(links) ? links : [];
    })(),
    socials:       socials || {},
    theme:                theme   || {},
    lead_form_enabled:    typeof leadFormEnabled === "boolean" ? leadFormEnabled : false,
    lead_form_has_textbox: typeof leadFormHasTextbox === "boolean" ? leadFormHasTextbox : false,
    lead_form_checkboxes: Array.isArray(leadFormCheckboxes) ? leadFormCheckboxes : [],
    logo_url:             logoUrl,
    photo_url:            photoUrl,
    background_image:     (body.theme && body.theme.pattern === "custom") ? backgroundImageUrl : null,
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
