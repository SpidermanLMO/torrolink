"""
LUCIUS — Fix admin token lifetime + WWW-Authenticate on AJAX

Bug 1: HMAC token uses 5-min windows × 3 grace = 15 min session.
User gets a 401 mid-session triggering browser Basic Auth dialog.
Fix: extend to 60-min windows × 3 grace = 3-hour session.

Bug 2: unauthed() always sends WWW-Authenticate: Basic header.
For fetch() AJAX calls (POST), this causes Chrome/Edge to show the
native username+password dialog even though it's an AJAX call.
Fix: POST 401s return plain JSON with no WWW-Authenticate header.
GET 401s keep the header (needed for initial browser Basic Auth gate).
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/admin.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

fixes = []

# 1. Extend token window: 300000ms (5 min) → 3600000ms (60 min)
fixes.append((
    "const ts = Math.floor(Date.now() / 300000);\n  return crypto.createHmac",
    "const ts = Math.floor(Date.now() / 3600000);\n  return crypto.createHmac",
    "makeToken window 5min→60min"
))
fixes.append((
    "const ts = Math.floor(Date.now() / 300000);\n  for (const t of [ts, ts - 1, ts - 2]) { // 10-min grace window",
    "const ts = Math.floor(Date.now() / 3600000);\n  for (const t of [ts, ts - 1, ts - 2]) { // 3-hour grace window",
    "checkToken window 5min→60min"
))

# 2. Split unauthed into GET (Basic realm) vs POST (JSON, no WWW-Auth header)
fixes.append((
    '''function unauthed() {
  return { statusCode: 401, headers: { "WWW-Authenticate": 'Basic realm="Torrolink Admin"', "Content-Type": "text/plain" }, body: "Unauthorized" };
}

exports.handler = async (event) => {
  await loadEffectivePass();
  if (!isAuthed(event)) return unauthed();
  if (event.httpMethod === "POST") return handleAction(event);
  return handleDashboard();
};''',
    '''function unauthed(method) {
  if (method === "POST") {
    // AJAX call — return JSON 401 with NO WWW-Authenticate so browser skips native dialog
    return { statusCode: 401, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Session expired. Please reload the page." }) };
  }
  // Initial page load — Basic Auth dialog is correct here
  return { statusCode: 401, headers: { "WWW-Authenticate": 'Basic realm="Torrolink Admin"', "Content-Type": "text/plain" }, body: "Unauthorized" };
}

exports.handler = async (event) => {
  await loadEffectivePass();
  if (!isAuthed(event)) return unauthed(event.httpMethod);
  if (event.httpMethod === "POST") return handleAction(event);
  return handleDashboard();
};''',
    "unauthed: split GET vs POST 401"
))

for old, new, label in fixes:
    count = src.count(old)
    if count == 0:
        print(f"  MISS  [{label}]")
    else:
        src = src.replace(old, new, 1)
        print(f"  OK    [{label}]")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
