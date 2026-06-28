// PTorro Digital — Contact Form Handler
// Sends lead notification to laign@ptorro.com via Resend

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, business, industry, phone, email, current_site, message } = body;

  if (!name || !business || !email || !phone) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const OWNER_EMAIL   = process.env.OWNER_EMAIL || 'laign@ptorro.com';

  // ── Owner notification ──────────────────────────────────────────────────
  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0A3F3F;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#E8951A;font-size:22px;margin:0;">🔥 New Lead — PTorro Digital</h1>
      </div>
      <div style="background:#f8fbfb;padding:28px 32px;border:1px solid #d4e8e8;border-top:none;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;width:160px;">Business</td><td style="padding:8px 0;">${business}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;">Contact</td><td style="padding:8px 0;">${name}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;">Industry</td><td style="padding:8px 0;">${industry}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;">Phone</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#0f6b6b;">${phone}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#0f6b6b;">${email}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;">Current Site</td><td style="padding:8px 0;">${current_site || 'None'}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;font-weight:700;color:#0A3F3F;vertical-align:top;">Notes</td><td style="padding:8px 0;">${message}</td></tr>` : ''}
        </table>
        <div style="margin-top:24px;padding:16px;background:#fff8ec;border-radius:6px;border-left:4px solid #E8951A;">
          <strong style="color:#0A3F3F;">Next step:</strong> Build their preview and reach out within 24 hours.
        </div>
      </div>
    </div>
  `;

  // ── Prospect auto-reply ──────────────────────────────────────────────────
  const prospectHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0A3F3F;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#E8951A;font-size:22px;margin:0;">PTorro Digital</h1>
        <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:14px;">Professional websites for local businesses</p>
      </div>
      <div style="background:#ffffff;padding:28px 32px;border:1px solid #d4e8e8;border-top:none;border-radius:0 0 8px 8px;">
        <p style="font-size:16px;color:#1e1e1e;">Hi ${name},</p>
        <p style="color:#444;line-height:1.7;">Thanks for reaching out! We received your request for a free website preview for <strong>${business}</strong>.</p>
        <p style="color:#444;line-height:1.7;">Here's what happens next:</p>
        <ol style="color:#444;line-height:2;">
          <li>We research your business and build a real preview of your site</li>
          <li>We reach out within <strong>24 hours</strong> to show it to you</li>
          <li>You decide — no commitment, no pressure</li>
        </ol>
        <p style="color:#444;line-height:1.7;">Questions in the meantime? Reply to this email or reach Laign directly at <a href="mailto:laign@ptorro.com" style="color:#0f6b6b;">laign@ptorro.com</a>.</p>
        <p style="color:#444;">Talk soon,<br><strong>Laign</strong><br>PTorro Digital · PTorro Holdings LLC</p>
      </div>
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:12px;">ptorrodigital.com · Austin, TX</p>
    </div>
  `;

  try {
    // Send owner notification
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PTorro Digital <leads@torrolink.com>',
        to: [OWNER_EMAIL],
        subject: `🔥 New Lead: ${business} (${industry})`,
        html: ownerHtml,
      }),
    });

    // Send prospect auto-reply
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Laign @ PTorro Digital <hello@torrolink.com>',
        to: [email],
        subject: `We're building your preview — ${business}`,
        html: prospectHtml,
      }),
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Email send error:', err);
    return { statusCode: 500, body: 'Email failed' };
  }
};
