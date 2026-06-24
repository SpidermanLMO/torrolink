"""
LUCIUS — Add try/catch to profile.js handler
Wraps the entire handler body so unhandled errors return a clean 500 page
instead of crashing silently.

Run: python3 LUCIUS_fix_profile_trycatch.py
Then: node --check netlify/functions/profile.js
"""

import os
import sys

TARGET = os.path.join(os.path.dirname(__file__), "netlify", "functions", "profile.js")

with open(TARGET, "r", encoding="utf-8") as f:
    content = f.read()

# ── PATCH: wrap handler body in try/catch ─────────────────────────────────────

OLD_HANDLER_OPEN = """exports.handler = async (event) => {
  const handle = event.path.replace(/^\\/p\\//, "").split("/")[0].toLowerCase();
  if (!handle) return { statusCode: 302, headers: { Location: "/" } };"""

NEW_HANDLER_OPEN = """exports.handler = async (event) => {
  try {
  const handle = event.path.replace(/^\\/p\\//, "").split("/")[0].toLowerCase();
  if (!handle) return { statusCode: 302, headers: { Location: "/" } };"""

# The handler currently ends with the return statement inside the handler.
# We need to find the closing of the handler and add the catch block before it.
# The handler closes at the line: `};` after the renderProfile return.

OLD_HANDLER_CLOSE = """  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    body: renderProfile(profile, reviews || [], photos || [], documents || []),
  };
};"""

NEW_HANDLER_CLOSE = """  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    body: renderProfile(profile, reviews || [], photos || [], documents || []),
  };
  } catch (err) {
    console.error("[profile] unhandled error:", err && err.message ? err.message : err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Error — TorroLink</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0f6b6b 0%,#1a2e4a 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{background:#fff;border-radius:24px;padding:48px 36px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.25);}
    .icon{font-size:3rem;margin-bottom:16px;}
    h1{font-size:1.5rem;font-weight:800;color:#1a1a2e;margin-bottom:10px;}
    p{color:#666;font-size:0.95rem;line-height:1.5;margin-bottom:28px;}
    .btn{display:inline-block;background:#0f6b6b;color:#fff;font-weight:700;font-size:0.95rem;padding:13px 28px;border-radius:50px;text-decoration:none;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;&#65039;</div>
    <h1>Something went wrong</h1>
    <p>This profile couldn't load right now. Please try again in a moment.</p>
    <a href="https://torrolink.com" class="btn">Go to TorroLink</a>
  </div>
</body>
</html>`,
    };
  }
};"""

if OLD_HANDLER_OPEN not in content:
    print("ERROR: Could not find handler open block — string mismatch.")
    sys.exit(1)

if OLD_HANDLER_CLOSE not in content:
    print("ERROR: Could not find handler close block — string mismatch.")
    sys.exit(1)

content = content.replace(OLD_HANDLER_OPEN, NEW_HANDLER_OPEN, 1)
content = content.replace(OLD_HANDLER_CLOSE, NEW_HANDLER_CLOSE, 1)

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched: profile.js — try/catch added to handler")
print("Run: node --check netlify/functions/profile.js")
