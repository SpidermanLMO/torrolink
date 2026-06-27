// ================================================
// TORROLINK — QR REDIRECT FUNCTION
// Handles /q/:code — logs the scan, then redirects
// to the business's profile page at /p/:handle
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  try {
    // rawPath covers Lambda v2 format; path covers v1 and Netlify rewrites
  const rawPath = event.rawPath || event.path || "";
  const code = rawPath.replace(/^\/q\//, "").split("/")[0];

    if (!code) {
      return { statusCode: 302, headers: { Location: "/", "Cache-Control": "no-store" }, body: "" };
    }

    // Look up the profile by QR code
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, handle, is_active")
      .eq("code", code)
      .maybeSingle();

    if (error || !profile || !profile.is_active) {
      return { statusCode: 302, headers: { Location: "/", "Cache-Control": "no-store" }, body: "" };
    }

    // ── LOG SCAN EVENT ────────────────────────────────────────────────────────
    const headers = event.headers || {};
    const ua = headers["user-agent"] || "";
    const ip = headers["x-forwarded-for"]?.split(",")[0]?.trim()
      || headers["client-ip"]
      || null;

    // Netlify CDN injects x-country at the edge (fallback if geo API fails)
    const countryFallback = headers["x-country"] || headers["x-nf-country"] || null;

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

    // Geo lookup — ip-api.com free tier (no key, HTTP ok from server-side)
    let geoCity = null, geoRegion = null, geoCountry = countryFallback;
    if (ip && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,city,regionName,countryCode&lang=en`,
          { signal: AbortSignal.timeout(1500) }
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === "success") {
            geoCity    = geo.city       || null;
            geoRegion  = geo.regionName || null;
            geoCountry = geo.countryCode || countryFallback;
          }
        }
      } catch (_) { /* geo lookup timed out — proceed without it */ }
    }

    // Insert scan record (await so Netlify doesn't cut it off before it fires)
    await supabase.from("scan_events").insert({
      profile_id:  profile.id,
      ip_address:  ip,
      country:     geoCountry,
      region:      geoRegion,
      city:        geoCity,
      device_type: deviceType,
      os,
      referrer:    headers["referer"] || null,
    }).catch(() => {});

    // Redirect to the profile page
    return {
      statusCode: 302,
      headers: {
        Location: `/p/${profile.handle}`,
        "Cache-Control": "no-store",
      },
      body: "",
    };

  } catch (err) {
    // Safety net: if anything unexpected throws, redirect home instead of showing
    // "Invocation Failed" — this guarantees a graceful response on every scan.
    console.error("[qr] Unhandled error:", err);
    return {
      statusCode: 302,
      headers: { Location: "/", "Cache-Control": "no-store" },
      body: "",
    };
    }
};
