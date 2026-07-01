// pitch-lead.js — Lead capture for PTorro Digital pitch sites
// Routes all leads to laign@ptorro.com during pitch phase
// Auto-replies to customer if they provide an email address
// Also persists every lead to the public.ptorro_leads table (best-effort)

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

// Best-effort persistence to Supabase. Never throws — a DB error must not
// stop the owner-notification email from going out.
async function saveLead(lead) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('ptorro_leads').insert(lead);
    if (error) console.error('ptorro_leads insert error:', error);
  } catch (e) {
    console.error('ptorro_leads insert failed:', e);
  }
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

  // Accept BOTH the legacy camelCase contract and the field names the live
  // pitch-site / ptorrodigital.com forms actually send:
  //   name, business, business_name, phone, email, message, service
  const prettifySlug = (s) =>
    String(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

  const rawBusiness = data.businessName || data.business || data.business_name;
  const businessName = rawBusiness ? prettifySlug(rawBusiness) : 'Website';
  const customerName = (data.customerName || data.name || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const customerContact = (data.customerContact || email || phone).trim();
  const messageText = (data.message || data.customerRequest || data.service || '').trim();

  const detailParts = [];
  if (messageText) detailParts.push(messageText);
  if (phone) detailParts.push(`Phone: ${phone}`);
  if (email && email !== customerContact) detailParts.push(`Email: ${email}`);
  if (data.business_name && prettifySlug(data.business_name) !== businessName) {
    detailParts.push(`Their business: ${data.business_name}`);
  }
  const customerRequest = detailParts.join('\n') || 'No additional details provided';

  if (!customerName || !customerContact) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  // Persist to the database (best-effort, non-blocking on failure)
  await saveLead({
    name: customerName,
    business_name: data.business_name || null,
    phone: phone || null,
    email: email || null,
    message: messageText || null,
    business_slug: rawBusiness || null,
    source: 'ptorrodigital.com',
  });

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerContact.trim());
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });

  await sendEmail(
    'leads@torrolink.com',
    OWNER_EMAIL,
    `🔔 New Lead — ${businessName}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#1a1a2e">New Lead from ${businessName} Website</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold;width:140px">Name</td><td style="padding:10px">${customerName}</td></tr>
        <tr><td style="padding:10px;font-weight:bold">Request</td><td style="padding:10px">${customerRequest.replace(/\n/g, '<br>')}</td></tr>
        <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Contact</td><td style="padding:10px">${customerContact}</td></tr>
        <tr><td style="padding:10px;font-weight:bold">Time (CT)</td><td style="padding:10px">${ts}</td></tr>
      </table>
      <p style="margin-top:20px;color:#888;font-size:13px">Via PTorro Digital pitch site for ${businessName}</p>
    </div>`
  );

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
