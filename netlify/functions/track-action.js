// ================================================
// TORROLINK — ACTION TRACKING
// POST /.netlify/functions/track-action
// Logs click events from the public profile page:
// phone_tap, email_tap, link_tap, save_contact, form_submit
// Fire-and-forget from the client — always returns 204.
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  // Only accept POST; silently ignore everything else
  if (event.httpMethod !== "POST") {
    return { statusCode: 204, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 204, body: "" };
  }

  const { profileId, type, target } = body;

  // Validate action type
  const ALLOWED_TYPES = ["phone_tap", "email_tap", "link_tap", "save_contact", "form_submit"];
  if (!profileId || !type || !ALLOWED_TYPES.includes(type)) {
    return { statusCode: 204, body: "" };
  }

  // Extract device info from request headers
  const headers     = event.headers || {};
  const ua          = headers["user-agent"] || "";
  const ip          = headers["x-forwarded-for"]?.split(",")[0]?.trim() || headers["client-ip"] || null;
  const referrer    = headers["referer"] || null;

  const deviceType = /ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))
    ? "tablet"
    : /mobile|android|iphone/i.test(ua)
    ? "mobile"
    : "desktop";

  const os = /android/i.test(ua) ? "Android"
    : /iphone|ipad/i.test(ua) ? "iOS"
    : /windows/i.test(ua) ? "Windows"
    : /mac/i.test(ua) ? "macOS"
    : "Other";

  // Insert — ignore errors, this is best-effort telemetry
  await supabase.from("profile_actions").insert({
    profile_id:    profileId,
    action_type:   type,
    action_target: target ? String(target).slice(0, 500) : null,
    ip_address:    ip,
    device_type:   deviceType,
    os,
    referrer,
  }).catch(() => {});

  return { statusCode: 204, body: "" };
};
