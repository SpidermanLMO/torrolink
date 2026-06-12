// ONE-TIME ADMIN USE — updates a profile by handle
// GET /.netlify/functions/profile-update?secret=ADMIN_SECRET&handle=HANDLE&action=ACTION
// WILL BE DELETED AFTER USE

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const p = event.queryStringParameters || {};
  if (!process.env.ADMIN_SECRET || p.secret !== process.env.ADMIN_SECRET) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const handle = p.handle || "ptorro-holdings-llc";
  const action = p.action || "setup-lead-form";

  if (action === "setup-lead-form") {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        tagline: "Professional Roofing — Licensed & Insured",
        bio: "PTorro Holdings LLC delivers expert residential and commercial roofing across the area. From storm damage repair to full roof replacements, we handle it all with integrity and craftsmanship. Get a FREE estimate — no pressure, no obligation. Veteran-owned and community-focused.",
        lead_form_enabled: true,
        lead_form_has_textbox: true,
        lead_form_checkboxes: [
          "Free estimate",
          "Roof repair",
          "Full replacement",
          "Storm/hail damage",
          "Insurance claim help",
          "Commercial roofing"
        ],
      })
      .eq("handle", handle)
      .select("id, handle, tagline, lead_form_enabled");

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ ok: true, data }) };
  }

  if (action === "read") {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .single();
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  return { statusCode: 400, body: "Unknown action" };
};
