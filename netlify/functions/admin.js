// ================================================
// TORROLINK — ADMIN DASHBOARD
// GET /admin  → password-protected dashboard
// Shows all customers, revenue, orders, active subscriptions
// Protected by ADMIN_PASSWORD env var
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

exports.handler = async (event) => {
  // ── Auth check ───────────────────────────────
  // Simple Basic Auth — browser will prompt for username/password
  const authHeader = event.headers["authorization"] || "";
  const encoded = authHeader.replace(/^Basic\s+/i, "");
  let authed = false;
  if (encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [, pass] = decoded.split(":");
      authed = pass === ADMIN_PASSWORD;
    } catch { /* ignore */ }
  }

  if (!authed) {
    return {
      statusCode: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Torrolink Admin"',
        "Content-Type": "text/plain",
      },
      body: "Unauthorized",
    };
  }

  // ── Fetch data ───────────────────────────────
  const [customersRes, profilesRes, scansRes, leadsRes] = await Promise.all([
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("*, customers(email)").order("created_at", { ascending: false }),
    supabaseAdmin.from("scan_events").select("id, scanned_at, profile_id"),
    supabaseAdmin.from("leads").select("id, submitted_at, profile_id"),
  ]);

  const customers = customersRes.data || [];
  const profiles  = profilesRes.data  || [];
  const scans     = scansRes.data     || [];
  const leads     = leadsRes.data     || [];

  // ── Revenue estimates ────────────────────────
  const PRICES = {
    "qr-code": 28.33,
    "branding": 9.28,
    "custom-branding": 18.28,
    "qr-code-branding": 37.61,
    "qr-code-custom-branding": 46.61,
    "metrics": 10.28,
  };

  const metricsCount = customers.filter(c => c.metrics_active).length;
  const qrCount      = profiles.filter(p => p.is_active).length;

  // Build profile index for lookup
  const profileMap = {};
  profiles.forEach(p => { profileMap[p.id] = p; });

  // Scans per profile (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentScans = scans.filter(s => new Date(s.scanned_at) > thirtyDaysAgo);

  const scansByProfile = {};
  recentScans.forEach(s => {
    scansByProfile[s.profile_id] = (scansByProfile[s.profile_id] || 0) + 1;
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: renderDashboard({ customers, profiles, scans, leads, metricsCount, qrCount, scansByProfile }),
  };
};

// ── HTML ──────────────────────────────────────────────────────────────────────

function renderDashboard({ customers, profiles, scans, leads, metricsCount, qrCount, scansByProfile }) {
  const totalScans = scans.length;
  const totalLeads = leads.length;

  const profileRows = profiles.map(p => {
    const scanCount  = (scansByProfile[p.id] || 0);
    const isMetrics  = p.has_metrics ? "✅" : "—";
    const isBranding = p.has_branding ? "✅" : "—";
    const status     = p.is_active ? '<span class="badge active">Active</span>' : '<span class="badge inactive">Inactive</span>';
    return `<tr>
      <td><strong>${esc(p.business_name || "—")}</strong><br/><small style="color:#888;">${esc(p.customers?.email || "")}</small></td>
      <td><a href="https://torrolink.com/p/${esc(p.handle)}" target="_blank" style="color:#0f6b6b;">/${esc(p.handle)}</a></td>
      <td>${status}</td>
      <td>${isMetrics}</td>
      <td>${isBranding}</td>
      <td>${scanCount}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
    </tr>`;
  }).join("");

  const customerRows = customers.map(c => {
    const plan = c.metrics_active ? '<span class="badge active">Metrics</span>' : '<span class="badge free">Free</span>';
    return `<tr>
      <td>${esc(c.name || "—")}</td>
      <td>${esc(c.email)}</td>
      <td>${plan}</td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin — Torrolink</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:#f5f7fa;color:#1a1a2e;}
    .topbar{background:linear-gradient(135deg,#0f6b6b,#0a4d4d);padding:16px 32px;display:flex;align-items:center;gap:16px;}
    .topbar .logo{font-size:1.4rem;font-weight:800;color:#fff;}
    .topbar .badge-admin{background:rgba(255,255,255,0.2);color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.04em;}
    .content{max-width:1200px;margin:0 auto;padding:32px 24px;}
    h2{font-size:1.2rem;font-weight:700;margin-bottom:16px;color:#1a1a2e;}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px;}
    .stat-card{background:#fff;border-radius:14px;padding:20px 24px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
    .stat-card .val{font-size:2rem;font-weight:800;color:#0f6b6b;line-height:1;}
    .stat-card .lbl{font-size:0.78rem;font-weight:600;color:#888;margin-top:6px;text-transform:uppercase;letter-spacing:.06em;}
    .card{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:28px;overflow:hidden;}
    .card-header{padding:18px 24px;border-bottom:1px solid #f0f0f5;font-weight:700;font-size:0.95rem;}
    table{width:100%;border-collapse:collapse;}
    th{text-align:left;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;padding:10px 24px;border-bottom:1px solid #f0f0f5;}
    td{padding:12px 24px;font-size:0.88rem;border-bottom:1px solid #f8f8fb;vertical-align:middle;}
    tr:last-child td{border-bottom:none;}
    tr:hover td{background:#fafbfc;}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;}
    .badge.active{background:#edf8f8;color:#0a5555;}
    .badge.inactive{background:#fef2f2;color:#c0392b;}
    .badge.free{background:#f5f5f5;color:#888;}
    @media(max-width:680px){
      th:nth-child(n+4),td:nth-child(n+4){display:none;}
      .content{padding:20px 12px;}
    }
  </style>
</head>
<body>
  <div class="topbar">
    <span class="logo">Torrolink</span>
    <span class="badge-admin">ADMIN</span>
  </div>

  <div class="content">

    <div class="stats">
      <div class="stat-card"><div class="val">${customers.length}</div><div class="lbl">Total customers</div></div>
      <div class="stat-card"><div class="val">${qrCount}</div><div class="lbl">Active QR codes</div></div>
      <div class="stat-card"><div class="val">${metricsCount}</div><div class="lbl">Metrics subscribers</div></div>
      <div class="stat-card"><div class="val">${totalScans.toLocaleString()}</div><div class="lbl">Total scans</div></div>
      <div class="stat-card"><div class="val">${totalLeads.toLocaleString()}</div><div class="lbl">Total leads</div></div>
      <div class="stat-card"><div class="val">$${(metricsCount * 10.28).toFixed(0)}</div><div class="lbl">MRR (metrics)</div></div>
    </div>

    <div class="card">
      <div class="card-header">📋 All Profiles (${profiles.length})</div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Business / Email</th>
              <th>Handle</th>
              <th>Status</th>
              <th>Metrics</th>
              <th>Branding</th>
              <th>Scans (30d)</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>${profileRows || '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:40px;">No profiles yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">👥 All Customers (${customers.length})</div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>${customerRows || '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:40px;">No customers yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>

  </div>
</body>
</html>`;
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
