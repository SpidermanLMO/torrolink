// ================================================
// TORROLINK — REPORTING SCHEDULER
// Netlify scheduled function — runs every Monday
// at 8am CT to trigger the Reporting Agent for
// all active subscribers
// ================================================

exports.handler = async () => {
  // This function is triggered by Netlify's scheduler
  // Configure in netlify.toml with schedule = "0 13 * * 1" (Monday 8am CT = 1pm UTC)

  console.log("Reporting scheduler triggered:", new Date().toISOString());

  // In production this would pull subscribers from Supabase
  // For now it logs that it ran — wire up DB when Supabase is connected
  const mockSubscribers = [];

  for (const subscriber of mockSubscribers) {
    try {
      await fetch(`${process.env.URL}/.netlify/functions/reporting-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberEmail: subscriber.email,
          subscriberName: subscriber.name,
          business: subscriber.business,
          metrics: subscriber.metrics,
          period: "Weekly",
        }),
      });
    } catch (err) {
      console.error(`Failed to send report for ${subscriber.email}:`, err);
    }
  }

  return { statusCode: 200, body: "Scheduler ran." };
};
