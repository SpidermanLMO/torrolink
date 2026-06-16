// ================================================
// TORROLINK — ADMIN DASHBOARD
// GET  /admin  → full dashboard
// POST /admin  → action handler (AJAX)
// Protected by ADMIN_PASSWORD env var
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }       = require("resend");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend      = new Resend(process.env.RESEND_API_KEY);
const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";
const ADMIN_PASS  = process.env.ADMIN_PASSWORD || "changeme";

function isAuthed(event) {
  const h = (event.headers["authorization"] || "").replace(/^Basic\s+/i, "");
  if (!h) return false;
  try {
    const [, pass] = Buffer.from(h, "base64").toString("utf-8").split(":");
    return pass === ADMIN_PASS;
  } catch { return false; }
}
function unauthed() {
  return { statusCode: 401, headers: { "WWW-Authenticate": 'Basic realm="Torrolink Admin"', "Content-Type": "text/plain" }, body: "Unauthorized" };
}

exports.handler = async (event) => {
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
      default: return json(400, { error: "Unknown action" });
    }
  } catch (err) {
    console.error("Admin action error:", err);
    return json(500, { error: err.message });
  }
}

async function handleDashboard() {
  const [custRes, profRes, scanRes, leadRes] = await Promise.all([
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, handle, business_name, is_active, suspended, has_metrics, has_branding, branding_tier, created_at, customer_id, code").order("created_at", { ascending: false }),
    supabaseAdmin.from("scan_events").select("id, scanned_at, profile_id"),
    supabaseAdmin.from("leads").select("id, submitted_at, profile_id"),
  ]);
  const customers = custRes.data || [];
  const profiles  = profRes.data  || [];
  const scans     = scanRes.data  || [];
  const leads     = leadRes.data  || [];

  const custById = {};
  customers.forEach(c => { custById[c.id] = c; });

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const scansByProfile = {}, recentByProfile = {}, leadsByProfile = {};
  scans.forEach(s => {
    scansByProfile[s.profile_id] = (scansByProfile[s.profile_id] || 0) + 1;
    if (new Date(s.scanned_at) > cutoff) recentByProfile[s.profile_id] = (recentByProfile[s.profile_id] || 0) + 1;
  });
  leads.forEach(l => { leadsByProfile[l.profile_id] = (leadsByProfile[l.profile_id] || 0) + 1; });

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
    return `<tr data-profile-id="${esc(p.id)}" data-customer-id="${esc(p.customer_id||"")}" data-email="${esc(cust.email||"")}" data-name="${esc(cust.name||"")}">
      <td><strong>${esc(p.business_name||"—")}</strong><br><small style="color:#888;">${esc(cust.email||"—")}</small>${freeLabel}</td>
      <td><a href="${SITE}/p/${esc(p.handle)}" target="_blank" class="plink">/${esc(p.handle)}</a></td>
      <td>${statusBadge}</td>
      <td>${metricsBadge}</td>
      <td>${p.has_branding ? `<span class="badge brand">${esc(p.branding_tier||"std")}</span>` : "—"}</td>
      <td class="num">${scans30}<br><small style="color:#555;">${scansAll} all</small></td>
      <td class="num">${lcount}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
      <td><div class="ag">
        ${isSusp ? `<button class="ba act" onclick="doAction('activate',this)">✅ Activate</button>` : `<button class="ba sus" onclick="doAction('suspend',this)">🚫 Suspend</button>`}
        <button class="ba met" onclick="doAction('toggle_metrics',this)">${p.has_metrics?"📊 Off":"📊 On"}</button>
        <button class="ba fre" onclick="doAction('grant_free_month',this)">🎁 Free Mo</button>
        <button class="ba eml" onclick="openEmail(this)">✉️ Email</button>
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
<div class="toolbar">
  <input type="text" id="search" placeholder="🔍  Search business, email, handle…" oninput="ft()"/>
  <select id="fs" onchange="ft()"><option value="">All Status</option><option value="active">Active</option><option value="susp">Suspended</option></select>
  <select id="fm" onchange="ft()"><option value="">All Plans</option><option value="yes">Has Metrics</option><option value="no">No Metrics</option></select>
  <span class="cnt" id="cnt">${profiles.length} profiles</span>
  <button class="rbtn" onclick="location.reload()">↺ Refresh</button>
</div>
<div class="tw"><table id="tbl">
<thead><tr><th>Business / Email</th><th>Profile URL</th><th>Status</th><th>Metrics</th><th>Branding</th><th>Scans 30d</th><th>Leads</th><th>Joined</th><th>Actions</th></tr></thead>
<tbody>${rows||'<tr><td colspan="9" style="text-align:center;color:#555;padding:60px;">No profiles yet</td></tr>'}</tbody>
</table></div>
</div>

<div class="mbg" id="em"><div class="modal">
  <h3>✉️ Send Email</h3>
  <label>To</label><input type="text" id="eTo" readonly/>
  <label>Subject</label><input type="text" id="eSub" value="A message from Torrolink"/>
  <label>Message</label><textarea id="eMsg" placeholder="Write your message…"></textarea>
  <input type="hidden" id="eName"/>
  <div class="ma"><button class="bcn" onclick="closeEm()">Cancel</button><button class="bsd" id="sendBtn" onclick="sendEm()">Send →</button></div>
</div></div>

<div id="toast"></div>
<script>
const AU='/.netlify/functions/admin';
const AP='${ADMIN_PASS}';
function toast(m,e){const t=document.getElementById('toast');t.textContent=m;t.className=e?'err':'';t.style.display='block';setTimeout(()=>t.style.display='none',3200)}
async function doAction(a,btn){
  const row=btn.closest('tr');
  const pid=row.dataset.profileId,cid=row.dataset.customerId;
  btn.disabled=true;const orig=btn.textContent;btn.textContent='…';
  try{
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Basic '+btoa(':'+AP)},body:JSON.stringify({action:a,profileId:pid,customerId:cid})});
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
    const r=await fetch(AU,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Basic '+btoa(':'+AP)},body:JSON.stringify({action:'send_email',email:document.getElementById('eTo').value,name:document.getElementById('eName').value,subject:document.getElementById('eSub').value,message:msg})});
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
</script></body></html>`
  };
}

function json(s,b){return{statusCode:s,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
