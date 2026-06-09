// ================================================
// TORROLINK — LEAD ROUTER AGENT
// When someone scans a subscriber's QR code and
// fills in a lead form, instantly sends that lead
// to the business owner via email
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const {
      // Lead info (from the form scan)
      leadName,
      leadEmail,
      leadPhone,
      leadMessage,
      // Subscriber (business owner) info
      subscriberEmail,
      subscriberBusiness,
      subscriberId,
      // Tracking
      scannedAt,
      location,
      device,
    } = JSON.parse(event.body || "{}");

    if (!subscriberEmail || !leadName) {
      return respond(400, { error: "Missing required fields." });
    }

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

    // ── FIRE LEAD TO BUSINESS OWNER ───────────────────
    await resend.emails.send({
      from: "Torrolink Leads <leads@torrolink.com>",
      to: subscriberEmail,
      subject: `🔥 New Lead: ${leadName} — scanned your QR code`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f6b6b;padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">You got a new lead!</h2>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Someone scanned your Torrolink QR code</p>
          </div>
          <div style="background:#f4f6f8;padding:24px;border-radius:0 0 12px 12px;">
            <h3 style="color:#0f6b6b;margin-top:0;">Lead Details</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="background:#fff;"><td style="padding:10px;font-weight:bold;border-radius:6px;">Name</td><td style="padding:10px;">${leadName}</td></tr>
              <tr><td style="padding:10px;font-weight:bold;">Email</td><td style="padding:10px;">${leadEmail || "Not provided"}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px;font-weight:bold;border-radius:6px;">Phone</td><td style="padding:10px;">${leadPhone || "Not provided"}</td></tr>
              <tr><td style="padding:10px;font-weight:bold;">Message</td><td style="padding:10px;">${leadMessage || "No message"}</td></tr>
            </table>

            <h3 style="color:#0f6b6b;">Scan Info</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="background:#fff;"><td style="padding:10px;font-weight:bold;">Time</td><td style="padding:10px;">${scannedAt || timestamp} CT</td></tr>
              <tr><td style="padding:10px;font-weight:bold;">Device</td><td style="padding:10px;">${device || "Unknown"}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px;font-weight:bold;">Location</td><td style="padding:10px;">${location || "Unknown"}</td></tr>
            </table>

            <p style="margin-top:24px;font-size:0.85rem;color:#888;">
              This lead was delivered by your Torrolink QR code system.<br/>
              Reply directly to ${leadEmail || "the lead's email"} to follow up.
            </p>
          </div>
        </div>
      `,
    });

    return respond(200, { success: true, message: "Lead delivered to business owner." });

  } catch (err) {
    console.error("Lead router error:", err);

    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "lead-router-agent",
        agentError: err.message,
      }),
    }).catch(() => {});

    return respond(500, { error: "Lead routing failed." });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
