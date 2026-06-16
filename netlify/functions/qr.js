// ================================================
// TORROLINK — QR REDIRECT FUNCTION
// Handles /q/:code — logs the scan, then redirects
// to the business's profile page at /p/:handle
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const code = event.path.replace(/^\/q\//, "").split("/")[0];

  if (!code) {
    return { statusCode: 302, headers: { Location: "/" } };
  }

  // Look up the profile by QR code
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, handle, is_active")
    .eq("code", code)
    .single();

  if (error || !profile || !profile.is_active) {
    return { statusCode: 302, headers: { Location: "/" } };
  }

  // ── LOG SCAN EVENT (async, don't await — don't slow down the redirect) ──────
  const headers = event.headers || {};
  const ua = headers["user-agent"] || "";
  const ip = headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || headers["client-ip"]
    || null;

  // Netlify CDN injects x-country (ISO 3166-1 alpha-2) at the edge
  const country = headers["x-country"] || headers["x-nf-country"] || null;

  // Check tablet first — iPad/Android tablet UAs also contain "mobile"/"android"
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

  // Fire and forget — scan logging should never delay the redirect
  supabase.from("scan_events").insert({
    profile_id: profile.id,
    ip_address: ip,
    country,
    device_type: deviceType,
    os,
    referrer: headers["referer"] || null,
  }).then(() => {}).catch(() => {});

  // Redirect to the profile page
  return {
    statusCode: 302,
    headers: {
      Location: `/p/${profile.handle}`,
      "Cache-Control": "no-store",
    },
    body: "",
  };
};
