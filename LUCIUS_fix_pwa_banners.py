"""
LUCIUS — Add PWA install banner HTML to portal

Bug: pwaBanner and iosBanner divs are referenced in JS but never exist in the DOM.
getElementById returns null → install banner never shows.

Fix: add both banner elements right after <body class="tl-page">.
- Android/Chrome: #pwaBanner slides up from bottom with "Add to Home Screen" button
- iOS/Safari: #iosBanner shows tap-share instructions
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = '<body class="tl-page">\n\n  <div class="tl-topbar">'

new = '''<body class="tl-page">

  <!-- PWA install banner (Android/Chrome) -->
  <div id="pwaBanner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#0a4d4d;color:#fff;padding:14px 18px;z-index:10000;align-items:center;gap:12px;box-shadow:0 -2px 16px rgba(0,0,0,0.25);">
    <span style="font-size:0.9rem;flex:1;">&#128241; Add Torrolink to your home screen for quick access.</span>
    <button id="pwaBannerBtn" style="background:#f4752b;color:#fff;border:none;padding:9px 18px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.88rem;white-space:nowrap;">Install</button>
    <button onclick="dismissPwaBanner()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:1.2rem;cursor:pointer;padding:0 4px;">&#10005;</button>
  </div>

  <!-- PWA install banner (iOS/Safari) -->
  <div id="iosBanner" style="display:none;position:fixed;bottom:0;left:0;right:0;background:#0a4d4d;color:#fff;padding:14px 18px;z-index:10000;box-shadow:0 -2px 16px rgba(0,0,0,0.25);">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="font-size:0.9rem;flex:1;font-weight:700;">&#128241; Add to Home Screen</span>
      <button onclick="dismissPwaBanner()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:1.2rem;cursor:pointer;padding:0 4px;">&#10005;</button>
    </div>
    <p style="margin:0;font-size:0.84rem;color:rgba(255,255,255,0.85);line-height:1.5;">Tap <strong>&#9633; Share</strong> at the bottom of Safari, then tap <strong>Add to Home Screen</strong>.</p>
  </div>

  <div class="tl-topbar">'''

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: added pwaBanner + iosBanner HTML ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
