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
const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";
const OWNER_EMAIL = process.env.OWNER_EMAIL  || "laigno@gmail.com";

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
  // Netlify may base64-encode the raw body; decode it first so the
  // HMAC is computed against the exact bytes Stripe signed.
  const sig     = event.headers["stripe-signature"];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Route to appropriate handler
  if (stripeEvent.type === "customer.subscription.deleted") {
    return await handleSubscriptionDeleted(stripeEvent.data.object);
  }
  if (stripeEvent.type === "invoice.payment_failed") {
    return await handlePaymentFailed(stripeEvent.data.object);
  }
  if (stripeEvent.type === "invoice.payment_succeeded") {
    return await handlePaymentSucceeded(stripeEvent.data.object);
  }
  if (stripeEvent.type === "customer.subscription.created") {
    return await handleSubscriptionCreated(stripeEvent.data.object);
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

  // Classify the purchase type
  const isNewQR           = plan.includes("qr-code");
  const isMetricsUpgrade  = plan === "metrics";
  const isBrandingUpgrade = plan === "branding" || plan === "custom-branding";
  const hasBranding       = plan.includes("branding");

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
          metrics_active:     isMetricsUpgrade,
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCustomer.id;
    }

    // ── 2a. UPGRADE: Metrics only ────────────────
    if (isMetricsUpgrade) {
      // Update both customers.metrics_active AND profiles.has_metrics (keeps both in sync)
      await supabase
        .from("customers")
        .update({ metrics_active: true })
        .eq("id", customerId);
      await supabase
        .from("profiles")
        .update({ has_metrics: true })
        .eq("customer_id", customerId);

      const firstName = customerName.split(" ")[0] || "there";
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customerEmail,
        subject: "Metrics & Leads is now active — Torrolink",
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${escHtml(firstName)},</p>
    <p style="color:#555;line-height:1.7;">Your <strong>Metrics &amp; Leads</strong> add-on is now active. You can see real-time scan analytics and captured leads from your portal.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}/portal" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">View My Dashboard →</a>
    </div>
    <p style="font-size:0.85rem;color:#888;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</div>`,
      });
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // ── 2b. UPGRADE: Branding only (customer already has QR) ────────
    if (isBrandingUpgrade) {
      const brandingTier = plan === "custom-branding" ? "custom" : "standard";
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, handle, code")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({ branding_tier: brandingTier, branding_status: "pending_upload" })
          .eq("id", existingProfile.id);

        const designUrl = `${SITE}/design/${existingProfile.code}`;
        await resend.emails.send({
          from:    "Torrolink <orders@torrolink.com>",
          to:      customerEmail,
          subject: "Design your branded QR code — Torrolink",
          html: buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl: `${SITE}/portal` }),
        });
      }
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // ── 2c. NEW QR PURCHASE: Create profile (idempotent — skip if already exists) ──
    const brandingTier = hasBranding
      ? (plan.includes("custom") ? "custom" : "standard")
      : null;

    // Guard against duplicate profiles (e.g. webhook fired twice, or customer re-purchased)
    const { data: existingQrProfile } = await supabase
      .from("profiles")
      .select("id, handle, code")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let profile;
    if (existingQrProfile) {
      // Customer already has a profile — just update branding if applicable, don't create a new one
      profile = existingQrProfile;
      if (hasBranding) {
        await supabase.from("profiles")
          .update({ branding_tier: brandingTier, branding_status: "pending_upload" })
          .eq("id", profile.id);
      }
    } else {
      const handle = await uniqueHandle(businessName);
      const code   = await uniqueCode();
      const { data: newProfile, error: profErr } = await supabase
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
      profile = newProfile;
    }

    const qrUrl      = `${SITE}/q/${profile.code}`;
    const profileUrl = `${SITE}/p/${profile.handle}`;
    const designUrl  = `${SITE}/design/${profile.code}`;

    // ── 3. Generate & email QR (non-branding) ────
    if (!hasBranding) {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: "H",
        width: 1200,
        margin: 2,
        color: { dark: "#0a4d4d", light: "#ffffff" },
      });
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");

      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customerEmail,
        subject: "Your Torrolink QR code is ready 🎉",
        attachments: [{ filename: "torrolink-qr.png", content: base64Data }],
        html: buildQrEmail({ customerName, businessName, profileUrl, qrUrl, plan, portalUrl: `${SITE}/portal` }),
      });
    }

    // ── 4. Email design portal link (branding) ───
    if (hasBranding) {
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customerEmail,
        subject: "Design your branded QR code — Torrolink",
        html: buildDesignEmail({ customerName, businessName, designUrl, plan, portalUrl: `${SITE}/portal` }),
      });
    }

    // ── 5. Metrics add-on email (if selected at checkout) ─────────
    if (addMetrics) {
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
        from:    "Torrolink <orders@torrolink.com>",
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
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</div>`,
      });
    }

    // ── 6. Owner alert ───────────────────────────
    await resend.emails.send({
      from:    "Torrolink Alerts <orders@torrolink.com>",
      to:      OWNER_EMAIL,
      subject: `💰 New order: ${escHtml(businessName)} (${plan})`,
      html:    `<p><strong>${escHtml(customerName)}</strong> (${escHtml(customerEmail)}) just purchased <strong>${plan}</strong> for <strong>${escHtml(businessName)}</strong>.</p>`,
    }).catch(() => {});

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (err) {
    console.error("Webhook processing error:", err);
    return { statusCode: 500, body: err.message };
  }
};

// ── SUBSCRIPTION EVENT HANDLERS ─────────────────

async function handleSubscriptionDeleted(subscription) {
  try {
    const stripeCustomerId = subscription.customer;
    // Find customer by stripe_customer_id
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (customer) {
      await supabase
        .from("customers")
        .update({ metrics_active: false })
        .eq("id", customer.id);
      await supabase
        .from("profiles")
        .update({ has_metrics: false })
        .eq("customer_id", customer.id);

      const firstName = (customer.name || "").split(" ")[0] || "there";
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customer.email,
        subject: "Your Metrics & Leads subscription has ended — Torrolink",
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${firstName},</p>
    <p style="color:#555;line-height:1.7;">Your <strong>Metrics &amp; Leads</strong> subscription has been cancelled. Scan analytics and lead capture are now paused on your profile.</p>
    <p style="color:#555;line-height:1.7;">Your QR code and profile page remain fully active — no action needed.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}/portal" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Reactivate Metrics →
      </a>
    </div>
    <p style="font-size:0.85rem;color:#888;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</div>`,
      });
      // Owner alert
      await resend.emails.send({
        from:    "Torrolink Alerts <orders@torrolink.com>",
        to:      OWNER_EMAIL,
        subject: `📉 Cancellation: ${customer.email}`,
        html:    `<p><strong>${customer.email}</strong> cancelled their Metrics &amp; Leads subscription.</p>`,
      }).catch(() => {});
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionDeleted error:", err);
    return { statusCode: 500, body: err.message };
  }
}

