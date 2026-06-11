// ================================================
// TORROLINK — METRICS DASHBOARD
// GET /metrics/:handle
// Shows scan analytics + lead list for subscribers.
// Auth: Supabase magic-link (same flow as portal).
// Only accessible if profile.has_metrics = true.
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const SUPABASE_URL      = process.env.SUPABASE_URL      || "";
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

  // Extract handle from path: /metrics/:handle
  const pathParts = event.path.replace(/^\/+/, "").split("/");
  const handle = pathParts[1] || "";

  if (!handle) {
    return page404();
  }

  // Look up the profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, handle, business_name, has_metrics, customer_id, customers(email)")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return page404();

  const ownerEmail    = profile.customers?.email || "";
  const businessName  = profile.business_name || handle;

  // Serve the dashboard HTML — auth is handled client-side
  const html = buildDashboardHtml({
    handle,
    businessName,
    ownerEmail,
    profileId: profile.id,
    hasMetrics: profile.has_metrics,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};

function buildDashboardHtml({ handle, businessName, ownerEmail, profileId, hasMetrics, supabaseUrl, supabaseAnonKey }) {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Metrics — ${escHtml(businessName)} — Torrolink</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <style>
    .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-box { background: #fff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .stat-box .num { font-size: 2rem; font-weight: 800; color: #0f6b6b; line-height: 1; margin-bottom: 6px; }
    .stat-box .lbl { font-size: 0.8rem; color: #888; font-weight: 500; }
    .leads-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .leads-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e2e6ea; color: #444; font-weight: 600; }
    .leads-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #333; vertical-align: top; }
    .leads-table tr:hover td { background: #fafafa; }
    .no-data { text-align: center; padding: 40px 0; color: #aaa; font-size: 0.95rem; }
    .chart-wrap { position: relative; height: 220px; }
    .upsell-box { background: linear-gradient(135deg, #0a4d4d 0%, #0f6b6b 100%); color: #fff; border-radius: 14px; padding: 36px; text-align: center; }
    .upsell-box h2 { font-size: 1.4rem; margin-bottom: 10px; }
    .upsell-box p { opacity: 0.85; margin-bottom: 24px; line-height: 1.6; }
    .upsell-btn { display: inline-block; background: #f4752b; color: #fff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 1rem; }
    @media (max-width: 480px) { .stat-row { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body class="tl-page">

  <div class="tl-topbar">
    <a href="/" class="logo">Torrolink</a>
    <span style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-left:8px;">/ Metrics</span>
    <span style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-left:auto;">
      ${escHtml(businessName)}
    </span>
    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.15);border:none;color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:8px;">Sign out</button>
  </div>

  <div class="tl-content">

    <!-- LOGIN SCREEN -->
    <div id="loginScreen" class="tl-card" style="max-width:420px;margin:60px auto;">
      <h2 style="margin-bottom:6px;">Sign in to view metrics</h2>
      <p style="font-size:0.9rem;color:#666;margin-bottom:24px;">Use the email address associated with your Torrolink account.</p>
      <div id="loginMsg"></div>
      <div class="tl-field">
        <label for="loginEmail">Email address</label>
        <input type="email" id="loginEmail" placeholder="you@yourbusiness.com" autocomplete="email" />
      </div>
      <button class="tl-btn tl-btn-full" onclick="sendMagicLink()">Send Sign-In Link</button>
    </div>

    <!-- NO METRICS UPSELL -->
    <div id="upsellScreen" style="display:none; margin-top:40px;">
      <div class="upsell-box">
        <h2>Unlock Metrics + Leads</h2>
        <p>Your account doesn't have Metrics + Leads enabled yet. Add it for $10.28/month and start seeing exactly who's scanning your QR and turning them into customers.</p>
        <a href="/#pricing" class="upsell-btn">Add Metrics + Leads →</a>
      </div>
    </div>

    <!-- DASHBOARD -->
    <div id="dashboardScreen" style="display:none;">

      <div class="stat-row">
        <div class="stat-box"><div class="num" id="statTotal">—</div><div class="lbl">Total scans</div></div>
        <div class="stat-box"><div class="num" id="statToday">—</div><div class="lbl">Scans today</div></div>
        <div class="stat-box"><div class="num" id="statWeek">—</div><div class="lbl">This week</div></div>
        <div class="stat-box"><div class="num" id="statLeads">—</div><div class="lbl">Leads captured</div></div>
      </div>

      <!-- SCAN CHART -->
      <div class="tl-card" style="margin-bottom:24px;">
        <h2 style="margin-bottom:20px;">Scans — last 30 days</h2>
        <div class="chart-wrap">
          <canvas id="scanChart"></canvas>
        </div>
      </div>

      <!-- DEVICE & COUNTRY BREAKDOWN -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div class="tl-card">
          <h2 style="margin-bottom:16px;">By device</h2>
          <div id="deviceBreakdown" class="no-data">Loading…</div>
        </div>
        <div class="tl-card">
          <h2 style="margin-bottom:16px;">By country</h2>
          <div id="countryBreakdown" class="no-data">Loading…</div>
        </div>
      </div>

      <!-- LEADS TABLE -->
      <div class="tl-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;">Leads</h2>
          <button class="tl-btn tl-btn-teal" style="padding:8px 18px;font-size:0.85rem;" onclick="exportLeads()">Export CSV</button>
        </div>
        <div id="leadsContainer">
          <div class="no-data">Loading leads…</div>
        </div>
      </div>

    </div>
  </div>

  <script>
    const _supabase = window.supabase.createClient('${supabaseUrl}', '${supabaseAnonKey}');
    const PROFILE_ID  = '${escHtml(profileId)}';
    const HAS_METRICS = ${hasMetrics ? 'true' : 'false'};
    const OWNER_EMAIL = '${escHtml(ownerEmail)}';
    let _allLeads = [];

    // ── Boot ──────────────────────────────────────
    (async () => {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        await onSignedIn(session);
      } else {
        document.getElementById('loginScreen').style.display = 'block';
      }
      _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) await onSignedIn(session);
        else if (event === 'SIGNED_OUT') location.reload();
      });
    })();

    async function sendMagicLink() {
      const email = document.getElementById('loginEmail').value.trim();
      const msgEl = document.getElementById('loginMsg');
      if (!email) { msgEl.innerHTML = '<div class="tl-msg error">Please enter your email.</div>'; return; }
      msgEl.innerHTML = '<div class="tl-msg">Sending…</div>';
      const { error } = await _supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      });
      if (error) msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      else msgEl.innerHTML = '<div class="tl-msg success">Check your email — sign-in link sent!</div>';
    }

    async function signOut() { await _supabase.auth.signOut(); }

    async function onSignedIn(session) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('signOutBtn').style.display = 'inline-block';

      // Ownership check
      if (session.user.email !== OWNER_EMAIL) {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('loginMsg').innerHTML =
          '<div class="tl-msg error">This dashboard belongs to a different account.</div>';
        await _supabase.auth.signOut();
        return;
      }

      if (!HAS_METRICS) {
        document.getElementById('upsellScreen').style.display = 'block';
        return;
      }

      document.getElementById('dashboardScreen').style.display = 'block';
      await loadDashboard();
    }

    async function loadDashboard() {
      const now   = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo  = new Date(now - 7  * 86400000).toISOString();
      const monthAgo = new Date(now - 30 * 86400000).toISOString();

      // Fetch all scan events
      const { data: scans } = await _supabase
        .from('scan_events')
        .select('scanned_at, device_type, country')
        .eq('profile_id', PROFILE_ID)
        .order('scanned_at', { ascending: false });

      const allScans = scans || [];

      // Stats
      const todayScans = allScans.filter(s => s.scanned_at.startsWith(today));
      const weekScans  = allScans.filter(s => s.scanned_at >= weekAgo);
      document.getElementById('statTotal').textContent = allScans.length;
      document.getElementById('statToday').textContent = todayScans.length;
      document.getElementById('statWeek').textContent  = weekScans.length;

      // Chart — last 30 days bucketed by day
      const recent30 = allScans.filter(s => s.scanned_at >= monthAgo);
      const dayCounts = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000).toISOString().split('T')[0];
        dayCounts[d] = 0;
      }
      recent30.forEach(s => {
        const d = s.scanned_at.split('T')[0];
        if (dayCounts[d] !== undefined) dayCounts[d]++;
      });
      const labels = Object.keys(dayCounts).map(d => {
        const [, m, day] = d.split('-');
        return m + '/' + day;
      });
      const chartData = Object.values(dayCounts);

      new Chart(document.getElementById('scanChart'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Scans',
            data: chartData,
            backgroundColor: '#0a4d4d',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 11 } } },
          },
        },
      });

      // Device breakdown
      const deviceCounts = {};
      allScans.forEach(s => { const d = s.device_type || 'unknown'; deviceCounts[d] = (deviceCounts[d] || 0) + 1; });
      renderBreakdown('deviceBreakdown', deviceCounts, allScans.length);

      // Country breakdown
      const countryCounts = {};
      allScans.forEach(s => { const c = s.country || 'Unknown'; countryCounts[c] = (countryCounts[c] || 0) + 1; });
      renderBreakdown('countryBreakdown', countryCounts, allScans.length);

      // Leads
      const { data: leads } = await _supabase
        .from('leads')
        .select('*')
        .eq('profile_id', PROFILE_ID)
        .order('submitted_at', { ascending: false });

      _allLeads = leads || [];
      document.getElementById('statLeads').textContent = _allLeads.length;
      renderLeads(_allLeads);
    }

    function renderBreakdown(elId, counts, total) {
      const el = document.getElementById(elId);
      if (!Object.keys(counts).length) { el.innerHTML = '<div class="no-data">No data yet</div>'; return; }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      el.innerHTML = sorted.map(([label, count]) => {
        const pct = total ? Math.round(count / total * 100) : 0;
        return '<div style="margin-bottom:10px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">' +
            '<span style="font-weight:600;text-transform:capitalize;">' + escHtml(label) + '</span>' +
            '<span style="color:#888;">' + count + ' (' + pct + '%)</span>' +
          '</div>' +
          '<div style="background:#f0f0f0;border-radius:4px;height:6px;">' +
            '<div style="background:#0f6b6b;height:6px;border-radius:4px;width:' + pct + '%;"></div>' +
          '</div></div>';
      }).join('');
    }

    function renderLeads(leads) {
      const el = document.getElementById('leadsContainer');
      if (!leads.length) { el.innerHTML = '<div class="no-data">No leads captured yet. Add a lead form to your profile to start collecting contacts.</div>'; return; }
      el.innerHTML = '<table class="leads-table"><thead><tr>' +
        '<th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Interests</th><th>Comment</th>' +
        '</tr></thead><tbody>' +
        leads.map(l => '<tr>' +
          '<td style="white-space:nowrap;color:#888;">' + fmtDate(l.submitted_at) + '</td>' +
          '<td>' + escHtml(l.name || '—') + '</td>' +
          '<td>' + escHtml(l.phone || '—') + '</td>' +
          '<td>' + escHtml(l.email || '—') + '</td>' +
          '<td>' + escHtml((l.interests || []).join(', ') || '—') + '</td>' +
          '<td>' + escHtml(l.comment || '—') + '</td>' +
          '</tr>').join('') +
        '</tbody></table>';
    }

    function exportLeads() {
      if (!_allLeads.length) { alert('No leads to export.'); return; }
      const headers = ['Date', 'Name', 'Phone', 'Email', 'Interests', 'Comment'];
      const rows = _allLeads.map(l => [
        fmtDate(l.submitted_at),
        l.name  || '',
        l.phone || '',
        l.email || '',
        (l.interests || []).join('; '),
        l.comment || '',
      ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
      const csv = [headers.join(','), ...rows].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'torrolink-leads.csv'; a.click();
      URL.revokeObjectURL(url);
    }

    function fmtDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear().toString().slice(2);
    }
    function escHtml(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  </script>
</body>
</html>`;
}

function page404() {
  return {
    statusCode: 404,
    headers: { "Content-Type": "text/html" },
    body: "<h2>Dashboard not found.</h2>",
  };
}

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
