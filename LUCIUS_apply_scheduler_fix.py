"""
LUCIUS — Apply reporting-scheduler.js fix
Run: python3 LUCIUS_apply_scheduler_fix.py
Then: node --check netlify/functions/reporting-scheduler.js
"""

import os

TARGET = os.path.join(os.path.dirname(__file__), "netlify", "functions", "reporting-scheduler.js")

FIXED_CODE = r"""// ================================================
// TORROLINK — REPORTING SCHEDULER
// Netlify scheduled function — runs every Monday
// at 8am CT to trigger the Reporting Agent for
// all active subscribers
// ================================================

const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  console.log("Reporting scheduler triggered:", new Date().toISOString());

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // 1. Pull all customers with metrics active
  const { data: activeCustomers, error: custErr } = await supabase
    .from("customers")
    .select("id, email, name")
    .eq("metrics_active", true);

  if (custErr) {
    console.error("Failed to fetch active customers:", custErr.message);
    return { statusCode: 500, body: "Failed to fetch customers." };
  }

  if (!activeCustomers || activeCustomers.length === 0) {
    console.log("No active subscribers found. Scheduler done.");
    return { statusCode: 200, body: "No active subscribers." };
  }

  console.log(`Found ${activeCustomers.length} active subscriber(s).`);

  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString();

  // 2. Process each subscriber
  for (const customer of activeCustomers) {
    try {
      // Get their profile (business name, profile id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, business_name")
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (!profile) {
        console.log(`No profile found for customer ${customer.email} — skipping.`);
        continue;
      }

      // Pull this week's scans
      const { data: thisWeekScans } = await supabase
        .from("scan_events")
        .select("scanned_at, device_type, country")
        .eq("profile_id", profile.id)
        .gte("scanned_at", weekAgo);

      // Pull prior week's scans (for comparison)
      const { data: priorWeekScans } = await supabase
        .from("scan_events")
        .select("scanned_at")
        .eq("profile_id", profile.id)
        .gte("scanned_at", twoWeeksAgo)
        .lt("scanned_at", weekAgo);

      const thisWeek = thisWeekScans || [];
      const priorWeek = priorWeekScans || [];

      // Compute top days
      const dayCounts = {};
      thisWeek.forEach(s => {
        const day = new Date(s.scanned_at).toLocaleDateString("en-US", { weekday: "long" });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const topDays = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day, count]) => ({ day, count }));

      // Compute top devices
      const deviceCounts = {};
      thisWeek.forEach(s => {
        const d = s.device_type || "Unknown";
        deviceCounts[d] = (deviceCounts[d] || 0) + 1;
      });
      const topDevices = Object.entries(deviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([device, count]) => ({
          device,
          percent: thisWeek.length ? Math.round(count / thisWeek.length * 100) : 0,
        }));

      // Compute top locations
      const locCounts = {};
      thisWeek.forEach(s => {
        const loc = s.country || "Unknown";
        locCounts[loc] = (locCounts[loc] || 0) + 1;
      });
      const topLocations = Object.entries(locCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([country, count]) => ({ city: "", state: "", country, count }));

      // WoW comparison
      const comparedToLastPeriod = priorWeek.length
        ? Math.round((thisWeek.length - priorWeek.length) / priorWeek.length * 100)
        : thisWeek.length > 0 ? 100 : 0;

      const metrics = {
        totalScans: thisWeek.length,
        uniqueScans: thisWeek.length,
        topDays,
        topDevices,
        topLocations,
        comparedToLastPeriod,
      };

      // Call reporting-agent
      await fetch(`${process.env.URL}/.netlify/functions/reporting-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberEmail: customer.email,
          subscriberName: customer.name || "",
          business: profile.business_name || customer.email,
          metrics,
          period: "Weekly",
        }),
      });

      console.log(`Report sent for ${customer.email} (${profile.business_name})`);

    } catch (err) {
      console.error(`Failed to process report for ${customer.email}:`, err.message);
    }
  }

  return { statusCode: 200, body: "Scheduler complete." };
};
"""

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(FIXED_CODE)

print(f"✅ Fix applied to: {TARGET}")
print("Run: node --check netlify/functions/reporting-scheduler.js")
