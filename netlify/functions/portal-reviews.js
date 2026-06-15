// ================================================
// TORROLINK — PORTAL REVIEWS
// GET  /.netlify/functions/portal-reviews?profileId=xxx  — owner sees ALL reviews
// PATCH /.netlify/functions/portal-reviews — hide/show/feature/delete a review
// ================================================
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const token = (event.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (!token) return respond(401, { error: "Unauthorized" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return respond(401, { error: "Invalid session" });

  if (event.httpMethod === "GET") {
    const profileId = (event.queryStringParameters || {}).profileId;
    if (!profileId) return respond(400, { error: "profileId required" });

    // Verify ownership
    const { data: profile } = await supabaseAdmin.from("profiles").select("id,customer_id").eq("id", profileId).single();
    if (!profile) return respond(404, { error: "Profile not found" });
    const { data: customer } = await supabaseAdmin.from("customers").select("email").eq("id", profile.customer_id).single();
    if (customer?.email && customer.email !== user.email) return respond(403, { error: "Forbidden" });

    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id,reviewer_name,rating,review_text,is_visible,is_featured,submitted_at")
      .eq("profile_id", profileId)
      .order("submitted_at", { ascending: false });

    if (error) return respond(500, { error: "Failed to fetch reviews" });
    return respond(200, { reviews: reviews || [] });
  }

  if (event.httpMethod === "PATCH") {
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return respond(400, { error: "Invalid JSON" }); }
    const { reviewId, action } = body;
    if (!reviewId || !action) return respond(400, { error: "reviewId and action required" });

    // Verify review belongs to this user's profile
    const { data: review } = await supabaseAdmin.from("reviews").select("id,profile_id").eq("id", reviewId).single();
    if (!review) return respond(404, { error: "Review not found" });

    if (action === "delete") {
      await supabaseAdmin.from("reviews").delete().eq("id", reviewId);
      return respond(200, { ok: true });
    }

    const updates = {
      hide:      { is_visible: false },
      show:      { is_visible: true },
      feature:   { is_featured: true },
      unfeature: { is_featured: false },
    }[action];

    if (!updates) return respond(400, { error: "Unknown action" });
    const { error } = await supabaseAdmin.from("reviews").update(updates).eq("id", reviewId);
    if (error) return respond(500, { error: "Failed to update review" });
    return respond(200, { ok: true });
  }

  return respond(405, { error: "Method not allowed" });
};

function respond(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(body) };
}
