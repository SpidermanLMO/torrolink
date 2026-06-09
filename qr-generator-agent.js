// ================================================
// TORROLINK — QR GENERATOR AGENT
// Generates branded QR codes and emails them
// to customers automatically after orders
// ================================================

const QRCode = require("qrcode");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "laigno@gmail.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const { orderId, name, email, business, url, plan } = JSON.parse(event.body || "{}");

    if (!url || !email) return respond(400, { error: "Missing url or email." });

    // ── GENERATE QR CODE (base64 PNG) ─────────────────
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: {
        dark: "#0f6b6b",   // Torrolink teal
        light: "#ffffff",
      },
      errorCorrectionLevel: "H", // High — allows logo overlay
    });

    // Extract base64 content from data URL
    const base64Image = qrDataUrl.split(",")[1];

    // ── EMAIL QR TO CUSTOMER ──────────────────────────
    await resend.emails.send({
      from: "Torrolink <orders@torrolink.com>",
      reply_to: "orders@torrolink.com",
      to: email,
      subject: `Your QR Code is ready, ${name?.split(" ")[0] || ""}! 🎉`,
      attachments: [
        {
          filename: `torrolink-qr-${orderId || Date.now()}.png`,
          content: base64Image,
        },
      ],
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f6b6b;">Your QR Code is ready!</h2>
          <p>Hey ${name?.split(" ")[0] || "there"}, your Torrolink QR code for <strong>${business || "your business"}</strong> is attached to this email.</p>

          <h3>How to use it:</h3>
          <ul>
            <li>Download the attached PNG file</li>
            <li>Print it, put it on your business cards, signage, menus, or anywhere customers will see it</li>
            <li>Anyone who scans it will go straight to: <strong>${url}</strong></li>
          </ul>

          <h3>Tips for best results:</h3>
          <ul>
            <li>Print at least 1" × 1" — bigger is always better</li>
            <li>High contrast backgrounds work best (white or light colors)</li>
            <li>Test it yourself before printing in bulk</li>
          </ul>

          ${plan && plan.includes("subscription") ? `
          <p style="background:#f4f6f8;padding:16px;border-radius:8px;margin-top:24px;">
            <strong>Your subscriber dashboard</strong> is being set up now. You'll receive a separate email with your login link within 24 hours so you can view your scan analytics.
          </p>` : ""}

          <p style="margin-top:32px;color:#888;">
            Questions? Reply to this email anytime.<br/>
            <strong>Torrolink</strong> — A PTorro Holdings Company
          </p>
        </div>
      `,
    });

    // ── NOTIFY LAIGN ──────────────────────────────────
    await resend.emails.send({
      from: "Torrolink QR Agent <orders@torrolink.com>",
      to: OWNER_EMAIL,
      subject: `✅ QR Delivered: ${business || name} (${orderId})`,
      html: `<p>QR code generated and emailed to <strong>${email}</strong> for order <strong>${orderId}</strong>.</p><p>URL encoded: ${url}</p>`,
    });

    return respond(200, { success: true, message: "QR code generated and delivered." });

  } catch (err) {
    console.error("QR Generator error:", err);

    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "qr-generator-agent",
        agentError: err.message,
      }),
    }).catch(() => {});

    return respond(500, { error: "QR generation failed." });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