async function handlePaymentFailed(invoice) {
  try {
    const stripeCustomerId = invoice.customer;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (customer && customer.email) {
      const firstName = (customer.name || "").split(" ")[0] || "there";
      const invoiceUrl = invoice.hosted_invoice_url || `${SITE}/portal`;
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customer.email,
        subject: "Payment failed — action required to keep Metrics & Leads active",
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:#c0392b;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink — Payment Issue</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${firstName},</p>
    <p style="color:#555;line-height:1.7;">We weren't able to process your <strong>Metrics &amp; Leads</strong> subscription payment. Please update your payment method to keep analytics active.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${invoiceUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
        Update Payment Method →
      </a>
    </div>
    <p style="color:#888;font-size:0.9rem;">If payment isn't updated within a few days, your Metrics &amp; Leads subscription will be cancelled. Your QR code and profile stay active regardless.</p>
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</div>`,
      });
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handlePaymentFailed error:", err);
    return { statusCode: 500, body: err.message };
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const stripeCustomerId = invoice.customer;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (customer && customer.email && invoice.amount_paid > 0) {
      const firstName  = (customer.name || "").split(" ")[0] || "there";
      const amountPaid = (invoice.amount_paid / 100).toFixed(2);
      await resend.emails.send({
        from:    "Torrolink <orders@torrolink.com>",
        to:      customer.email,
        subject: "Your Torrolink payment was received ✅",
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${firstName},</p>
    <p style="color:#555;line-height:1.7;">Your payment of <strong>$${amountPaid}</strong> has been received. Your Metrics &amp; Leads subscription continues uninterrupted.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}/portal" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">View Dashboard →</a>
    </div>
    <p style="font-size:0.85rem;color:#888;">— The Torrolink Team</p>
  </div>
</div>`,
      });
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handlePaymentSucceeded error:", err);
    return { statusCode: 500, body: err.message };
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const stripeCustomerId = subscription.customer;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    const email = customer?.email || "unknown";
    const amount = (subscription.items?.data?.[0]?.price?.unit_amount / 100 || 0).toFixed(2);
    await resend.emails.send({
      from:    "Torrolink Alerts <orders@torrolink.com>",
      to:      OWNER_EMAIL,
      subject: `💰 New Subscriber: ${email}`,
      html:    `<p><strong>${email}</strong> just subscribed to Metrics &amp; Leads. Amount: $${amount}/mo</p>`,
    }).catch(() => {});
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("handleSubscriptionCreated error:", err);
    return { statusCode: 500, body: err.message };
  }
}

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
      <p style="font-size:0.82rem;color:#aaa;margin:10px 0 0;">Click Create Account and use this email — takes 30 seconds.</p>
    </div>

    <h3 style="color:#333;margin:24px 0 12px;">Next steps:</h3>
    <ol style="color:#555;line-height:2;padding-left:20px;">
      <li>Save the attached QR code PNG</li>
      <li>Click "Manage My Profile" → click <strong>Create Account</strong> with this email to customize your page</li>
      <li>Print your QR on business cards, signs, truck wraps, yard signs, windows — anywhere people will see it</li>
    </ol>

    <p style="font-size:0.85rem;color:#888;margin-top:24px;">
      Questions? Reply to this email or reach us at <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a>
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
      <p style="margin:6px 0 0;font-size:0.8rem;color:#aaa;">Click Create Account with this email — it's free and takes 30 seconds.</p>
    </div>

    <p style="font-size:0.85rem;color:#888;margin-top:24px;">
      Questions? Reply to this email or reach us at <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a>
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
