// ================================================
// TORROLINK — ORDER AGENT
// Receives new orders, notifies Laign, sends
// customer confirmation, triggers next agent
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "laigno@gmail.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const order = JSON.parse(event.body || "{}");
    const { name, email, business, plan, message } = order;

    if (!name || !email || !plan) {
      return respond(400, { error: "Missing required fields." });
    }

    const orderId = `TL-${Date.now()}`;
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

    // ── NOTIFY LAIGN ─────────────────────────────────
    await resend.emails.send({
      from: "Torrolink Orders <orders@torrolink.com>",
      to: OWNER_EMAIL,
      subject: `🆕 New Order: ${plan} — ${business || name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f6b6b;">New Torrolink Order</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;">Order ID</td><td style="padding:8px;">${orderId}</td></tr>
            <tr style="background:#f4f6f8;"><td style="padding:8px;font-weight:bold;">Customer</td><td style="padding:8px;">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
            <tr style="background:#f4f6f8;"><td style="padding:8px;font-weight:bold;">Business</td><td style="padding:8px;">${business || "Not provided"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Plan</td><td style="padding:8px;">${plan}</td></tr>
            <tr style="background:#f4f6f8;"><td style="padding:8px;font-weight:bold;">Notes</td><td style="padding:8px;">${message || "None"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Time</td><td style="padding:8px;">${timestamp} CT</td></tr>
          </table>
          <p style="margin-top:24px;color:#888;font-size:0.85rem;">QR Generator Agent has been triggered automatically.</p>
        </div>
      `,
    });

    // ── CONFIRM TO CUSTOMER ───────────────────────────
    await resend.emails.send({
      from: "Torrolink <orders@torrolink.com>",
      reply_to: "orders@torrolink.com",
      to: email,
      subject: `We got your order, ${name.split(" ")[0]}! 🎉`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f6b6b;">Your order is confirmed!</h2>
          <p>Hey ${name.split(" ")[0]}, thanks for choosing Torrolink. Here's a summary of your order:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#f4f6f8;"><td style="padding:10px;font-weight:bold;">Order ID</td><td style="padding:10px;">${orderId}</td></tr>
            <tr><td style="padding:10px;font-weight:bold;">Plan</td><td style="padding:10px;">${plan}</td></tr>
            <tr style="background:#f4f6f8;"><td style="padding:10px;font-weight:bold;">Business</td><td style="padding:10px;">${business || name}</td></tr>
          </table>
          <p><strong>What happens next:</strong> We'll have your QR code built and in your inbox within 48 hours. If you have questions in the meantime, reply to this email.</p>
          <p style="margin-top:32px;">Welcome to Torrolink,<br/><strong>The Torrolink Team</strong><br/>A PTorro Holdings Company</p>
        </div>
      `,
    });

    // ── TRIGGER SUPERVISOR HANDOFF ────────────────────
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "handoff",
        agentName: "order-agent",
        agentResult: { orderId, name, email, business, plan },
      }),
    }).catch(() => {}); // non-blocking

    return respond(200, { success: true, orderId });

  } catch (err) {
    console.error("Order agent error:", err);

    // Alert supervisor
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "order-agent",
        agentError: err.message,
      }),
    }).catch(() => {});

    return respond(500, { error: "Order processing failed." });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
