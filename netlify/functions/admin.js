// ================================================
// TORROLINK — ADMIN DASHBOARD
// GET  /admin  → full dashboard
// POST /admin  → action handler (AJAX)
// Protected by ADMIN_PASSWORD env var
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }       = require("resend");
const crypto           = require("crypto");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend      = new Resend(process.env.RESEND_API_KEY);
const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";
const ENV_PASS    = process.env.ADMIN_PASSWORD || "changeme";
let EFFECTIVE_PASS = ENV_PASS;

async function loadEffectivePass() {
  try {
    const { data } = await supabaseAdmin.from("admin_config").select("value").eq("key", "admin_password").single();
    if (data?.value) EFFECTIVE_PASS = data.value;
  } catch { /* fall back to env var */ }
}

function _genCode(len = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = ""; for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]; return s;
}
function _slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
async function _uniqueHandle(base) {
  let h = _slugify(base) || "business", n = 0;
  while (true) {
    const c = n === 0 ? h : `${h}-${n}`;
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("handle", c).maybeSingle();
    if (!data) return c; n++;
  }
}
async function _uniqueCode() {
  while (true) {
    const code = _genCode(8);
    const { data } = await supabaseAdmin.from("profiles").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
}

// Generate a short-lived HMAC token (5-min windows) — embedded in HTML instead of raw password
function makeToken() {
  const ts = Math.floor(Date.now() / 300000);
  return crypto.createHmac("sha256", EFFECTIVE_PASS).update(String(ts)).digest("hex").slice(0, 32);
}
function checkToken(tok) {
  const ts = Math.floor(Date.now() / 300000);
  for (const t of [ts, ts - 1, ts - 2]) { // 10-min grace window
    if (tok === crypto.createHmac("sha256", EFFECTIVE_PASS).update(String(t)).digest("hex").slice(0, 32)) return true;
  }
  return false;
}

function isAuthed(event) {
  const authHdr = event.headers["authorization"] || "";
  // Basic Auth (initial page load via browser dialog)
  if (/^Basic\s+/i.test(authHdr)) {
    const h = authHdr.replace(/^Basic\s+/i, "");
    try {
      const [, pass] = Buffer.from(h, "base64").toString("utf-8").split(":");
      return pass === EFFECTIVE_PASS;
    } catch { return false; }
  }
  // Bearer token (AJAX actions — token is HMAC, not the raw password)
  if (/^Bearer\s+/i.test(authHdr)) {
    return checkToken(authHdr.replace(/^Bearer\s+/i, ""));
  }
  return false;
}
function unauthed() {
  return { statusCode: 401, headers: { "WWW-Authenticate": 'Basic realm="Torrolink Admin"', "Content-Type": "text/plain" }, body: "Unauthorized" };
}

exports.handler = async (event) => {
  await loadEffectivePass();
  if (!isAuthed(event)) return unauthed();
  if (event.httpMethod === "POST") return handleAction(event);
  return handleDashboard();
};

async function handleAction(event) {
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  const { action, profileId, customerId } = body;
  try {
    switch (action) {
      case "suspend": {
        await supabaseAdmin.from("profiles").update({ suspended: true, is_active: false }).eq("id", profileId);
        return json(200, { ok: true, msg: "Profile suspended" });
      }
      case "activate": {
        await supabaseAdmin.from("profiles").update({ suspended: false, is_active: true }).eq("id", profileId);
        return json(200, { ok: true, msg: "Profile activated" });
      }
      case "toggle_metrics": {
        const { data: cust } = await supabaseAdmin.from("customers").select("metrics_active").eq("id", customerId).single();
        const next = !cust?.metrics_active;
        await supabaseAdmin.from("customers").update({ metrics_active: next }).eq("id", customerId);
        await supabaseAdmin.from("profiles").update({ has_metrics: next }).eq("customer_id", customerId);
        return json(200, { ok: true, msg: next ? "Metrics enabled" : "Metrics disabled", state: next });
      }
      case "grant_free_month": {
        const freeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin.from("customers").update({ metrics_active: true, free_until: freeUntil }).eq("id", customerId);
        await supabaseAdmin.from("profiles").update({ has_metrics: true }).eq("customer_id", customerId);
        const { data: cust } = await supabaseAdmin.from("customers").select("email, name").eq("id", customerId).single();
        if (cust?.email) {
          const firstName = (cust.name || "").split(" ")[0] || "there";
          await resend.emails.send({
            from: "Torrolink <orders@torrolink.com>", to: cust.email,
            subject: "You've got a free month of Metrics & Leads — Torrolink",
            html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;"><span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span></div><div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;"><p style="font-size:1rem;color:#333;">Hey ${firstName},</p><p style="color:#555;line-height:1.7;">We've added a <strong>free month of Metrics &amp; Leads</strong> to your account — on us. You can see real-time scan analytics and captured leads from your portal right now.</p><div style="text-align:center;margin:28px 0;"><a href="${SITE}/portal" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">View My Dashboard →</a></div><p style="font-size:0.85rem;color:#888;">— The Torrolink Team</p></div></div>`,
          }).catch(() => {});
        }
        return json(200, { ok: true, msg: "Free month granted + email sent" });
      }
      case "send_email": {
        const { email, name, subject, message } = body;
        if (!email || !subject || !message) return json(400, { error: "Missing fields" });
        const firstName = (name || "").split(" ")[0] || "there";
        await resend.emails.send({
          from: "Torrolink <orders@torrolink.com>", to: email, subject,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;"><span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span></div><div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;"><p style="font-size:1rem;color:#333;">Hey ${firstName},</p><div style="color:#555;line-height:1.7;">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</div><p style="font-size:0.85rem;color:#888;margin-top:24px;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p></div></div>`,
        });
        return json(200, { ok: true, msg: "Email sent" });
      }
      case "reset_password": {
        const { email: resetEmail, name: resetName } = body;
        if (!resetEmail) return json(400, { error: "Missing email" });
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: resetEmail,
          options: { redirectTo: `${SITE}/portal` },
        });
        if (linkErr) return json(500, { error: linkErr.message });
        const resetLink = linkData?.properties?.action_link || linkData?.action_link;
        if (!resetLink) return json(500, { error: "Could not generate reset link" });
        const firstName = (resetName || "").split(" ")[0] || "there";
        await resend.emails.send({
          from: "Torrolink <orders@torrolink.com>",
          to: resetEmail,
          subject: "Reset your Torrolink password",
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;"><span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span></div><div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;"><p style="font-size:1rem;color:#333;">Hey ${firstName},</p><p style="color:#555;line-height:1.7;">A password reset was requested for your Torrolink account. Click the button below to set a new password. This link expires in 1 hour and can only be used once.</p><div style="text-align:center;margin:28px 0;"><a href="${resetLink}" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">Reset My Password \u2192</a></div><p style="color:#888;font-size:0.85rem;">If you didn't request this, you can safely ignore this email.</p><p style="font-size:0.85rem;color:#888;margin-top:16px;">— The Torrolink Team</p></div></div>`,
        });
        return json(200, { ok: true, msg: "Password reset link sent to " + resetEmail });
      }
      case "delete_profile": {
        if (!profileId) return json(400, { error: "profileId required" });
        const { error: delErr } = await supabaseAdmin.from("profiles").delete().eq("id", profileId);
        if (delErr) return json(500, { error: delErr.message });
        return json(200, { ok: true, msg: "Profile deleted" });
      }
      case "toggle_review": {
        const { reviewId, visible } = body;
        if (!reviewId) return json(400, { error: "reviewId required" });
        await supabaseAdmin.from("reviews").update({ is_visible: !!visible }).eq("id", reviewId);
        return json(200, { ok: true, msg: visible ? "Review shown" : "Review hidden" });
      }
      case "delete_review": {
        const { reviewId } = body;
        if (!reviewId) return json(400, { error: "reviewId required" });
        await supabaseAdmin.from("reviews").delete().eq("id", reviewId);
        return json(200, { ok: true, msg: "Review deleted" });
      }
      case "bulk_email": {
        const { subject, message } = body;
        if (!subject || !message) return json(400, { error: "Missing subject or message" });
        const { data: allCusts } = await supabaseAdmin.from("customers").select("email, name");
        const list = (allCusts || []).filter(c => c.email);
        let sent = 0;
        for (const c of list) {
          const firstName = (c.name || "").split(" ")[0] || "there";
          await resend.emails.send({
            from: "Torrolink <orders@torrolink.com>", to: c.email, subject,
            html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;"><div style="background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:28px 32px;border-radius:12px 12px 0 0;"><span style="font-size:1.4rem;font-weight:800;color:#fff;">Torrolink</span></div><div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;"><p style="font-size:1rem;color:#333;">Hey ${firstName},</p><div style="color:#555;line-height:1.7;">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</div><p style="font-size:0.85rem;color:#888;margin-top:24px;">— The Torrolink Team<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p></div></div>`,
          }).catch(() => {});
          sent++;
        }
        return json(200, { ok: true, msg: `Bulk email sent to ${sent} customers` });
      }
      case "change_password": {
        const { currentPassword, newPassword } = body;
        if (!currentPassword || !newPassword) return json(400, { error: "Missing fields" });
        if (currentPassword !== EFFECTIVE_PASS) return json(403, { error: "Current password is incorrect" });
        if (newPassword.length < 8) return json(400, { error: "New password must be at least 8 characters" });
        await supabaseAdmin.from("admin_config").upsert({ key: "admin_password", value: newPassword }, { onConflict: "key" });
        EFFECTIVE_PASS = newPassword;
        return json(200, { ok: true, msg: "Password updated. Reload and log in with your new password." });
      }
      case "create_beta": {
        const { name: bName, email: bEmail, businessName: bBiz } = body;
        if (!bEmail || !bBiz) return json(400, { error: "Email and business name required" });
        const cleanEmail = bEmail.trim().toLowerCase();
        // Create auth user (no email confirmation needed — we send the setup link)
        const { error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail, email_confirm: true,
        });
        if (authErr && !authErr.message.toLowerCase().includes("already")) {
          return json(500, { error: authErr.message });
        }
        // Upsert customer
        let betaCustId;
        const { data: existBeta } = await supabaseAdmin.from("customers").select("id").eq("email", cleanEmail).maybeSingle();
        if (existBeta) {
          betaCustId = existBeta.id;
          await supabaseAdmin.from("customers").update({ plan: "beta", metrics_active: true }).eq("id", betaCustId);
        } else {
          const { data: newBC, error: bcErr } = await supabaseAdmin.from("customers")
            .insert({ email: cleanEmail, name: bName || bBiz, plan: "beta", metrics_active: true })
            .select("id").single();
          if (bcErr) return json(500, { error: bcErr.message });
          betaCustId = newBC.id;
        }
        // Create profile
        const bHandle = await _uniqueHandle(bBiz);
        const bCode   = await _uniqueCode();
        const { data: bProf, error: bpErr } = await supabaseAdmin.from("profiles")
          .insert({ customer_id: betaCustId, handle: bHandle, code: bCode, business_name: bBiz, is_active: true, has_metrics: true })
          .select("id, handle, code").single();
        if (bpErr) return json(500, { error: bpErr.message });
        const bQrUrl  = `${SITE}/q/${bProf.code}`;
        const bProfUrl = `${SITE}/p/${bProf.handle}`;
        // Generate QR image
        const QRCode = require("qrcode");
        const bQrData = await QRCode.toDataURL(bQrUrl, { errorCorrectionLevel: "H", width: 1200, margin: 2, color: { dark: "#0a4d4d", light: "#ffffff" } });
        const bQrB64 = bQrData.replace(/^data:image\/png;base64,/, "");
        // Generate account setup link (recovery link lets them set their own password)
        const { data: bLink } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery", email: cleanEmail, options: { redirectTo: `${SITE}/portal` },
        });
        const setupLink = bLink?.properties?.action_link || bLink?.action_link || `${SITE}/portal`;
        // Welcome email with QR attached
        const bFirst = (bName || bBiz).split(" ")[0] || "there";
        await resend.emails.send({
          from: "Torrolink <orders@torrolink.com>",
          to: bEmail,
          subject: "You're in — here's your Torrolink QR code 🎉",
          attachments: [{ filename: "torrolink-qr.png", content: bQrB64 }],
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:1.7rem;">You're in — let's test this thing.</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Exclusive beta access · No payment required</p>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="font-size:1rem;color:#333;">Hey ${esc(bFirst)},</p>
    <p style="color:#555;line-height:1.7;">I'm giving you early access to <strong>Torrolink</strong> — a QR code profile platform built for small businesses like yours. Your QR code for <strong>${esc(bBiz)}</strong> is attached to this email as a high-res PNG.</p>
    <div style="background:#fff;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #e5e5ea;text-align:center;">
      <p style="margin:0 0 4px;font-size:0.88rem;color:#888;">Your live profile page</p>
      <a href="${bProfUrl}" style="color:#0f6b6b;font-weight:700;font-size:1rem;">${bProfUrl}</a>
      <p style="margin:8px 0 0;font-size:0.82rem;color:#aaa;">This is what people see when they scan your QR code.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <p style="font-weight:700;color:#333;margin:0 0 6px;">Step 1 — Activate your account</p>
      <a href="${setupLink}" style="background:#0f6b6b;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">Set Up My Account →</a>
      <p style="font-size:0.8rem;color:#aaa;margin:8px 0 0;">Click to create a password — takes 30 seconds. Link expires in 24 hours.</p>
    </div>
    <div style="background:#f0fafa;border-radius:10px;padding:18px 20px;border:1px solid #c5e8e8;">
      <p style="margin:0 0 8px;font-weight:700;color:#333;">After you're in, I'd love your honest feedback:</p>
      <ul style="color:#555;line-height:2.2;margin:0;padding-left:18px;">
        <li>What's confusing or missing?</li>
        <li>Would you pay for this? What price feels right?</li>
        <li>What would make you actually use the QR code?</li>
      </ul>
    </div>
    <p style="color:#555;line-height:1.7;margin-top:24px;">Just reply to this email — I read everything.</p>
    <p style="font-size:0.85rem;color:#888;margin-top:16px;">— Laign Orros, Founder<br><a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</div>`,
        });
        // Owner alert
        await resend.emails.send({
          from: "Torrolink Alerts <orders@torrolink.com>", to: OWNER_EMAIL,
          subject: `🧪 Beta tester created: ${esc(bBiz)}`,
          html: `<p><strong>${esc(bName||bBiz)}</strong> (${esc(bEmail)}) added as beta tester.<br>Profile: <a href="${bProfUrl}">${bProfUrl}</a></p>`,
        }).catch(() => {});
        return json(200, { ok: true, msg: `Beta account created — welcome email sent to ${cleanEmail}`, profileUrl: bProfUrl });
      }
      default: return json(400, { error: "Unknown action" });
    }
  } catch (err) {
    console.error("Admin action error:", err);
    return json(500, { error: err.message });
  }
}

async function handleDashboard() {
  const [custRes, profRes, scanRes, leadRes, revRes] = await Promise.all([
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, handle, business_name, is_active, suspended, has_metrics, has_branding, branding_tier, created_at, customer_id, code").order("created_at", { ascending: false }),
    supabaseAdmin.from("scan_events").select("id, scanned_at, profile_id"),
    supabaseAdmin.from("leads").select("id, submitted_at, profile_id"),
    supabaseAdmin.from("reviews").select("id, profile_id, reviewer_name, rating, review_text, is_visible, submitted_at").order("submitted_at", { ascending: false }),
  ]);
  const customers = custRes.data || [];
  const profiles  = profRes.data  || [];
  const scans     = scanRes.data  || [];
  const leads     = leadRes.data  || [];
  const reviews   = revRes.data   || [];

  const custById = {};
  customers.forEach(c => { custById[c.id] = c; });

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const scansByProfile = {}, recentByProfile = {}, leadsByProfile = {};
  scans.forEach(s => {
    scansByProfile[s.profile_id] = (scansByProfile[s.profile_id] || 0) + 1;
    if (new Date(s.scanned_at) > cutoff) recentByProfile[s.profile_id] = (recentByProfile[s.profile_id] || 0) + 1;
  });
  leads.forEach(l => { leadsByProfile[l.profile_id] = (leadsByProfile[l.profile_id] || 0) + 1; });
  const reviewsByProfile = {};
  reviews.forEach(r => {
    if (!reviewsByProfile[r.profile_id]) reviewsByProfile[r.profile_id] = [];
    reviewsByProfile[r.profile_id].push(r);
  });

  const activeCount  = profiles.filter(p => p.is_active && !p.suspended).length;
  const suspendCount = profiles.filter(p => p.suspended).length;
  const metricsCount = customers.filter(c => c.metrics_active).length;
  const PRICES = { "qr-code":28.33,"branding":9.28,"custom-branding":18.28,"qr-code-branding":37.61,"qr-code-custom-branding":46.61,"metrics":10.28 };
  const totalRevenue = customers.reduce((s, c) => s + (PRICES[c.plan] || 28.33), 0);

  const rows = profiles.map(p => {
    const cust     = custById[p.customer_id] || {};
    const scans30  = recentByProfile[p.id] || 0;
    const scansAll = scansByProfile[p.id] || 0;
    const lcount   = leadsByProfile[p.id] || 0;
    const isSusp   = p.suspended;
    const statusBadge = isSusp ? `<span class="badge susp">Suspended</span>` : p.is_active ? `<span class="badge active">Active</span>` : `<span class="badge inactive">Inactive</span>`;
    const metricsBadge = p.has_metrics ? `<span class="badge metrics">Metrics</span>` : `<span class="badge free">—</span>`;
    const freeLabel = cust.free_until ? `<br><small style="color:#3fb950;">Free until ${new Date(cust.free_until).toLocaleDateString()}</small>` : "";
    const isBeta = cust.plan === "beta";
    const planLabel = isBeta ? `<span class="badge beta">Beta</span>` : (cust.plan ? esc(cust.plan) : "—");
    const revList = reviewsByProfile[p.id] || [];
    const revCount = revList.length;
    return `<tr data-profile-id="${esc(p.id)}" data-customer-id="${esc(p.customer_id||"")}" data-email="${esc(cust.email||"")}" data-name="${esc(cust.name||"")}">
      <td><strong>${esc(p.business_name||"—")}</strong><br><small style="color:#888;">${esc(cust.email||"—")}</small>${freeLabel}</td>
      <td>
        <a href="${SITE}/p/${esc(p.handle)}" target="_blank" class="plink">/${esc(p.handle)}</a>
        <a href="${SITE}/p/${esc(p.handle)}" target="_blank" title="View profile" class="ba view" style="margin-left:6px;text-decoration:none;padding:3px 7px;">👁</a>
      </td>
      <td>${statusBadge}</td>
      <td><small style="color:#8b949e;">${planLabel}</small><br>${metricsBadge}</td>
      <td>${p.has_branding ? `<span class="badge brand">${esc(p.branding_tier||"std")}</span>` : "—"}</td>
      <td class="num">${scans30}<br><small style="color:#555;">${scansAll} all</small></td>
      <td class="num">${lcount}</td>
      <td class="num" style="cursor:${revCount>0?'pointer':'default'};" ${revCount>0?`onclick="openReviews(this)" data-reviews='${JSON.stringify(revList).replace(/'/g,"&#39;").replace(/\\/g,"\\\\")}'`:""} >${revCount > 0 ? `<span style="color:#e3b341;">${revCount} ★</span>` : "—"}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
      <td><div class="ag">
        ${isSusp ? `<button class="ba act" onclick="doAction('activate',this)">✅ Activate</button>` : `<button class="ba sus" onclick="doAction('suspend',this)">🚫 Suspend</button>`}
        <button class="ba met" onclick="doAction('toggle_metrics',this)">${p.has_metrics?"📊 Off":"📊 On"}</button>
        <button class="ba fre" onclick="doAction('grant_free_month',this)">🎁 Free Mo</button>
        <button class="ba eml" onclick="openEmail(this)">✉️ Email</button>
        <button class="ba rst" onclick="doReset(this)">🔑 Reset PW</button>
        <button class="ba del" onclick="doDelete(this)">🗑 Delete</button>
      </div></td>
    </tr>`;
  }).join("");

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Torrolink Admin</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh}
.topbar{background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(0,0,0,0.5)}
.topbar h1{font-size:1.25rem;font-weight:800;color:#fff}
.topbar span{font-size:0.8rem;color:rgba(255,255,255,0.6)}
.main{padding:24px 28px;max-width:1700px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
.stat{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px;text-align:center}
.stat .v{font-size:1.8rem;font-weight:800;color:#fff}.stat .l{font-size:.72rem;color:#8b949e;margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
.stat.g .v{color:#3fb950}.stat.o .v{color:#f4752b}.stat.t .v{color:#39d3d3}.stat.r .v{color:#f85149}
.toolbar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.toolbar input,.toolbar select{background:#161b22;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:8px;font-size:.88rem;outline:none}
.toolbar input:focus,.toolbar select:focus{border-color:#0f6b6b}
.toolbar input{width:260px}
.cnt{font-size:.82rem;color:#8b949e;margin-left:auto}
.rbtn{background:#21262d;color:#e6edf3;border:1px solid #30363d;padding:7px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem}
.tw{background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{background:#0d1117;color:#8b949e;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;padding:10px 14px;text-align:left;border-bottom:1px solid #30363d;white-space:nowrap}
td{padding:10px 14px;border-bottom:1px solid #21262d;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#1c2128}
.num{text-align:center}
.plink{color:#39d3d3;text-decoration:none;font-weight:600}.plink:hover{text-decoration:underline}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:.72rem;font-weight:700}
.badge.active{background:#1a3a1a;color:#3fb950;border:1px solid #238636}
.badge.inactive{background:#2d2d2d;color:#888;border:1px solid #444}
.badge.susp{background:#3a1a1a;color:#f85149;border:1px solid #f85149}
.badge.metrics{background:#1a2a3a;color:#58a6ff;border:1px solid #388bfd}
.badge.free{color:#555}
.badge.brand{background:#2a1a3a;color:#d2a8ff;border:1px solid #8957e5}
.badge.beta{background:#1a2a3a;color:#f0b429;border:1px solid #e3a008}
.ag{display:flex;gap:5px;flex-wrap:wrap}
.ba{border:none;padding:4px 9px;border-radius:6px;font-size:.76rem;font-weight:700;cursor:pointer;transition:opacity .15s}
.ba:hover{opacity:.8}.ba:disabled{opacity:.35;cursor:not-allowed}
.ba.sus{background:#3a1a1a;color:#f85149}.ba.act{background:#1a3a1a;color:#3fb950}
.ba.met{background:#1a2a3a;color:#58a6ff}.ba.fre{background:#2a2a1a;color:#e3b341}
.ba.eml{background:#2a1a3a;color:#d2a8ff}
#toast{position:fixed;bottom:24px;right:24px;background:#238636;color:#fff;padding:11px 18px;border-radius:9px;font-weight:700;font-size:.88rem;display:none;z-index:999;box-shadow:0 4px 18px rgba(0,0,0,0.5)}
#toast.err{background:#da3633}
.mbg{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:200;align-items:center;justify-content:center}
.mbg.open{display:flex}
.modal{background:#161b22;border:1px solid #30363d;border-radius:14px;padding:28px;width:500px;max-width:95vw}
.modal h3{color:#fff;font-size:1.05rem;margin-bottom:16px}
.modal label{display:block;font-size:.8rem;color:#8b949e;margin-bottom:3px;margin-top:12px}
.modal input,.modal textarea{width:100%;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:9px 11px;border-radius:7px;font-size:.88rem;font-family:inherit;outline:none}
.modal input:focus,.modal textarea:focus{border-color:#0f6b6b}
.modal textarea{resize:vertical;min-height:110px}
.ma{display:flex;gap:8px;margin-top:18px;justify-content:flex-end}
.bcn{background:#21262d;color:#e6edf3;border:none;padding:9px 18px;border-radius:7px;cursor:pointer;font-weight:600}
.bsd{background:#0f6b6b;color:#fff;border:none;padding:9px 18px;border-radius:7px;cursor:pointer;font-weight:600}
.ba.rst{background:#1a2a3a;color:#58a6ff}.ba.del{background:#3a1a1a;color:#f85149}.ba.view{background:#1a2d1a;color:#3fb950}
.rv-row{display:flex;gap:8px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #21262d}
.rv-row:last-child{border-bottom:none}
.rv-stars{color:#e3b341;font-size:1rem;white-space:nowrap}.rv-name{font-weight:700;font-size:.85rem;color:#e6edf3}
.rv-text{color:#8b949e;font-size:.82rem;margin-top:2px}.rv-meta{font-size:.72rem;color:#555;margin-top:3px}
.rv-actions{display:flex;gap:5px;margin-left:auto;flex-shrink:0}
.bulk-bar{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px 20px;margin-bottom:18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bulk-bar input{flex:1;min-width:200px;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:7px;font-size:.88rem;outline:none}
.bulk-bar input:focus{border-color:#0f6b6b}
.tab-bar{display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #21262d}
.tab{background:none;border:none;border-bottom:3px solid transparent;color:#8b949e;font-size:.88rem;font-weight:600;padding:10px 22px;cursor:pointer;transition:all .15s;margin-bottom:-2px}
.tab:hover{color:#e6edf3}.tab.active{color:#39d3d3;border-bottom-color:#39d3d3}
.settings-panel{max-width:540px;padding-top:4px}
.settings-card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;margin-bottom:20px}
.settings-card h3{color:#e6edf3;font-size:1rem;margin-bottom:8px}
.settings-card p{color:#8b949e;font-size:.85rem;margin-bottom:4px;line-height:1.6}
.settings-card label{display:block;font-size:.8rem;color:#8b949e;margin:14px 0 4px}
.settings-card input{width:100%;background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:9px 12px;border-radius:7px;font-size:.88rem;font-family:inherit;outline:none}
.settings-card input:focus{border-color:#0f6b6b}
.sbtn{margin-top:20px;background:#0f6b6b;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:.88rem;cursor:pointer}
.sbtn:hover{background:#0d5c5c}.sbtn:disabled{opacity:.5;cursor:not-allowed}
</style></head><body>
<div class="topbar"><h1>🛠 Torrolink Admin</h1><span>Loaded ${new Date().toLocaleString()}</span></div>
<div class="main">
<div class="stats">
  <div class="stat g"><div class="v">${profiles.length}</div><div class="l">Profiles</div></div>
  <div class="stat g"><div class="v">${activeCount}</div><div class="l">Active</div></div>
  <div class="stat r"><div class="v">${suspendCount}</div><div class="l">Suspended</div></div>
  <div class="stat t"><div class="v">${metricsCount}</div><div class="l">Metrics Subs</div></div>
  <div class="stat o"><div class="v">$${totalRevenue.toFixed(0)}</div><div class="l">Est. Revenue</div></div>
  <div class="stat t"><div class="v">${scans.length.toLocaleString()}</div><div class="l">Total Scans</div></div>
  <div class="stat"><div class="v">${leads.length}</div><div class="l">Total Leads</div></div>
  <div class="stat"><div class="v">${customers.length}</div><div class="l">Customers</div></div>
</div>
<div class="tab-bar">
  <button class="tab active" onclick="switchTab('customers',this)">&#128100; Customers</button>
  <button class="tab" onclick="switchTab('settings',this)">&#9881;&#65039; Settings</button>
</div>
<div id="tab-customers">
<div class="toolbar">
  <input type="text" id="search" placeholder="🔍  Search business, email, handle…" oninput="ft()"/>
  <select id="fs" onchange="ft()"><option value="">All Status</option><option value="active">Active</option><option value="susp">Suspended</option></select>
  <select id="fm" onchange="ft()"><option value="">All Plans</option><option value="yes">Has Metrics</option><option value="no">No Metrics</option></select>
  <span class="cnt" id="cnt">${profiles.length} profiles</span>
  <button class="rbtn" onclick="openBeta()" style="background:#1a1a2d;color:#f0b429;border-color:#e3a008;">🧪 Add Beta Tester</button>
  <button class="rbtn" onclick="openBe()" style="background:#1a2d1a;color:#3fb950;border-color:#238636;">📢 Bulk Email</button>
  <button class="rbtn" onclick="exportCsv()">⬇ Export CSV</button>
  <button class="rbtn" onclick="location.reload()">↺ Refresh</button>
</div>
<div class="tw"><table id="tbl">
<thead><tr><th>Business / Email</th><th>Profile URL</th><th>Status</th><th>Plan / Metrics</th><th>Branding</th><th>Scans 30d</th><th>Leads</th><th>Reviews</th><th>Joined</th><th>Actions</th></tr></thead>
<tbody>${rows||'<tr><td colspan="9" style="text-align:center;color:#555;padding:60px;">No profiles yet</td></tr>'}</tbody>
</table></div>
</div>
<div id="tab-settings" style="display:none">
<div class="settings-panel">
  <div class="settings-card">
    <h3>&#128273; Change Admin Password</h3>
    <p>Enter your current password to verify, then set a new one. The change takes effect immediately — you'll need the new password next time you log in.</p>
    <label>Current Password</label>
    <input type="password" id="sCurrent" placeholder="Your current password" autocomplete="current-password"/>
    <label>New Password <span style="font-weight:400;color:#555">(min 8 characters)</span></label>
    <input type="password" id="sNew" placeholder="New password" autocomplete="new-password"/>
    <label>Confirm New Password</label>
    <input type="password" id="sConfirm" placeholder="Type new password again" autocomplete="new-password"/>
    <button class="sbtn" onclick="changePass()">Save New Password</button>
  </div>
</div>
</div>
</div>

<div class="mbg" id="em"><div class="modal">
  <h3>✉️ Send Email</h3>
  <label>To</label><input type="text" id="eTo" readonly/>
  <label>Subject</label><input type="text" id="eSub" value="A message from Torrolink"/>
  <label>Message</label><textarea id="eMsg" placeholder="Write your message…"></textarea>
  <input type="hidden" id="eName"/>
  <div class="ma"><button class="bcn" onclick="closeEm()">Cancel</button><button class="bsd" id="sendBtn" onclick="sendEm()">Send →</button></div>
</div></div>

<div class="mbg" id="rv"><div class="modal" style="width:620px;max-width:95vw;">
  <h3>⭐ Reviews</h3>
  <div id="rvList" style="max-height:400px;overflow-y:auto;margin-top:8px;"></div>
  <div class="ma"><button class="bcn" onclick="closeRv()">Close</button></div>
</div></div>

<div class="mbg" id="be"><div class="modal" style="width:560px;max-width:95vw;">
  <h3>📢 Bulk Email — All Customers</h3>
  <label>Subject</label><input type="text" id="beSubj" value="A message from Torrolink"/>
  <label>Message</label><textarea id="beMsg" placeholder="Write your message to all customers…" style="min-height:130px;"></textarea>
  <div class="ma"><button class="bcn" onclick="closeBe()">Cancel</button><button class="bsd" id="beBtn" onclick="sendBulk()">Send to All →</button></div>
</div></div>

<div class="mbg" id="betaMdl"><div class="modal" style="width:480px;max-width:95vw;">
  <h3>🧪 Add Beta Tester</h3>
  <p style="font-size:.82rem;color:#8b949e;margin-bottom:4px;">Creates a free account, generates their QR code, and sends them a welcome email with a setup link.</p>
  <label>Full Name <span style="color:#555;font-weight:400;">(optional)</span></label>
  <input type="text" id="btName" placeholder="Jane Smith"/>
  <label>Email <span style="color:#f85149;">*</span></label>
  <input type="email" id="btEmail" placeholder="jane@herbusiness.com"/>
  <label>Business Name <span style="color:#f85149;">*</span></label>
  <input type="text" id="btBiz" placeholder="Jane's Landscaping"/>
  <div class="ma"><button class="bcn" onclick="closeBeta()">Cancel</button><button class="bsd" id="btBtn" style="background:#e3a008;" onclick="sendBeta()">Create & Send Invite →</button></div>
</div></div>

<div id="toast"></div>
<script>
const AU='/.netlify/functions/admin';
const AT='${makeToken()}';
function toast(m,e){const t=document.getElementById('toast');t.textContent=m;t.className=e?'err':'';t.style.display='block';setTimeout(()=>t.style.display='none',3200)}
async function doAction(a,btn){
  const row=btn.closest('tr');
  const pid=row.dataset.profileId,cid=row.dataset.customerId;
  btn.disabled=true;const orig=btn.textContent;btn.textContent='…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:a,profileId:pid,customerId:cid})});
    const d=await r.json();
    if(d.ok){toast(d.msg||'Done');setTimeout(()=>location.reload(),1200)}
    else{toast(d.error||'Error',true);btn.disabled=false;btn.textContent=orig}
  }catch(e){toast('Network error',true);btn.disabled=false;btn.textContent=orig}
}
function openEmail(btn){const row=btn.closest('tr');document.getElementById('eTo').value=row.dataset.email;document.getElementById('eName').value=row.dataset.name;document.getElementById('eMsg').value='';document.getElementById('em').classList.add('open')}
function closeEm(){document.getElementById('em').classList.remove('open')}
async function sendEm(){
  const btn=document.getElementById('sendBtn');
  const msg=document.getElementById('eMsg').value.trim();
  if(!msg){toast('Write a message first',true);return}
  btn.disabled=true;btn.textContent='Sending…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'send_email',email:document.getElementById('eTo').value,name:document.getElementById('eName').value,subject:document.getElementById('eSub').value,message:msg})});
    const d=await r.json();
    if(d.ok){toast('Email sent ✓');closeEm()}else{toast(d.error||'Failed',true)}
  }catch(e){toast('Network error',true)}
  btn.disabled=false;btn.textContent='Send →'
}
function ft(){
  const q=document.getElementById('search').value.toLowerCase();
  const fs=document.getElementById('fs').value;
  const fm=document.getElementById('fm').value;
  const rows=document.querySelectorAll('#tbl tbody tr');
  let v=0;
  rows.forEach(r=>{
    const txt=r.textContent.toLowerCase();
    const isSusp=r.querySelector('.badge.susp');
    const hasM=r.querySelector('.badge.metrics');
    const mQ=!q||txt.includes(q);
    const mS=!fs||(fs==='active'?!isSusp:!!isSusp);
    const mM=!fm||(fm==='yes'?!!hasM:!hasM);
    const show=mQ&&mS&&mM;
    r.style.display=show?'':'none';
    if(show)v++;
  });
  document.getElementById('cnt').textContent=v+' profiles';
}
async function doReset(btn){
  const row=btn.closest('tr');
  const email=row.dataset.email, name=row.dataset.name;
  if(!email){toast('No email found',true);return;}
  if(!confirm('Send password reset link to '+email+'?'))return;
  btn.disabled=true;btn.textContent='…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'reset_password',email,name})});
    const d=await r.json();
    if(d.ok)toast(d.msg||'Reset sent');
    else toast(d.error||'Error',true);
  }catch(e){toast('Network error',true);}
  btn.disabled=false;btn.textContent='🔑 Reset PW';
}
async function doDelete(btn){
  const row=btn.closest('tr');
  const biz=row.querySelector('strong')?.textContent||'this profile';
  if(!confirm('Permanently delete '+biz+'? This cannot be undone.'))return;
  const pid=row.dataset.profileId;
  btn.disabled=true;btn.textContent='…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'delete_profile',profileId:pid})});
    const d=await r.json();
    if(d.ok){toast(d.msg||'Deleted');row.remove();}
    else{toast(d.error||'Error',true);btn.disabled=false;btn.textContent='🗑 Delete';}
  }catch(e){toast('Network error',true);btn.disabled=false;btn.textContent='🗑 Delete';}
}
function openReviews(td){
  let reviews=[];
  try{reviews=JSON.parse(td.dataset.reviews||'[]');}catch(e){}
  const list=document.getElementById('rvList');
  if(!reviews.length){list.innerHTML='<p style="color:#555;text-align:center;padding:24px;">No reviews yet.</p>';}
  else{
    list.innerHTML=reviews.map(function(rv){
      const stars='★'.repeat(rv.rating)+'☆'.repeat(5-rv.rating);
      const vis=rv.is_visible;
      return '<div class="rv-row">'+
        '<div style="flex:1;">'+
          '<div class="rv-stars">'+stars+'</div>'+
          '<div class="rv-name">'+escH(rv.reviewer_name)+'</div>'+
          '<div class="rv-text">'+escH(rv.review_text||'')+'</div>'+
          '<div class="rv-meta">'+new Date(rv.submitted_at).toLocaleDateString()+' · '+(vis?'<span style="color:#3fb950;">Visible</span>':'<span style="color:#f85149;">Hidden</span>')+'</div>'+
        '</div>'+
        '<div class="rv-actions">'+
          '<button class="ba '+(vis?'sus':'act')+'" onclick="toggleRev(''+rv.id+'','+(String(!vis))+',this)">'+(vis?'Hide':'Show')+'</button>'+
          '<button class="ba del" onclick="deleteRev(''+rv.id+'',this)">Delete</button>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  document.getElementById('rv').classList.add('open');
}
function closeRv(){document.getElementById('rv').classList.remove('open');}
async function toggleRev(id,visible,btn){
  btn.disabled=true;
  const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'toggle_review',reviewId:id,visible})});
  const d=await r.json();
  if(d.ok){toast(d.msg||'Done');btn.closest('.rv-row').querySelector('.rv-meta span').outerHTML=visible?'<span style="color:#3fb950;">Visible</span>':'<span style="color:#f85149;">Hidden</span>';btn.className='ba '+(visible?'sus':'act');btn.textContent=visible?'Hide':'Show';}
  else toast(d.error||'Error',true);
  btn.disabled=false;
}
async function deleteRev(id,btn){
  if(!confirm('Delete this review permanently?'))return;
  btn.disabled=true;
  const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'delete_review',reviewId:id})});
  const d=await r.json();
  if(d.ok){toast('Review deleted');btn.closest('.rv-row').remove();}
  else{toast(d.error||'Error',true);btn.disabled=false;}
}
function openBe(){document.getElementById('be').classList.add('open');}
function closeBe(){document.getElementById('be').classList.remove('open');}
async function sendBulk(){
  const subj=document.getElementById('beSubj').value.trim();
  const msg=document.getElementById('beMsg').value.trim();
  if(!subj||!msg){toast('Subject and message required',true);return;}
  if(!confirm('Send this email to ALL customers? This cannot be undone.'))return;
  const btn=document.getElementById('beBtn');
  btn.disabled=true;btn.textContent='Sending…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'bulk_email',subject:subj,message:msg})});
    const d=await r.json();
    if(d.ok){toast(d.msg||'Sent');closeBe();}
    else toast(d.error||'Error',true);
  }catch(e){toast('Network error',true);}
  btn.disabled=false;btn.textContent='Send to All →';
}
function exportCsv(){
  const rows=[['Business','Email','Handle','Status','Plan','Metrics','Scans30d','ScansAll','Leads','Joined']];
  document.querySelectorAll('#tbl tbody tr').forEach(r=>{
    const cells=[...r.querySelectorAll('td')];
    rows.push([
      r.querySelector('strong')?.textContent||'',
      r.querySelector('small')?.textContent||'',
      cells[1]?.querySelector('a')?.textContent?.trim()||'',
      cells[2]?.querySelector('.badge')?.textContent||'',
      cells[3]?.querySelector('small')?.textContent||'',
      cells[3]?.querySelector('.badge.metrics')?.textContent||'no',
      cells[5]?.childNodes[0]?.textContent?.trim()||'0',
      cells[5]?.querySelector('small')?.textContent?.replace(' all','')||'0',
      cells[6]?.textContent?.trim()||'0',
      cells[8]?.textContent?.trim()||'',
    ]);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='torrolink-customers-'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}
function switchTab(name,btn){
  document.getElementById('tab-customers').style.display=name==='customers'?'':'none';
  document.getElementById('tab-settings').style.display=name==='settings'?'':'none';
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
}
async function changePass(){
  const cur=document.getElementById('sCurrent').value;
  const np=document.getElementById('sNew').value;
  const nc=document.getElementById('sConfirm').value;
  if(!cur||!np||!nc){toast('All fields are required',true);return;}
  if(np!==nc){toast("New passwords don't match",true);return;}
  if(np.length<8){toast('Must be at least 8 characters',true);return;}
  const btn=document.querySelector('.sbtn');
  btn.disabled=true;btn.textContent='Saving…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'change_password',currentPassword:cur,newPassword:np})});
    const d=await r.json();
    if(d.ok){toast(d.msg||'Password updated ✓');['sCurrent','sNew','sConfirm'].forEach(id=>document.getElementById(id).value='');}
    else toast(d.error||'Error',true);
  }catch(e){toast('Network error',true);}
  btn.disabled=false;btn.textContent='Save New Password';
}
function openBeta(){document.getElementById('betaMdl').classList.add('open');}
function closeBeta(){document.getElementById('betaMdl').classList.remove('open');}
async function sendBeta(){
  const name=document.getElementById('btName').value.trim();
  const email=document.getElementById('btEmail').value.trim();
  const biz=document.getElementById('btBiz').value.trim();
  if(!email||!biz){toast('Email and business name required',true);return;}
  const btn=document.getElementById('btBtn');
  btn.disabled=true;btn.textContent='Creating…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+AT},body:JSON.stringify({action:'create_beta',name,email,businessName:biz})});
    const d=await r.json();
    if(d.ok){toast('Beta tester created ✓ — invite sent');closeBeta();['btName','btEmail','btBiz'].forEach(id=>document.getElementById(id).value='');setTimeout(()=>location.reload(),1500);}
    else toast(d.error||'Error',true);
  }catch(e){toast('Network error',true);}
  btn.disabled=false;btn.textContent='Create & Send Invite →';
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
</script></body></html>`
  };
}

function json(s,b){return{statusCode:s,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
