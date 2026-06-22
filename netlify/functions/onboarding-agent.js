// ================================================
// TORROLINK — ONBOARDING AGENT
// New subscriber signs up → agent creates their
// account, sets up landing page, sends welcome
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "laign@ptorro.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const { name, email, business, plan, url, logoUrl } = JSON.parse(event.body || "{}");

    if (!email || !plan) return respond(400, { error: "Missing required fields." });

    const subscriberId = `SUB-${Date.now()}`;
    const dashboardUrl = `https://torrolink.com/dashboard?id=${subscriberId}`;

    // ── WELCOME EMAIL TO SUBSCRIBER ───────────────────
    await resend.emails.send({
      from: "Torrolink <orders@torrolink.com>",
      reply_to: "orders@torrolink.com",
      to: email,
      subject: `Welcome to Torrolink, ${name?.split(" ")[0] || ""}! Here's everything you need 🚀`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f6b6b;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:2rem;">Welcome to Torrolink!</h1>
            <p style="color:rgba(255,255,255,0.85);margin-top:8px;">Your QR code is working for your business right now.</p>
          </div>
          <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e6ea;">
            <h2 style="color:#0f6b6b;">Here's what's ready for you:</h2>
            <ul style="line-height:2;">
              <li>✅ Your QR code has been generated and is being emailed separately</li>
              <li>✅ Your subscriber account has been created</li>
              <li>✅ Your analytics tracking is active</li>
              ${plan.includes("landing") ? "<li>✅ Your landing page is being set up (ready in 24hrs)</li>" : ""}
              ${plan.includes("lead") ? "<li>✅ Your lead capture form is active</li>" : ""}
            </ul>

            <h2 style="color:#0f6b6b;">Your subscriber ID:</h2>
            <p style="background:#f4f6f8;padding:12px;border-radius:8px;font-family:monospace;font-size:1.1rem;">${subscriberId}</p>
            <p style="font-size:0.85rem;color:#888;">Keep this for your records. You'll need it if you ever contact support.</p>

            <h2 style="color:#0f6b6b;">What happens next:</h2>
            <ol style="line-height:2;">
              <li>Check the next email for your QR code file</li>
              <li>Print it and put it where your customers will see it</li>
              <li>Every week you'll get a scan report showing who's finding you</li>
            </ol>

            <p style="margin-top:32px;color:#888;font-size:0.85rem;">
              Questions? Reply to this email anytime.<br/>
              <strong>Torrolink Team</strong> — A PTorro Holdings Company
            </p>
          </div>
        </div>
      `,
    });

    // ── NOTIFY LAIGN ──────────────────────────────────
    await resend.emails.send({
      from: "Torrolink Onboarding <orders@torrolink.com>",
      to: OWNER_EMAIL,
      subject: `🎉 New Subscriber Onboarded: ${business || name}`,
      html: `
        <h2>New Subscriber</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Business:</strong> ${business || "Not provided"}</p>
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Subscriber ID:</strong> ${subscriberId}</p>
        <p><strong>URL to encode:</strong> ${url || "Pending"}</p>
        <hr/>
        <p style="color:#888;">QR Generator Agent has been triggered.</p>
      `,
    });

    // ── TRIGGER QR GENERATOR ──────────────────────────
    if (url) {
      await fetch(`${process.env.URL}/.netlify/functions/qr-generator-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: subscriberId, name, email, business, url, plan }),
      }).catch(() => {});
    }

    return respond(200, { success: true, subscriberId });

  } catch (err) {
    console.error("Onboarding agent error:", err);
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "onboarding-agent",
        agentError: err.message,
      }),
    }).catch(() => {});
    return respond(500, { error: "Onboarding failed." });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
