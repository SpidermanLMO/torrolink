// pitch-lead.js — Lead capture for PTorro Digital pitch sites
// Routes all leads to laign@ptorro.com during pitch phase
// Auto-replies to customer if they provide an email address

const RESEND_KEY = process.env.RESEND_API_KEY;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'laign@ptorro.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sendEmail(from, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return res.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { businessName, customerName, customerRequest, customerContact } = data;
  if (!businessName || !customerName || !customerRequest || !customerContact) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerContact.trim());
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  // 1. Notify owner
  await sendEmail(
    'leads@torrolink.com',
    OWNER_EMAIL,
    `🔔 New Lead — ${businessName}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#1a1a2e">New Lead from ${businessName} Website</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold;width:140px">Name</td><td style="padding:10px">${customerName}</td></tr>
        <tr><td style="padding:10px;font-weight:bold">Request</td><td style="padding:10px">${customerRequest}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Contact</td><td style="padding:10px">${customerContact}</td></tr>
        <tr><td style="padding:10px;font-weight:bold">Time (CT)</td><td style="padding:10px">${ts}</td></tr>
      </table>
      <p style="margin-top:20px;color:#888;font-size:13px">Via PTorro Digital pitch site for ${businessName}</p>
    </div>`
  );

  // 2. Auto-reply to customer if they gave an email
  if (isEmail) {
    await sendEmail(
      `${businessName} <hello@torrolink.com>`,
      customerContact.trim(),
      `Thanks for contacting ${businessName}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px">
        <p>Hi ${customerName},</p>
        <p>Thanks for reaching out to <strong>${businessName}</strong>. We received your request and will contact you shortly to schedule your service.</p>
        <p style="margin-top:24px">Talk soon,<br/><strong>${businessName} Team</strong></p>
        <p style="margin-top:32px;color:#aaa;font-size:12px">This message was sent on behalf of ${businessName} via their website contact form.</p>
      </div>`
    );
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
