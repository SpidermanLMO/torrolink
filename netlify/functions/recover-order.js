// ================================================
// TORROLINK — MANUAL ORDER RECOVERY
// Fulfills an order that the webhook missed.
// GET /.netlify/functions/recover-order
//   ?secret=ADMIN_SECRET
//   &email=customer@email.com
//   &business=Business+Name
//   &plan=qr-code-custom-branding   (default)
//   &name=Customer+Name             (optional)
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }        = require("resend");
const QRCode            = require("qrcode");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend      = new Resend(process.env.RESEND_API_KEY);
const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// ── HELPERS ───────────────────────────────────────

function generateCode(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function uniqueHandle(base) {
  let handle = slugify(base) || "business";
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? handle : `${handle}-${suffix}`;
    const { data } = await supabase.from("profiles").select("id").eq("handle", candidate).maybeSingle();
    if (!data) return candidate;
    suffix++;
  }
}

async function uniqueCode() {
  while (true) {
    const code = generateCode(8);
    const { data } = await supabase.from("profiles").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── MAIN HANDLER ─────────────────────────────────

exports.handler = async (event) => {
  const p = event.queryStringParameters || {};

  // Auth
  if (!ADMIN_SECRET || p.secret !== ADMIN_SECRET) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const email        = p.email;
  const businessName = p.business || "My Business";
  const plan         = p.plan    || "qr-code-custom-branding";
  const customerName = p.name    || "";

  if (!email) return { statusCode: 400, body: "email param required" };

  try {
    // 1. Upsert customer
    let customerId;
    const { data: existing } = await supabase
      .from("customers").select("id").eq("email", email).maybeSingle();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({ email, name: customerName, plan })
        .select("id").single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    // 2. Create profile
    const handle      = await uniqueHandle(businessName);
    const code        = await uniqueCode();
    const hasBranding = plan.includes("branding");
    const brandingTier = plan.includes("custom") ? "custom" : hasBranding ? "standard" : null;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .insert({
        customer_id:     customerId,
        handle,
        code,
        business_name:   businessName,
        is_active:       true,
        branding_tier:   brandingTier,
        branding_status: hasBranding ? "pending_upload" : null,
      })
      .select("id, handle, code").single();
    if (profErr) throw profErr;

    const qrUrl      = `${SITE}/q/${profile.code}`;
    const profileUrl = `${SITE}/p/${profile.handle}`;
    const designUrl  = `${SITE}/design/${profile.code}`;
    const portalUrl  = `${SITE}/portal`;

    // 3a. Branding plan → send design portal link
    if (hasBranding) {
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      email,
        subject: "Design your branded QR code — Torrolink",
        html:    buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl }),
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, type: "branding", designUrl, code: profile.code, handle: profile.handle }),
      };
    }

    // 3b. Standard QR plan → generate & email QR
    const qrDataUrl  = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      width: 1200,
      margin: 2,
      color: { dark: "#0a4d4d", light: "#ffffff" },
    });
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");

    await resend.emails.send({
      from:        "Torrolink <orders@torrolink.com>",
      to:          email,
      subject:     "Your Torrolink QR code is ready 🎉",
      attachments: [{ filename: "torrolink-qr.png", content: base64Data }],
      html:        buildQrEmail({ customerName, businessName, profileUrl, qrUrl, plan, portalUrl }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, type: "qr", profileUrl, code: profile.code, handle: profile.handle }),
    };

  } catch (err) {
    console.error("Recovery error:", err);
    return { statusCode: 500, body: err.message };
  }
};

// ── EMAIL TEMPLATES ───────────────────────────────

function buildQrEmail({ customerName, businessName, profileUrl, qrUrl, plan, portalUrl }) {
  const firstName = customerName.split(" ")[0] || "there";
  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:1.8rem;">Your QR code is ready!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">It's attached to this email — and it's yours forever.</p>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${escHtml(firstName)},</p>
    <p style="color:#555;line-height:1.7;">
      Your permanent QR code for <strong>${escHtml(businessName)}</strong> is attached as a high-res PNG.
      It will <strong>never expire</strong> and never require a monthly fee to stay active.
    </p>
    <div style="background:#fff;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #e5e5ea;text-align:center;">
      <p style="margin:0 0 4px;font-size:0.9rem;color:#888;">Your public profile page</p>
      <a href="${profileUrl}" style="color:#0f6b6b;font-weight:700;font-size:1rem;">${profileUrl}</a>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${portalUrl}" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Manage My Profile →
      </a>
    </div>
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">Questions? <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:16px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`;
}

function buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl }) {
  const firstName = customerName.split(" ")[0] || "there";
  const tierLabel = plan.includes("custom") ? "Custom Branding" : "Standard Branding";
  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:1.8rem;">Time to design your QR!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">${tierLabel} — let's make it yours.</p>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${escHtml(firstName)},</p>
    <p style="color:#555;line-height:1.7;">
      Your order for <strong>${escHtml(businessName)}</strong> is confirmed.
      Click below to upload your logo and preview your branded QR code.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${designUrl}" style="background:#f4752b;color:#fff;padding:16px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;">
        Design My QR →
      </a>
    </div>
    <div style="background:#fff;border-radius:10px;padding:16px 20px;border:1px solid #e5e5ea;font-size:0.9rem;color:#555;">
      <strong>What happens next:</strong>
      <ol style="margin:8px 0 0;padding-left:18px;line-height:2;">
        <li>Upload your logo (PNG or JPG)</li>
        ${plan.includes("custom") ? "<li>Choose your QR dot style, color, and frame</li>" : ""}
        <li>Preview the design</li>
        <li>Click "Looks good" — your branded QR is generated and emailed instantly</li>
      </ol>
    </div>
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">Questions? <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:16px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`;
}
