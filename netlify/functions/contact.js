// ================================================
// TORROLINK — CONTACT FORM
// POST /contact → receives form submission, emails hello@torrolink.com
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = process.env.OWNER_EMAIL || "hello@torrolink.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { name, email, business, plan, message } = body;

  if (!name || !email || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Name, email, and message are required." }),
    };
  }

  const escHtml = (s) => String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  try {
    await resend.emails.send({
      from: "Torrolink Contact Form <hello@torrolink.com>",
      to: OWNER_EMAIL,
      reply_to: email,
      subject: `New message from ${name}${business ? ` — ${business}` : ""}`,
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h2 style="color:#fff;margin:0;font-size:1.3rem;">New message — Torrolink</h2>
  </div>
  <div style="background:#f9f9fb;padding:28px 32px;border-radius:0 0 12px 12px;">
    <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#333;">
      <tr><td style="padding:8px 0;font-weight:700;width:110px;color:#888;">Name</td><td>${escHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:700;color:#888;">Email</td><td><a href="mailto:${escHtml(email)}" style="color:#0f6b6b;">${escHtml(email)}</a></td></tr>
      ${business ? `<tr><td style="padding:8px 0;font-weight:700;color:#888;">Business</td><td>${escHtml(business)}</td></tr>` : ""}
      ${plan ? `<tr><td style="padding:8px 0;font-weight:700;color:#888;">Plan</td><td>${escHtml(plan)}</td></tr>` : ""}
    </table>
    <div style="margin-top:20px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e5ea;">
      <p style="margin:0;font-size:0.9rem;color:#333;line-height:1.7;white-space:pre-wrap;">${escHtml(message)}</p>
    </div>
    <p style="font-size:0.78rem;color:#aaa;margin-top:16px;">Reply directly to this email to respond to ${escHtml(name)}.</p>
  </div>
</div>`,
    });

    // Auto-reply to the sender
    await resend.emails.send({
      from: "Torrolink <hello@torrolink.com>",
      to: email,
      subject: "We got your message — Torrolink",
      html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <span style="font-size:1.6rem;font-weight:800;color:#fff;letter-spacing:-0.02em;">Torrolink</span>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${escHtml(name.split(" ")[0])},</p>
    <p style="color:#555;line-height:1.7;">
      We received your message and we'll get back to you within one business day.
    </p>
    <p style="color:#555;line-height:1.7;">
      In the meantime, feel free to reply to this email if you have anything to add.
    </p>
    <p style="font-size:0.85rem;color:#888;margin-top:24px;">
      — The Torrolink Team<br>
      <a href="mailto:hello@torrolink.com" style="color:#0f6b6b;">hello@torrolink.com</a>
    </p>
    <p style="font-size:0.75rem;color:#bbb;margin-top:16px;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Contact form error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send message. Please try hello@torrolink.com directly." }),
    };
  }
};
