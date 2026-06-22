// ================================================
// TORROLINK — AGENT MAILER
// Allows Claude agents to send or draft emails via Resend
// Auth: x-agent-secret header must match ADMIN_SECRET
// POST body: { to, from, subject, html, body, agentName, action }
// action: "send" = fire immediately, "draft" = return preview only
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_SENDERS = [
  "hello@torrolink.com",
  "orders@torrolink.com",
  "billing@torrolink.com",
  "leads@torrolink.com",
  "supervisor@torrolink.com",
  "hawk@torrolink.com",
];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  // Auth check
  const secret = event.headers["x-agent-secret"] || event.headers["X-Agent-Secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return respond(401, { error: "Unauthorized" });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return respond(400, { error: "Invalid JSON" });
  }

  const { to, from, subject, html, text, agentName, action = "draft" } = body;

  if (!to || !subject || (!html && !text)) {
    return respond(400, { error: "Required: to, subject, and html or text" });
  }

  const sender = from || "hello@torrolink.com";

  if (!ALLOWED_SENDERS.includes(sender)) {
    return respond(400, { error: `Sender not allowed: ${sender}. Use one of: ${ALLOWED_SENDERS.join(", ")}` });
  }

  const recipients = Array.isArray(to) ? to : [to];

  // Draft mode — return preview without sending
  if (action === "draft") {
    return respond(200, {
      status: "draft",
      preview: {
        from: sender,
        to: recipients,
        subject,
        html: html || text,
        agentName: agentName || "Agent",
      },
      message: "Draft ready. Set action='send' to deliver.",
    });
  }

  // Send mode
  if (action === "send") {
    try {
      const result = await resend.emails.send({
        from: `${agentName || "Torrolink"} <${sender}>`,
        to: recipients,
        subject,
        html: html || `<p>${text}</p>`,
        text: text || "",
      });

      console.log(`[agent-mailer] Sent by ${agentName || "unknown"} → ${recipients.join(", ")} | subject: ${subject}`);

      return respond(200, {
        status: "sent",
        messageId: result.data?.id,
        to: recipients,
        subject,
      });
    } catch (err) {
      console.error("[agent-mailer] Send error:", err);
      return respond(500, { error: err.message });
    }
  }

  return respond(400, { error: "action must be 'send' or 'draft'" });
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
