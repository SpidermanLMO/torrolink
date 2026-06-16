// ================================================
// TORROLINK — METRICS DASHBOARD v2
// GET /.netlify/functions/metrics/:handle
// WoW/MoM KPI deltas, dual-period chart, enhanced leads table
// ================================================

const { createClient } = require("@supabase/supabase-js");

// supabaseAdmin: service_role — bypasses RLS, for privileged lookups
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const SUPABASE_URL      = process.env.SUPABASE_URL      || "";
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

  // supabaseAnon: anon key — used for profile lookup since profiles are publicly readable
  // (service_role lacks GRANT on profiles — tables created via raw SQL need explicit grants)
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const pathParts = event.path.replace(/^\/+/, "").split("/");
  const handle = pathParts[1] || "";

  if (!handle) return page404();

  // Use anon key for profile lookup — RLS "Public read active profiles" allows this
  const { data: profile } = await supabaseAnon
    .from("profiles")
    .select("id, handle, business_name, customer_id")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return page404();

  // Use service_role for customer data (privileged). Defaults to false if GRANT not yet applied.
  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("email, metrics_active")
    .eq("id", profile.customer_id)
    .maybeSingle();

  const ownerEmail   = customer?.email || "";
  const businessName = profile.business_name || handle;
  const hasMetrics   = customer?.metrics_active === true;

  const html = buildDashboardHtml({
    handle, businessName, ownerEmail,
    profileId: profile.id,
    hasMetrics,
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Barlow:wght@800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <style>
    /* KPI cards */
    .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-box { background: #fff; border-radius: 14px; padding: 20px 18px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
    .stat-box .num { font-size: 2.1rem; font-weight: 800; color: #0f6b6b; line-height: 1; margin-bottom: 4px; }
    .stat-box .lbl { font-size: 0.78rem; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
    .delta-row { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
    .delta-col { text-align: center; }
    .delta-label { font-size: 0.62rem; color: #bbb; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 3px; }
    .delta-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
    .delta-up   { background: #e8f5e9; color: #2e7d32; }
    .delta-down { background: #fce8e6; color: #c62828; }
    .delta-flat { background: #f5f5f5; color: #aaa; }

    /* Chart */
    .chart-wrap { position: relative; height: 230px; }
    .chart-legend { display: flex; gap: 18px; margin-top: 10px; }
    .leg-item { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #888; }
    .leg-dot  { width: 10px; height: 10px; border-radius: 3px; }

    /* Leads table */
    .leads-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
    .leads-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e8ecf0; color: #555; font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .leads-table td { padding: 11px 12px; border-bottom: 1px solid #f2f2f2; color: #333; vertical-align: top; }
    .leads-table tr:last-child td { border-bottom: none; }
    .leads-table tr:hover td { background: #fafcfc; }
    .badge-hot  { display: inline-block; background: #fff3e0; color: #e65100; font-size: 0.68rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; margin-left: 5px; vertical-align: middle; }
    .badge-new  { display: inline-block; background: #e3f2fd; color: #0d47a1; font-size: 0.68rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; margin-left: 5px; vertical-align: middle; }

    /* Breakdown bars */
    .breakdown-row { margin-bottom: 12px; }
    .breakdown-meta { display: flex; justify-content: space-between; font-size: 0.83rem; margin-bottom: 4px; }
    .breakdown-bar-bg { background: #f0f0f0; border-radius: 4px; height: 6px; }
    .breakdown-bar-fill { background: #0f6b6b; height: 6px; border-radius: 4px; }

    /* Misc */
    .no-data { text-align: center; padding: 40px 0; color: #bbb; font-size: 0.9rem; }
    .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .upsell-box { background: linear-gradient(135deg, #0a4d4d 0%, #0f6b6b 100%); color: #fff; border-radius: 14px; padding: 40px; text-align: center; }
    .upsell-box h2 { font-size: 1.5rem; margin-bottom: 10px; }
    .upsell-box p  { opacity: 0.85; margin-bottom: 24px; line-height: 1.6; }
    .upsell-btn { display: inline-block; background: #f4752b; color: #fff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 1rem; }

    @media (max-width: 560px) {
      .stat-row { grid-template-columns: 1fr 1fr; }
      .two-col  { grid-template-columns: 1fr !important; }
    }
  </style>
</head>
<body class="tl-page">

  <div class="tl-topbar">
    <a href="/" class="logo" style="font-family:Barlow,sans-serif;font-weight:800;font-size:1rem;letter-spacing:1px;">TORROLINK</a>
    <span style="color:rgba(255,255,255,0.5);font-size:0.82rem;margin-left:6px;">/ Metrics</span>
    <span style="color:rgba(255,255,255,0.5);font-size:0.82rem;margin-left:auto;">${escHtml(businessName)}</span>
    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.15);border:none;color:#fff;font-weight:600;font-size:0.8rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:10px;">Sign out</button>
  </div>

  <div class="tl-content">

    <!-- LOGIN -->
    <div id="loginScreen" class="tl-card" style="max-width:420px;margin:60px auto;display:none;">
      <h2 style="margin-bottom:6px;">Sign in to view metrics</h2>
      <p style="font-size:0.9rem;color:#666;margin-bottom:24px;">Use the email address on your Torrolink account.</p>
      <div id="loginMsg"></div>
      <div class="tl-field">
        <label for="loginEmail">Email address</label>
        <input type="email" id="loginEmail" placeholder="you@yourbusiness.com" autocomplete="email" />
      </div>
      <button class="tl-btn tl-btn-full" onclick="sendMagicLink()">Send Sign-In Link</button>
    </div>

    <!-- UPSELL -->
    <div id="upsellScreen" style="display:none;margin-top:40px;">
      <div class="upsell-box">
        <h2>Unlock Metrics + Leads</h2>
        <p>Your account doesn't have Metrics + Leads enabled yet. Add it for $10.28/month and start seeing exactly who's scanning your QR — and turning them into customers.</p>
        <a href="/#pricing" class="upsell-btn">Add Metrics + Leads →</a>
      </div>
    </div>

    <!-- DASHBOARD -->
    <div id="dashboardScreen" style="display:none;">

      <!-- KPI CARDS -->
      <div class="stat-row">
        <div class="stat-box">
          <div class="num" id="statTotal">—</div>
          <div class="lbl">Total scans</div>
          <div class="delta-row">
            <div class="delta-col">
              <div class="delta-label">WoW</div>
              <span id="deltaScansWoW" class="delta-badge delta-flat">—</span>
            </div>
            <div class="delta-col">
              <div class="delta-label">MoM</div>
              <span id="deltaScansМоМ" class="delta-badge delta-flat">—</span>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="num" id="statLeads">—</div>
          <div class="lbl">Leads captured</div>
          <div class="delta-row">
            <div class="delta-col">
              <div class="delta-label">WoW</div>
              <span id="deltaLeadsWoW" class="delta-badge delta-flat">—</span>
            </div>
            <div class="delta-col">
              <div class="delta-label">MoM</div>
              <span id="deltaLeadsMoM" class="delta-badge delta-flat">—</span>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="num" id="statConv">—</div>
          <div class="lbl">Conversion rate</div>
          <div class="delta-row">
            <div class="delta-col">
              <div class="delta-label">MoM</div>
              <span id="deltaConvMoM" class="delta-badge delta-flat">—</span>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <div class="num" id="statAvgDaily">—</div>
          <div class="lbl">Avg daily (30d)</div>
          <div class="delta-row">
            <div class="delta-col">
              <div class="delta-label">MoM</div>
              <span id="deltaAvgMoM" class="delta-badge delta-flat">—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CHART -->
      <div class="tl-card" style="margin-bottom:22px;">
        <div class="section-head">
          <h2 style="margin:0;">Scans — last 30 days</h2>
        </div>
        <div class="chart-wrap">
          <canvas id="scanChart"></canvas>
        </div>
        <div class="chart-legend" style="margin-top:12px;">
          <div class="leg-item"><div class="leg-dot" style="background:#0a4d4d;"></div>This period</div>
          <div class="leg-item"><div class="leg-dot" style="background:#f4752b;border-radius:50%;width:10px;height:2px;margin-top:4px;"></div><span style="border-bottom:2px solid #f4752b;padding-bottom:1px;">Prior period</span></div>
        </div>
      </div>

      <!-- BREAKDOWNS -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px;" class="two-col">
        <div class="tl-card">
          <h2 style="margin-bottom:16px;">Traffic by device</h2>
          <div id="deviceBreakdown" class="no-data">Loading…</div>
        </div>
        <div class="tl-card">
          <h2 style="margin-bottom:16px;">Traffic by country</h2>
          <div id="countryBreakdown" class="no-data">Loading…</div>
        </div>
      </div>

      <!-- LEADS TABLE -->
      <div class="tl-card">
        <div class="section-head">
          <h2 style="margin:0;">Recent leads</h2>
          <button class="tl-btn tl-btn-teal" style="padding:8px 18px;font-size:0.83rem;" onclick="exportLeads()">Export CSV</button>
        </div>
        <div id="leadsContainer"><div class="no-data">Loading leads…</div></div>
      </div>

    </div><!-- /dashboardScreen -->
  </div><!-- /tl-content -->

  <script>
    const _supabase  = window.supabase.createClient('${supabaseUrl}', '${supabaseAnonKey}');
    const PROFILE_ID = '${escHtml(profileId)}';
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
      _supabase.auth.onAuthStateChange(async (evt, session) => {
        if (evt === 'SIGNED_IN' && session) await onSignedIn(session);
        else if (evt === 'SIGNED_OUT') location.reload();
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
      document.getElementById('loginScreen').style.display  = 'none';
      document.getElementById('signOutBtn').style.display   = 'inline-block';
      if (session.user.email !== OWNER_EMAIL) {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('loginMsg').innerHTML = '<div class="tl-msg error">This dashboard belongs to a different account.</div>';
        await _supabase.auth.signOut();
        return;
      }
      if (!HAS_METRICS) { document.getElementById('upsellScreen').style.display = 'block'; return; }
      document.getElementById('dashboardScreen').style.display = 'block';
      await loadDashboard();
    }

    // ── Helpers ───────────────────────────────────
    function ts(daysAgo) {
      return new Date(Date.now() - daysAgo * 86400000).toISOString();
    }

    function pctChange(curr, prev) {
      if (!prev) return curr > 0 ? 100 : 0;
      return Math.round((curr - prev) / prev * 100);
    }

    function applyDelta(elId, pct) {
      const el = document.getElementById(elId);
      if (!el) return;
      if (pct > 0)      { el.className = 'delta-badge delta-up';   el.textContent = '▲ ' + pct + '%'; }
      else if (pct < 0) { el.className = 'delta-badge delta-down'; el.textContent = '▼ ' + Math.abs(pct) + '%'; }
      else              { el.className = 'delta-badge delta-flat'; el.textContent = '— 0%'; }
    }

    function applyDeltaPt(elId, curr, prev) {
      const el = document.getElementById(elId);
      if (!el) return;
      const diff = Math.round((curr - prev) * 10) / 10;
      if (diff > 0)      { el.className = 'delta-badge delta-up';   el.textContent = '▲ +' + diff + 'pt'; }
      else if (diff < 0) { el.className = 'delta-badge delta-down'; el.textContent = '▼ ' + diff + 'pt'; }
      else               { el.className = 'delta-badge delta-flat'; el.textContent = '— 0pt'; }
    }

    function dayBuckets(scans, startDaysAgo, endDaysAgo) {
      const counts = {};
      for (let i = startDaysAgo - 1; i >= endDaysAgo; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        counts[d] = 0;
      }
      scans.forEach(s => {
        const d = s.scanned_at.split('T')[0];
        if (counts[d] !== undefined) counts[d]++;
      });
      return Object.values(counts);
    }

    // ── Main data load ────────────────────────────
    async function loadDashboard() {
      // Fetch 60 days of scans for period comparisons
      const [scanRes, totalRes, leadRes] = await Promise.all([
        _supabase.from('scan_events')
          .select('scanned_at, device_type, country')
          .eq('profile_id', PROFILE_ID)
          .gte('scanned_at', ts(60))
          .order('scanned_at', { ascending: false }),
        _supabase.from('scan_events')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', PROFILE_ID),
        _supabase.from('leads')
          .select('*')
          .eq('profile_id', PROFILE_ID)
          .order('submitted_at', { ascending: false }),
      ]);

      const scans60    = scanRes.data  || [];
      const totalScans = totalRes.count || scans60.length;
      const allLeads   = leadRes.data  || [];
      _allLeads = allLeads;

      // ── Scan period buckets ───────────────────
      const thisWeekScans  = scans60.filter(s => s.scanned_at >= ts(7));
      const prevWeekScans  = scans60.filter(s => s.scanned_at >= ts(14) && s.scanned_at < ts(7));
      const thisMonthScans = scans60.filter(s => s.scanned_at >= ts(30));
      const prevMonthScans = scans60.filter(s => s.scanned_at >= ts(60) && s.scanned_at < ts(30));

      // ── Lead period buckets ───────────────────
      const leadTs = (l) => l.submitted_at || '';
      const thisWeekLeads  = allLeads.filter(l => leadTs(l) >= ts(7));
      const prevWeekLeads  = allLeads.filter(l => leadTs(l) >= ts(14) && leadTs(l) < ts(7));
      const thisMonthLeads = allLeads.filter(l => leadTs(l) >= ts(30));
      const prevMonthLeads = allLeads.filter(l => leadTs(l) >= ts(60) && leadTs(l) < ts(30));

      // ── Conversion rates ──────────────────────
      const convNow  = thisMonthScans.length ? (thisMonthLeads.length / thisMonthScans.length * 100) : 0;
      const convPrev = prevMonthScans.length ? (prevMonthLeads.length / prevMonthScans.length * 100) : 0;

      // ── Avg daily ─────────────────────────────
      const avgNow  = Math.round(thisMonthScans.length / 30 * 10) / 10;
      const avgPrev = Math.round(prevMonthScans.length / 30 * 10) / 10;

      // ── Update KPI cards ─────────────────────
      document.getElementById('statTotal').textContent    = totalScans.toLocaleString();
      document.getElementById('statLeads').textContent    = allLeads.length;
      document.getElementById('statConv').textContent     = convNow.toFixed(1) + '%';
      document.getElementById('statAvgDaily').textContent = avgNow.toFixed(1);

      // Scans WoW = thisWeek vs prevWeek; MoM = thisMonth vs prevMonth
      applyDelta('deltaScansWoW', pctChange(thisWeekScans.length, prevWeekScans.length));
      applyDelta('deltaScansМоМ', pctChange(thisMonthScans.length, prevMonthScans.length));
      applyDelta('deltaLeadsWoW', pctChange(thisWeekLeads.length, prevWeekLeads.length));
      applyDelta('deltaLeadsMoM', pctChange(thisMonthLeads.length, prevMonthLeads.length));
      applyDeltaPt('deltaConvMoM', convNow, convPrev);
      applyDelta('deltaAvgMoM', pctChange(avgNow, avgPrev));

      // ── Chart ─────────────────────────────────
      const labels = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        labels.push((d.getMonth()+1) + '/' + d.getDate());
      }
      const currentData = dayBuckets(thisMonthScans, 30, 0);
      const priorData   = dayBuckets(prevMonthScans, 60, 30);

      new Chart(document.getElementById('scanChart'), {
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Prior 30 days',
              data: priorData,
              borderColor: '#f4752b',
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              pointRadius: 0,
              tension: 0.35,
              order: 1,
            },
            {
              type: 'bar',
              label: 'This period',
              data: currentData,
              backgroundColor: '#0a4d4d',
              borderRadius: 4,
              order: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { color: '#f5f5f5' } },
            x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
          },
        },
      });

      // ── Device + country breakdowns ───────────
      const deviceCounts  = {};
      const countryCounts = {};
      scans60.forEach(s => {
        const d = s.device_type || 'Unknown'; deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        const c = s.country     || 'Unknown'; countryCounts[c] = (countryCounts[c] || 0) + 1;
      });
      renderBreakdown('deviceBreakdown',  deviceCounts,  scans60.length);
      renderBreakdown('countryBreakdown', countryCounts, scans60.length);

      // ── Leads table ───────────────────────────
      renderLeads(allLeads);
    }

    function renderBreakdown(elId, counts, total) {
      const el = document.getElementById(elId);
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (!entries.length) { el.innerHTML = '<div class="no-data">No data yet</div>'; return; }
      el.innerHTML = entries.map(([label, count]) => {
        const pct = total ? Math.round(count / total * 100) : 0;
        return '<div class="breakdown-row">' +
          '<div class="breakdown-meta">' +
            '<span style="font-weight:600;text-transform:capitalize;">' + escHtml(label) + '</span>' +
            '<span style="color:#999;">' + count + ' (' + pct + '%)</span>' +
          '</div>' +
          '<div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width:' + pct + '%;"></div></div>' +
        '</div>';
      }).join('');
    }

    function renderLeads(leads) {
      const el = document.getElementById('leadsContainer');
      if (!leads.length) {
        el.innerHTML = '<div class="no-data">No leads yet. Make sure your lead form is enabled on your profile page.</div>';
        return;
      }
      const now = Date.now();
      const rows = leads.map(l => {
        const age = l.submitted_at ? (now - new Date(l.submitted_at).getTime()) / 3600000 : 9999;
        const badge = age < 24  ? '<span class="badge-hot">Hot</span>' :
                      age < 72  ? '<span class="badge-new">New</span>' : '';
        const phone = l.phone ? '<div>' + escHtml(l.phone) + '</div>' : '';
        const email = l.email ? '<div style="color:#888;font-size:0.8rem;">' + escHtml(l.email) + '</div>' : '';
        const msg   = escHtml(l.comment || l.message || '—');
        return '<tr>' +
          '<td style="white-space:nowrap;color:#888;font-size:0.82rem;">' + fmtRelDate(l.submitted_at) + '</td>' +
          '<td><strong>' + escHtml(l.name || '—') + '</strong>' + badge + '</td>' +
          '<td>' + phone + email + '</td>' +
          '<td style="max-width:220px;font-size:0.85rem;color:#555;">' + msg + '</td>' +
        '</tr>';
      }).join('');
      el.innerHTML =
        '<table class="leads-table"><thead><tr>' +
          '<th>When</th><th>Name</th><th>Contact</th><th>Message</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';
    }

    function exportLeads() {
      if (!_allLeads.length) { alert('No leads to export yet.'); return; }
      const headers = ['Date', 'Name', 'Phone', 'Email', 'Message'];
      const rows = _allLeads.map(l => [
        fmtRelDate(l.submitted_at),
        l.name    || '',
        l.phone   || '',
        l.email   || '',
        l.comment || l.message || '',
      ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
      const csv  = [headers.join(','), ...rows].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'torrolink-leads.csv'; a.click();
      URL.revokeObjectURL(url);
    }

    function fmtRelDate(iso) {
      if (!iso) return '—';
      const d    = new Date(iso);
      const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      if (diff < 7)   return diff + ' days ago';
      return (d.getMonth()+1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2);
    }

    function escHtml(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
