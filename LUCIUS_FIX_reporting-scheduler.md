# LUCIUS FIX — reporting-scheduler.js
**Prepared by:** Lucius (Tech & QA)
**Status:** Ready to deploy — awaiting Laign approval
**Issue:** reporting-scheduler.js runs on `mockSubscribers = []` — no real Supabase data is pulled, so no reports ever go out to actual subscribers
**File to replace:** `netlify/functions/reporting-scheduler.js`
**Risk level:** 🟡 Yellow — changes customer-facing behavior (subscribers will start receiving weekly reports)

---

## What the Fix Does

1. Connects to Supabase using the service role key (same pattern as metrics.js)
2. Queries `customers` table for all rows where `metrics_active = true`
3. For each active customer, queries their `profiles` to get business name
4. Pulls their last 7 days and prior 7 days of `scan_events` to compute weekly metrics
5. Builds the metrics object the `reporting-agent` expects
6. Calls `reporting-agent` for each subscriber

---

## How to Deploy When Ready

1. Review the fixed code below
2. When Laign approves, run this Python script via bash to write the file:

```bash
python3 /sessions/brave-affectionate-wright/mnt/Torrolink/LUCIUS_apply_scheduler_fix.py
```

3. Run syntax check: `node --check netlify/functions/reporting-scheduler.js`
4. Update commit message in _fix_deploy.bat
5. Laign runs _fix_deploy.bat

---

## Fixed Code

```javascript
// ================================================
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
        uniqueScans: thisWeek.length, // approximation — no session dedup in scan_events yet
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
      // Continue to next subscriber — don't let one failure stop the rest
    }
  }

  return { statusCode: 200, body: "Scheduler complete." };
};
```

---

## Notes

- `uniqueScans` is currently set equal to `totalScans` as an approximation. The `scan_events` table doesn't currently track session IDs or unique device fingerprints, so true unique dedup isn't possible yet. Can be improved later when scan tracking is enhanced.
- `topLocations` uses `country` field only — city/state aren't in `scan_events`. The reporting-agent renders them fine with just country.
- If a customer has no profile, they're skipped with a console log (not an error).
- The function is fault-tolerant: one subscriber failing won't stop reports for others.
