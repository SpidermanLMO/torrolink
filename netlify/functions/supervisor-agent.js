// ================================================
// TORROLINK — SUPERVISOR AGENT
// Watches all agents, catches errors, coordinates
// handoffs, sends daily status reports to Laign
// ================================================

const Anthropic = require("@anthropic-ai/sdk");
const { Resend } = require("resend");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "laign@ptorro.com";

// Agent registry — all agents the supervisor watches
const AGENTS = [
  "order-agent",
  "qr-generator-agent",
  "lead-router-agent",
  "reporting-agent",
  "content-update-agent",
  "billing-agent",
  "onboarding-agent",
];

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { action, agentName, agentResult, agentError, logs } = body;

  try {
    // ── DAILY BRIEFING ──────────────────────────────
    if (action === "daily_briefing") {
      const briefing = await generateDailyBriefing(logs || []);
      await resend.emails.send({
        from: "Torrolink Supervisor <supervisor@torrolink.com>",
        to: OWNER_EMAIL,
        subject: `📊 Torrolink Daily Briefing — ${new Date().toLocaleDateString()}`,
        html: briefing,
      });
      return respond(200, { message: "Daily briefing sent." });
    }

    // ── AGENT FAILURE ALERT ─────────────────────────
    if (action === "agent_failed") {
      const diagnosis = await diagnoseFailure(agentName, agentError);
      await resend.emails.send({
        from: "Torrolink Supervisor <supervisor@torrolink.com>",
        to: OWNER_EMAIL,
        subject: `⚠️ Agent Issue: ${agentName}`,
        html: `
          <h2>Agent Alert</h2>
          <p><strong>Agent:</strong> ${agentName}</p>
          <p><strong>Error:</strong> ${agentError}</p>
          <hr/>
          <h3>Supervisor Diagnosis:</h3>
          <p>${diagnosis}</p>
        `,
      });
      return respond(200, { message: "Failure alert sent.", diagnosis });
    }

    // ── COORDINATE HANDOFF ──────────────────────────
    // e.g. Order Agent completes → trigger QR Generator
    if (action === "handoff") {
      const next = await decideNextAgent(agentName, agentResult);
      return respond(200, { nextAgent: next });
    }

    // ── STATUS CHECK ────────────────────────────────
    if (action === "status") {
      return respond(200, {
        supervisor: "online",
        agents: AGENTS,
        timestamp: new Date().toISOString(),
      });
    }

    return respond(400, { error: "Unknown action." });

  } catch (err) {
    console.error("Supervisor error:", err);
    return respond(500, { error: err.message });
  }
};

// ── AI-POWERED FUNCTIONS ────────────────────────────

async function generateDailyBriefing(logs) {
  const logText = logs.length
    ? logs.map((l) => `- ${l}`).join("\n")
    : "No agent activity logged today.";

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are the supervisor of the Torrolink QR code business. Write a concise daily briefing email (HTML format) for the owner based on these agent activity logs:\n\n${logText}\n\nInclude: orders processed, QR codes delivered, leads routed, any issues. Keep it under 200 words. Use a professional but friendly tone.`,
      },
    ],
  });

  return msg.content[0].text;
}

async function diagnoseFailure(agentName, error) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `The ${agentName} in a QR code business platform failed with this error: "${error}". In 2-3 sentences, explain what likely went wrong and what the business owner should check to fix it. Be clear and non-technical.`,
      },
    ],
  });
  return msg.content[0].text;
}

async function decideNextAgent(completedAgent, result) {
  const handoffs = {
    "order-agent": "qr-generator-agent",
    "qr-generator-agent": "onboarding-agent",
    "onboarding-agent": null,
    "billing-agent": "reporting-agent",
  };
  return handoffs[completedAgent] || null;
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
