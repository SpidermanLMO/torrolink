// ================================================
// PTORRO DIGITAL — LEAD FORM TEMPLATE
// Mainframe | Reusable per client site
// ================================================
//
// SETUP PER CLIENT:
//   Replace these three constants before deploying:
//     BUSINESS_NAME  — client's business name
//     OWNER_EMAIL    — where lead notifications go
//     REPLY_FROM     — Resend sender address (e.g. leads@torrolink.com)
//
// DEPLOY:
//   1. Copy this file to the client's Netlify functions folder
//   2. Rename to lead-form.js
//   3. Fill in the three constants below
//   4. Add to netlify.toml:
//        [[redirects]]
//          from = "/lead"
//          to = "/.netlify/functions/lead-form"
//          status = 200
//   5. Deploy
// ================================================

const { Resend } = require("resend");

// ── CLIENT CONFIG ─────────────────────────────────
const BUSINESS_NAME = "YOUR BUSINESS NAME";   // e.g. "Mike's Plumbing"
const OWNER_EMAIL   = "owner@example.com";    // where leads go
const REPLY_FROM    = "leads@torrolink.com";  // verified Resend sender
// ─────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

function respond(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, { error: "Invalid JSON" });
  }

  const name    = (body.name    || "").trim();
  const request = (body.request || "").trim();
  const contact = (body.contact || "").trim(); // email or phone

  if (!name || !request || !contact) {
    return respond(400, { error: "All fields are required." });
  }

  // Basic sanity — no links in name/request (spam protection)
  if (/https?:\/\//i.test(name + request)) {
    return respond(400, { error: "Invalid submission." });
  }

  const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

  // 1. Notify business owner
  try {
    await resend.emails.send({
      from:    `${BUSINESS_NAME} Leads <${REPLY_FROM}>`,
      to:      OWNER_EMAIL,
      subject: `📥 New Lead from ${esc(name)}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;padding:24px;">
          <h2 style="margin:0 0 16px;color:#111;">New Lead — ${esc(BUSINESS_NAME)}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;font-weight:600;width:100px;">Name</td><td style="padding:8px 0;">${esc(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#555;font-weight:600;">Request</td><td style="padding:8px 0;">${esc(request)}</td></tr>
            <tr><td style="padding:8px 0;color:#555;font-weight:600;">Contact</td><td style="padding:8px 0;">${esc(contact)}</td></tr>
            <tr><td style="padding:8px 0;color:#555;font-weight:600;">Time</td><td style="padding:8px 0;">${timestamp} CT</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#888;">Submitted via your website.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Owner notify failed:", err.message);
    // Don't fail the customer-facing response over this
  }

  // 2. Auto-reply to customer (only if contact looks like an email)
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (isEmail) {
    try {
      await resend.emails.send({
        from:    `${BUSINESS_NAME} <${REPLY_FROM}>`,
        to:      contact,
        subject: `We got your message — ${BUSINESS_NAME}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;padding:24px;">
            <h2 style="margin:0 0 12px;color:#111;">Thanks, ${esc(name)}!</h2>
            <p style="color:#333;">We received your message and someone from <strong>${esc(BUSINESS_NAME)}</strong> will be in touch with you shortly.</p>
            <p style="color:#333;">Here's what you sent us:</p>
            <blockquote style="border-left:3px solid #ddd;margin:12px 0;padding:8px 16px;color:#555;">${esc(request)}</blockquote>
            <p style="color:#333;">Talk soon!</p>
            <p style="margin:0;color:#333;">— The ${esc(BUSINESS_NAME)} Team</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Auto-reply failed:", err.message);
    }
  }

  return respond(200, { ok: true, message: "Message received! We will be in touch shortly." });
};
