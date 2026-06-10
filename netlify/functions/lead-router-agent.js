// ================================================
// TORROLINK — LEAD ROUTER AGENT
// Called when someone submits the lead form on
// a customer's profile page.
// Saves the lead to Supabase, emails it to the
// business owner instantly.
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service key — can read customers table
);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const { profileHandle, name, phone, email, comment, interests } =
      JSON.parse(event.body || "{}");

    if (!profileHandle || !name) {
      return respond(400, { error: "Missing required fields." });
    }

    // Look up profile + business owner's email
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, business_name, handle, customer_id, customers(email, name)")
      .eq("handle", profileHandle)
      .eq("is_active", true)
      .single();

    if (profileErr || !profile) {
      return respond(404, { error: "Profile not found." });
    }

    const ownerEmail = profile.customers?.email;
    const ownerName  = profile.customers?.name;
    const bizName    = profile.business_name || "your business";

    // Save lead to Supabase
    await supabase.from("leads").insert({
      profile_id: profile.id,
      name,
      phone:     phone   || null,
      email:     email   || null,
      comment:   comment || null,
      interests: interests || [],
    });

    // Email the business owner
    if (ownerEmail) {
      const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
      const interestList = (interests || []).length
        ? `<p style="margin:0"><strong>Interested in:</strong> ${interests.join(", ")}</p>`
        : "";
      const commentBlock = comment
        ? `<p style="margin:8px 0 0"><strong>Message:</strong> ${escHtml(comment)}</p>`
        : "";

      await resend.emails.send({
        from:    "Torrolink Leads <leads@torrolink.com>",
        to:      ownerEmail,
        subject: `🔥 New Lead: ${escHtml(name)} scanned your QR code`,
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0f6b6b;padding:24px;border-radius:12px 12px 0 0;">
    <h2 style="color:#fff;margin:0;">New Lead!</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">Someone scanned the QR code for <strong>${escHtml(bizName)}</strong></p>
  </div>
  <div style="background:#f9f9fb;padding:24px;border-radius:0 0 12px 12px;">

    <div style="background:#fff;border-radius:10px;padding:18px 20px;margin-bottom:16px;border:1px solid #e5e5ea;">
      <p style="margin:0 0 6px"><strong>Name:</strong> ${escHtml(name)}</p>
      ${phone  ? `<p style="margin:0 0 6px"><strong>Phone:</strong> ${escHtml(phone)}</p>`  : ""}
      ${email  ? `<p style="margin:0 0 6px"><strong>Email:</strong> ${escHtml(email)}</p>`  : ""}
      ${interestList}
      ${commentBlock}
    </div>

    <p style="font-size:0.85rem;color:#888;margin:0;">
      Scanned at ${timestamp} CT &bull;
      via <a href="https://torrolink.com/p/${escHtml(profileHandle)}" style="color:#0f6b6b;">torrolink.com/p/${escHtml(profileHandle)}</a>
    </p>
  </div>
</div>`,
      });
    }

    return respond(200, { success: true });

  } catch (err) {
    console.error("Lead router error:", err);
    return respond(500, { error: "Lead routing failed." });
  }
};

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
