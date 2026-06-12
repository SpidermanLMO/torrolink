// ================================================
// TORROLINK — LEAD SUBMIT + NOTIFY
// POST /.netlify/functions/lead-notify
// Body: { profileId, name, phone, email, message }
//
// 1. Validates + inserts lead into Supabase
// 2. Fetches owner email + business name + weekly scan count
// 3. Fires branded Resend email to the business owner instantly
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL     = "alerts@torrolink.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── Parse body ───────────────────────────────
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const { profileId, name, phone, email, message, interests } = body;

  if (!profileId || !name || (!phone && !email)) {
    return json(400, { error: "profileId, name, and phone or email are required." });
  }

  // ── Insert lead ──────────────────────────────
  const { error: insertErr } = await supabaseAdmin
    .from("leads")
    .insert({
      profile_id:   profileId,
      name:         name.trim(),
      phone:        phone?.trim()   || null,
      email:        email?.trim()   || null,
      comment:      message?.trim() || null,
      interests:    Array.isArray(interests) && interests.length ? interests : null,
      submitted_at: new Date().toISOString(),
    });

  if (insertErr) {
    console.error("Lead insert error:", insertErr);
    return json(500, { error: "Failed to save lead." });
  }

  // ── Fetch owner info + this week's scan count ─
  const [profileRes, scanRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("business_name, customers(email)")
      .eq("id", profileId)
      .maybeSingle(),
    supabaseAdmin
      .from("scan_events")
      .select("scanned_at")
      .eq("profile_id", profileId)
      .gte("scanned_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const ownerEmail   = profileRes.data?.customers?.email;
  const businessName = profileRes.data?.business_name || "Your Business";
  const weekScans    = scanRes.data?.length || 0;

  // ── Send email if owner address found ────────
  if (ownerEmail && RESEND_API_KEY) {
    const htmlEmail = buildLeadEmail({ businessName, name, phone, email, message, interests, weekScans });
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      ownerEmail,
        subject: `New lead from ${name} — ${businessName}`,
        html:    htmlEmail,
      }),
    });
  }

  return json(200, { ok: true });
};

// ── HTML Email Template ──────────────────────
function buildLeadEmail({ businessName, name, phone, email, message, interests, weekScans }) {
  const contactLine = [phone, email].filter(Boolean).join(" · ");
  const interestsBlock = Array.isArray(interests) && interests.length
    ? `<div style="margin-top:10px;"><span style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em;">Interested in:</span><div style="margin-top:6px;">${interests.map(i => `<span style="display:inline-block;background:#e8f5f5;color:#0f6b6b;font-size:13px;font-weight:600;border-radius:20px;padding:4px 12px;margin:3px 4px 3px 0;">${escHtml(i)}</span>`).join('')}</div></div>`
    : "";
  const msgBlock = message
    ? `<div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-top:12px;font-style:italic;color:#444;font-size:14px;line-height:1.6;">"${escHtml(message)}"</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">

  <!-- HEADER -->
  <tr>
    <td style="background:#0f6b6b;padding:22px 28px;">
      <div style="font-family:Barlow,Arial,sans-serif;font-weight:800;font-size:18px;color:#ffffff;letter-spacing:1px;">TORROLINK</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:3px;">New lead alert · ${escHtml(businessName)}</div>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:28px 28px 0;">
      <div style="font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:6px;">You have a new lead 🎯</div>
      <div style="font-size:14px;color:#888;margin-bottom:24px;">Someone scanned your QR code and left their contact info — follow up while it's fresh.</div>

      <!-- Lead info card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbfb;border-radius:10px;border:1px solid #e0eded;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 22px;">
            <div style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:8px;">${escHtml(name)}</div>
            <div style="font-size:14px;color:#0f6b6b;font-weight:600;margin-bottom:4px;">${escHtml(contactLine)}</div>
            ${interestsBlock}
            ${msgBlock}
          </td>
        </tr>
      </table>

      <!-- Mini stats -->
      <div style="font-size:11px;font-weight:600;color:#aaa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;">Your scans this week</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;margin-right:8px;">
            <div style="font-size:26px;font-weight:700;color:#0f6b6b;">${weekScans}</div>
            <div style="font-size:11px;color:#aaa;margin-top:3px;">QR scans</div>
          </td>
          <td width="8px"></td>
          <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;">
            <div style="font-size:26px;font-weight:700;color:#f4752b;">+1</div>
            <div style="font-size:11px;color:#aaa;margin-top:3px;">New lead today</div>
          </td>
          <td width="8px"></td>
          <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;">
            <div style="font-size:26px;font-weight:700;color:#0f6b6b;">${weekScans > 0 ? (1 / weekScans * 100).toFixed(1) : '—'}%</div>
            <div style="font-size:11px;color:#aaa;margin-top:3px;">Conversion (wk)</div>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="https://torrolink.com/portal" style="display:inline-block;background:#0f6b6b;color:#ffffff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">View leads &amp; dashboard →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="border-top:1px solid #f0f0f0;padding:16px 28px;text-align:center;">
      <div style="font-size:11px;color:#bbb;line-height:1.6;">
        You're receiving this because you're a Torrolink Metrics subscriber.<br>
        PTorro Holdings LLC · <a href="https://torrolink.com" style="color:#0f6b6b;text-decoration:none;">torrolink.com</a>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function json(status, obj) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(obj),
  };
}

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
