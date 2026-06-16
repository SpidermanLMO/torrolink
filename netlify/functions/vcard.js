// ================================================
// TORROLINK — vCard Download
// GET /.netlify/functions/vcard?handle=<handle>
// Returns a .vcf file for "Save Contact" on mobile
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const handle = (event.queryStringParameters?.handle || "").toLowerCase().trim();
  if (!handle) return { statusCode: 400, body: "Missing handle" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, tagline, phone, email, links, socials, logo_url, handle")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return { statusCode: 404, body: "Profile not found" };

  // Build vCard 3.0
  const name    = profile.business_name || "";
  const phone   = profile.phone || "";
  const email   = profile.email || "";
  const tagline = profile.tagline || "";
  const url     = `https://torrolink.com/${profile.handle || handle}`;
  const photo   = profile.logo_url || "";

  // Try to find website from links
  const links = Array.isArray(profile.links) ? profile.links : [];
  const websiteLink = links.find(l => l.label?.toLowerCase().includes("web") || l.label?.toLowerCase().includes("site"));

  // Name parts (treat business_name as org + formatted name)
  const nameParts = name.split(" ");
  const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
  const firstName = nameParts[0] || "";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vcEscape(name)}`,
    `N:${vcEscape(lastName)};${vcEscape(firstName)};;;`,
    `ORG:${vcEscape(name)}`,
    tagline ? `TITLE:${vcEscape(tagline)}` : null,
    phone  ? `TEL;TYPE=CELL:${phone}` : null,
    email  ? `EMAIL;TYPE=INTERNET:${email}` : null,
    `URL:${url}`,
    websiteLink?.url ? `URL;TYPE=WEBSITE:${websiteLink.url}` : null,
    photo  ? `PHOTO;VALUE=URI:${photo}` : null,
    `NOTE:${vcEscape("Connected via Torrolink — " + url)}`,
    "END:VCARD",
  ].filter(Boolean).join("\r\n");

  const filename = handle.replace(/[^a-z0-9-]/g, "") + ".vcf";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
    body: lines,
  };
};

function vcEscape(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
