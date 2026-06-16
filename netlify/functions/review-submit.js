// ================================================
// TORROLINK — REVIEW SUBMIT
// POST /.netlify/functions/review-submit
// Anon — anyone with the profile ID can submit a review
// ================================================
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return respond(400, { error: "Invalid JSON" }); }

  const { profileId, name, rating, text } = body;
  if (!profileId || !name?.trim() || !text?.trim())
    return respond(400, { error: "Name, review text, and profileId are required." });

  const reviewerName = name.trim().slice(0, 100);
  const reviewText   = text.trim().slice(0, 1000);
  const ratingNum    = Math.min(5, Math.max(1, parseInt(rating) || 5));

  // Verify profile exists and is active
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("id", profileId).eq("is_active", true).single();
  if (!profile) return respond(404, { error: "Profile not found" });

  // Rate limit: same name cannot submit more than once per profile per 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("reviews")
    .select("id")
    .eq("profile_id", profileId)
    .ilike("reviewer_name", reviewerName)
    .gte("submitted_at", cutoff)
    .limit(1)
    .maybeSingle();
  if (recent) return respond(429, { error: "You have already submitted a review for this profile recently. Please wait 24 hours before submitting another." });

  const { error } = await supabase.from("reviews").insert({
    profile_id:    profileId,
    reviewer_name: reviewerName,
    rating:        ratingNum,
    review_text:   reviewText,
    is_visible:    true,
    is_featured:   false,
  });

  if (error) { console.error("Review insert:", error); return respond(500, { error: "Failed to submit" }); }
  return respond(200, { ok: true });
};

function respond(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) };
}
