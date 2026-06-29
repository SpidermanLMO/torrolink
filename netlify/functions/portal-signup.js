// ================================================
// TORROLINK — PORTAL SIGNUP
// POST /.netlify/functions/portal-signup
// Body: { email, password }
// Uses service key to create auth user without email confirmation.
// After this returns ok:true, the client signs in with signInWithPassword.
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email and password are required." }) };
  }

  // Per-IP signup rate limit (fail-open: never block legit users on errors).
  try {
    const ip = String(event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
    const key = "signup:" + ip;
    const WINDOW_MS = 10 * 60 * 1000, MAX = 5, now = Date.now();
    const { data: rl } = await supabase.from("rate_limits").select("count, window_start").eq("key", key).maybeSingle();
    if (rl && (now - new Date(rl.window_start).getTime()) < WINDOW_MS) {
      if (rl.count >= MAX) {
        return { statusCode: 429, body: JSON.stringify({ error: "Too many signups from your network. Please try again in a few minutes." }) };
      }
      await supabase.from("rate_limits").update({ count: rl.count + 1 }).eq("key", key);
    } else {
      await supabase.from("rate_limits").upsert({ key, count: 1, window_start: new Date(now).toISOString() }, { onConflict: "key" });
    }
  } catch (_e) { /* fail-open */ }

  // Server-side password validation
  if (password.length < 8) {
    return { statusCode: 400, body: JSON.stringify({ error: "Password must be at least 8 characters." }) };
  }
  if (!/[A-Z]/.test(password)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Password must include at least one capital letter." }) };
  }
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|~]/.test(password)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Password must include at least one symbol (e.g. ! @ # $)." }) };
  }

  // Create user via admin API — email_confirm:true skips confirmation email
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });

  if (error) {
    // User already exists — tell them to sign in
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("duplicate") ||
      error.status === 422
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "An account with this email already exists. Please sign in instead.",
        }),
      };
    }
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, userId: data.user.id }),
  };
};
