// ================================================
// TORROLINK — PORTAL PASSWORD RESET
// POST /.netlify/functions/portal-reset
// Body: { email }
// Generates a Supabase recovery link via admin API and sends it
// via Resend (bypasses Supabase's missing SMTP config).
// Always returns ok:true so we never reveal whether an email exists.
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }        = require("resend");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const SITE   = process.env.DEPLOY_URL || "https://torrolink.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email is required." }) };
  }

  try {
    // Generate a recovery link via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: { redirectTo: SITE + "/set-password" },
    });

    if (!error && data?.properties?.action_link) {
      const link = data.properties.action_link;

      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      email,
        subject: "Reset your Torrolink password",
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:1.6rem;">Reset your password</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Torrolink account recovery</p>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="color:#333;font-size:1rem;">Click the button below to set a new password for your Torrolink account.</p>
    <p style="color:#888;font-size:0.85rem;">This link expires in 1 hour.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;
                text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Reset Password →
      </a>
    </div>
    <p style="font-size:0.85rem;color:#888;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:24px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`,
      });
    }
    // If no user found / error, we still return ok:true (don't reveal user existence)
  } catch (err) {
    console.error("portal-reset error:", err);
    // Still return ok:true to avoid leaking info
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};
