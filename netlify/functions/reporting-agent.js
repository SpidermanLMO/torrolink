// ================================================
// TORROLINK — REPORTING AGENT
// Pulls each subscriber's scan data and emails
// them a branded weekly/monthly report
// ================================================

const Anthropic = require("@anthropic-ai/sdk");
const { Resend } = require("resend");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

function escHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  try {
    const { subscriberEmail, subscriberName, business, metrics, period } = JSON.parse(event.body || "{}");

    if (!subscriberEmail || !metrics) return respond(400, { error: "Missing fields." });

    const {
      totalScans = 0,
      uniqueScans = 0,
      topDays = [],
      topDevices = [],
      topLocations = [],
      comparedToLastPeriod = 0,
    } = metrics;

    // ── AI-GENERATED INSIGHT ──────────────────────────
    const aiInsight = await generateInsight(business, metrics, period);

    const trend = comparedToLastPeriod >= 0
      ? `📈 +${comparedToLastPeriod}% vs last ${period}`
      : `📉 ${comparedToLastPeriod}% vs last ${period}`;

    // ── SEND REPORT ───────────────────────────────────
    await resend.emails.send({
      from: "Torrolink Reports <reports@torrolink.com>",
      to: subscriberEmail,
      subject: `📊 Your ${period} QR Report — ${business || "Torrolink"}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0f6b6b;padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">${period} QR Code Report</h2>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;">${escHtml(business || "Your Business")} • Powered by Torrolink</p>
          </div>

          <div style="padding:24px;background:#fff;border:1px solid #e2e6ea;">

            <!-- HEADLINE STATS -->
            <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
              <div style="flex:1;background:#f4f6f8;padding:16px;border-radius:8px;text-align:center;min-width:120px;">
                <div style="font-size:2rem;font-weight:900;color:#0f6b6b;">${totalScans}</div>
                <div style="color:#888;font-size:0.85rem;">Total Scans</div>
              </div>
              <div style="flex:1;background:#f4f6f8;padding:16px;border-radius:8px;text-align:center;min-width:120px;">
                <div style="font-size:2rem;font-weight:900;color:#0f6b6b;">${uniqueScans}</div>
                <div style="color:#888;font-size:0.85rem;">Unique Scanners</div>
              </div>
              <div style="flex:1;background:#f4f6f8;padding:16px;border-radius:8px;text-align:center;min-width:120px;">
                <div style="font-size:2rem;font-weight:900;color:#f4752b;">${trend}</div>
                <div style="color:#888;font-size:0.85rem;">vs Last Period</div>
              </div>
            </div>

            <!-- TOP DAYS -->
            ${topDays.length ? `
            <h3 style="color:#0f6b6b;">Top Scan Days</h3>
            <ul>${topDays.map(d => `<li>${escHtml(d.day)}: <strong>${escHtml(d.count)} scans</strong></li>`).join("")}</ul>
            ` : ""}

            <!-- DEVICES -->
            ${topDevices.length ? `
            <h3 style="color:#0f6b6b;">Devices</h3>
            <ul>${topDevices.map(d => `<li>${escHtml(d.device)}: <strong>${escHtml(d.percent)}%</strong></li>`).join("")}</ul>
            ` : ""}

            <!-- LOCATIONS -->
            ${topLocations.length ? `
            <h3 style="color:#0f6b6b;">Top Locations</h3>
            <ul>${topLocations.map(l => `<li>${escHtml(l.city)}, ${escHtml(l.state)}: <strong>${escHtml(l.count)} scans</strong></li>`).join("")}</ul>
            ` : ""}

            <!-- AI INSIGHT -->
            <div style="background:#f0fafa;border-left:4px solid #0f6b6b;padding:16px;border-radius:0 8px 8px 0;margin-top:24px;">
              <h3 style="color:#0f6b6b;margin-top:0;">💡 Torrolink Insight</h3>
              <p style="margin:0;">${escHtml(aiInsight)}</p>
            </div>

            <p style="margin-top:32px;color:#888;font-size:0.85rem;text-align:center;">
              Torrolink — A PTorro Holdings Company<br/>
              <a href="https://torrolink.com" style="color:#0f6b6b;">torrolink.com</a>
            </p>
          </div>
        </div>
      `,
    });

    return respond(200, { success: true });

  } catch (err) {
    console.error("Reporting agent error:", err);
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "reporting-agent",
        agentError: err.message,
      }),
    }).catch(() => {});
    return respond(500, { error: "Report generation failed." });
  }
};

async function generateInsight(business, metrics, period) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `You are a QR code analytics advisor. Write one concise, actionable insight (2-3 sentences) for a small business called "${business}" based on these ${period} stats: ${JSON.stringify(metrics)}. Be specific and helpful, not generic.`,
      }],
    });
    return msg.content[0].text;
  } catch {
    return "Your QR code is actively driving traffic to your business. Keep it visible and consider adding it to new locations to increase scans.";
  }
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
