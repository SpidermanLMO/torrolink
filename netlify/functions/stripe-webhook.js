// ================================================
// TORROLINK — STRIPE WEBHOOK
// Fires on checkout.session.completed.
// - Creates customer + profile in Supabase
// - For non-branding purchases: generates QR and emails it instantly
// - For branding purchases: emails the design portal link instead
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }        = require("resend");
const QRCode            = require("qrcode");
const stripe            = require("stripe")(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const SITE   = process.env.DEPLOY_URL || "https://torrolink.com";

// ── HELPERS ───────────────────────────────────────

function generateCode(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // no confusable chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueHandle(base) {
  let handle = slugify(base) || "business";
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? handle : `${handle}-${suffix}`;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", candidate)
      .maybeSingle();
    if (!data) return candidate;
    suffix++;
  }
}

async function uniqueCode() {
  while (true) {
    const code = generateCode(8);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
}

// ── MAIN HANDLER ─────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Verify Stripe signature
  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Ignored" };
  }

  const session      = stripeEvent.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerName  = session.customer_details?.name  || "";
  const plan          = session.metadata?.plan          || "qr-code";
  const businessName  = session.metadata?.businessName  || customerName || "My Business";
  const addMetrics    = session.metadata?.addMetrics === "true";
  const stripeCustomerId = session.customer || null;

  const hasBranding = plan.includes("branding");
  const hasQR       = plan.includes("qr-code") || plan === "branding" || plan === "custom-branding";

  try {
    // ── 1. Upsert customer ───────────────────────
    let customerId;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          email:              customerEmail,
          name:               customerName,
          stripe_customer_id: stripeCustomerId,
          plan,
          metrics_active:     plan === "metrics",
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    // ── 2. Create profile ────────────────────────
    const handle     = await uniqueHandle(businessName);
    const code       = await uniqueCode();
    const brandingTier = hasBranding
      ? (plan.includes("custom") ? "custom" : "standard")
      : null;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .insert({
        customer_id:    customerId,
        handle,
        code,
        business_name:  businessName,
        is_active:      true,
        branding_tier:  brandingTier,
        branding_status: hasBranding ? "pending_upload" : null,
      })
      .select("id, handle, code")
      .single();
    if (profErr) throw profErr;

    const qrUrl      = `${SITE}/q/${profile.code}`;
    const profileUrl = `${SITE}/p/${profile.handle}`;
    const designUrl  = `${SITE}/design/${profile.code}`;

    // ── 3. Generate & email QR (non-branding) ────
    if (!hasBranding || plan === "metrics") {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: "H",
        width: 1200,
        margin: 2,
        color: { dark: "#0a4d4d", light: "#ffffff" },
      });
      // Convert data URL to buffer for email attachment
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");

      await resend.emails.send({
        from:    "Torrolink <hello@torrolink.com>",
        to:      customerEmail,
        subject: "Your Torrolink QR code is ready 🎉",
        attachments: [{ filename: "torrolink-qr.png", content: base64Data }],
        html: buildQrEmail({ customerName, businessName, profileUrl, qrUrl, plan, portalUrl: `${SITE}/portal` }),
      });
    }

    // ── 4. Email design portal link (branding) ───
    if (hasBranding) {
      await resend.emails.send({
        from:    "Torrolink <hello@torrolink.com>",
        to:      customerEmail,
        subject: "Design your branded QR code — Torrolink",
        html: buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl: `${SITE}/portal` }),
      });
    }

    // ── 5. Metrics activation email (if add-on selected) ─────────
    if (addMetrics) {
      // Create a separate Stripe checkout link for the metrics subscription
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const metricsSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Torrolink Metrics + Leads", description: "Real-time scan analytics and lead capture — cancel anytime" },
            unit_amount: 1028,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        mode: "subscription",
        customer_email: customerEmail,
        success_url: `${SITE}/portal`,
        cancel_url: `${SITE}/portal`,
        metadata: { plan: "metrics", businessName },
      });

      const firstName = customerName.split(" ")[0] || "there";
      await resend.emails.send({
        from:    "Torrolink <hello@torrolink.com>",
        to:      customerEmail,
        subject: "Activate your Metrics & Leads — one more step",
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;">
    <span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${firstName},</p>
    <p style="color:#555;line-height:1.7;">Your QR code is set up! Now let's activate your <strong>Metrics &amp; Leads</strong> add-on so you can see who's scanning and start capturing leads.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${metricsSession.url}" style="background:#f4752b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Activate Metrics &amp; Leads →
      </a>
      <p style="font-size:0.82rem;color:#aaa;margin:10px 0 0;">$10.28/mo — cancel anytime from your portal</p>
    </div>
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">— The Torrolink Team<br><a href="mailto:hello@torrolink.com" style="color:#0f6b6b;">hello@torrolink.com</a></p>
  </div>
</div>`,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (err) {
    console.error("Webhook processing error:", err);
    return { statusCode: 500, body: err.message };
  }
};

// ── EMAIL TEMPLATES ──────────────────────────────

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
      <p style="margin:10px 0 0;font-size:0.85rem;color:#aaa;">This is what customers see when they scan your QR code.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <p style="font-size:1rem;font-weight:700;color:#1a1a2e;margin:0 0 8px;">Customize your profile page</p>
      <p style="font-size:0.9rem;color:#555;margin:0 0 16px;">Add your logo, photo, links, socials, theme — all free, all yours.</p>
      <a href="${portalUrl}" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Manage My Profile →
      </a>
      <p style="font-size:0.82rem;color:#aaa;margin:10px 0 0;">Sign in with your email — no password needed.</p>
    </div>

    <h3 style="color:#333;margin:24px 0 12px;">Next steps:</h3>
    <ol style="color:#555;line-height:2;padding-left:20px;">
      <li>Save the attached QR code PNG</li>
      <li>Click "Manage My Profile" above to set up your page (logo, links, theme)</li>
      <li>Print your QR on business cards, signs, truck wraps, windows — anywhere</li>
    </ol>

    <p style="font-size:0.85rem;color:#888;margin-top:24px;">
      Questions? Reply to this email or reach us at <a href="mailto:hello@torrolink.com" style="color:#0f6b6b;">hello@torrolink.com</a>
    </p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:16px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`;
}

function buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl }) {
  const firstName  = customerName.split(" ")[0] || "there";
  const tierLabel  = plan.includes("custom") ? "Custom Branding" : "Standard Branding";
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
      Click the button below to upload your logo and preview how it looks — before we generate your final QR code.
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
        <li>Preview the design — see exactly how it looks</li>
        <li>Click "Looks good" and your branded QR is generated and emailed to you instantly</li>
      </ol>
    </div>

    <div style="background:#f0fafa;border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;border:1px solid #c5e8e8;">
      <p style="margin:0 0 8px;font-size:0.9rem;color:#555;">After your branded QR is sent, customize your profile page anytime:</p>
      <a href="${portalUrl}" style="color:#0f6b6b;font-weight:700;text-decoration:none;">Manage My Profile →</a>
      <p style="margin:6px 0 0;font-size:0.8rem;color:#aaa;">Sign in with your email — no password needed.</p>
    </div>

    <p style="font-size:0.85rem;color:#888;margin-top:24px;">
      Questions? Reply to this email or reach us at <a href="mailto:hello@torrolink.com" style="color:#0f6b6b;">hello@torrolink.com</a>
    </p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:16px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`;
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
