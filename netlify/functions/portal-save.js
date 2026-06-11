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
    links,
    socials,
    logoBase64,
  } = body;

  if (!profileId) return respond(400, { error: "profileId required" });

  // ── 3. Verify ownership ──────────────────────────
  // The profile must belong to the customer whose email matches the JWT
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id, customer_id, logo_url, customers(email)")
    .eq("id", profileId)
    .maybeSingle();

  if (profErr || !profile) {
    return respond(404, { error: "Profile not found" });
  }

  const ownerEmail = profile.customers?.email;
  if (ownerEmail !== userEmail) {
    return respond(403, { error: "You don't have permission to edit this profile." });
  }

  // ── 4. Handle logo upload ────────────────────────
  let logoUrl = profile.logo_url || null;
  if (logoBase64) {
    try {
      // Strip data URL prefix
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
      const ext = logoBase64.includes("image/png") ? "png" : "jpg";
      const buffer = Buffer.from(base64Data, "base64");
      const path = `logos/${profileId}.${ext}`;

      const { error: uploadErr } = await supabaseAdmin
        .storage
        .from("qr-assets")
        .upload(path, buffer, {
          contentType: ext === "png" ? "image/png" : "image/jpeg",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabaseAdmin
          .storage
          .from("qr-assets")
          .getPublicUrl(path);
        logoUrl = urlData?.publicUrl || logoUrl;
      }
    } catch (uploadEx) {
      console.error("Logo upload failed:", uploadEx);
      // Non-fatal — continue saving other fields
    }
  }

  // ── 5. Update profile ────────────────────────────
  const updates = {
    business_name: businessName || null,
    tagline:       tagline      || null,
    bio:           bio          || null,
    phone:         phone        || null,
    video_url:     videoUrl     || null,
    links:         Array.isArray(links) ? links : [],
    socials:       socials || {},
    logo_url:      logoUrl,
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
