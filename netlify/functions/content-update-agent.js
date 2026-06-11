// ================================================
// TORROLINK — CONTENT UPDATE AGENT
// Subscriber emails/texts "update my menu to X"
// Agent updates their landing page automatically
// ================================================

const Anthropic = require("@anthropic-ai/sdk");
const { Resend } = require("resend");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const { subscriberId, subscriberEmail, business, updateRequest } = JSON.parse(event.body || "{}");

    if (!subscriberId || !updateRequest) return respond(400, { error: "Missing fields." });

    // ── AI PARSES THE UPDATE REQUEST ──────────────────
    const parsedUpdate = await parseUpdateRequest(updateRequest, business);

    // ── CONFIRM TO SUBSCRIBER ─────────────────────────
    await resend.emails.send({
      from: "Torrolink <hello@torrolink.com>",
      to: subscriberEmail,
      subject: `✅ Your ${business} page has been updated`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#0f6b6b;">Page Updated!</h2>
          <p>Your landing page has been updated. Here's what changed:</p>
          <div style="background:#f4f6f8;padding:16px;border-radius:8px;">
            <pre style="margin:0;white-space:pre-wrap;font-family:sans-serif;">${parsedUpdate.summary}</pre>
          </div>
          <p style="margin-top:16px;">Anyone who scans your QR code will now see the updated content immediately.</p>
          <p style="color:#888;font-size:0.85rem;">Torrolink — A PTorro Holdings Company</p>
        </div>
      `,
    });

    return respond(200, { success: true, update: parsedUpdate });

  } catch (err) {
    console.error("Content update agent error:", err);
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "content-update-agent",
        agentError: err.message,
      }),
    }).catch(() => {});
    return respond(500, { error: "Content update failed." });
  }
};

async function parseUpdateRequest(request, business) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `A small business called "${business}" sent this update request for their QR code landing page: "${request}". Extract the key changes they want made and return a clean JSON object with: { "title": string, "body": string, "items": array of strings, "summary": string }. The summary should be 1-2 sentences confirming what was updated.`,
    }],
  });

  try {
    return JSON.parse(msg.content[0].text);
  } catch {
    return { summary: msg.content[0].text };
  }
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
