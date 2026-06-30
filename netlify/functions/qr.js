// ================================================
// TORROLINK — QR REDIRECT FUNCTION
// Handles /q/:code — resolves the member's QR code to their
// public profile at /p/:handle, logs the scan (best-effort).
//
// Hardened: no module-level client init (so it can never fail to
// load / 502), env read inside the handler, anon-key REST read
// (active profiles are anon-readable — same access profile.js uses),
// and every path wrapped so a failure degrades to the homepage,
// never an error page.
// ================================================

exports.handler = async (event) => {
  const HOME = { statusCode: 302, headers: { Location: "/", "Cache-Control": "no-store" }, body: "" };
  try {
    // 1) Resolve the code: prefer the ?code=:code the redirect passes,
    //    fall back to parsing the request path (event.path, like profile.js).
    const qsp = event.queryStringParameters || {};
    let code = (qsp.code || "").trim();
    if (!code) {
      const reqPath = event.path || event.rawPath || "";
      code = reqPath.replace(/^\/q\//, "").split("/").filter(Boolean)[0] || "";
    }
    if (!code) return HOME;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return HOME;
    const base = url.replace(/\/+$/, "");
    const authHeaders = { apikey: key, Authorization: "Bearer " + key };

    // 2) Look up the profile by code (anon REST — returns only active rows).
    const lookup = await fetch(
      `${base}/rest/v1/profiles?select=id,handle,is_active&code=eq.${encodeURIComponent(code)}&limit=1`,
      { headers: authHeaders }
    );
    if (!lookup.ok) return HOME;
    const rows = await lookup.json();
    const profile = Array.isArray(rows) ? rows[0] : null;
    if (!profile || !profile.handle || profile.is_active === false) return HOME;

    // 3) Best-effort scan logging — must never block or break the redirect.
    try {
      const h = event.headers || {};
      const ua = h["user-agent"] || "";
      const ip = (h["x-forwarded-for"] || "").split(",")[0].trim() || h["client-ip"] || null;
      const country = h["x-country"] || h["x-nf-country"] || null;
      const deviceType = /ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))
        ? "tablet"
        : /mobile|android|iphone/i.test(ua) ? "mobile" : "desktop";
      const os = /android/i.test(ua) ? "Android"
        : /iphone|ipad/i.test(ua) ? "iOS"
        : /windows/i.test(ua) ? "Windows"
        : /mac/i.test(ua) ? "macOS" : "Other";
      await fetch(`${base}/rest/v1/scan_events`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          profile_id: profile.id,
          ip_address: ip,
          country,
          device_type: deviceType,
          os,
          referrer: h["referer"] || null,
        }),
      }).catch(() => {});
    } catch (_) { /* logging is optional */ }

    // 4) Send the visitor to the member's profile page.
    return {
      statusCode: 302,
      headers: { Location: `/p/${profile.handle}`, "Cache-Control": "no-store" },
      body: "",
    };
  } catch (_) {
    return HOME;
  }
};
