"""
LUCIUS — Fix changePwModal display:none/flex conflict

Bug: modal HTML has both display:none and display:flex in the same style
attribute. CSS last-value wins → display:flex → modal always visible on load.

Fix: remove display:flex from the initial HTML. Keep align-items/justify-content
so they apply when showChangePwModal() sets display='flex' via JS.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = '  <div id="changePwModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">'
new = '  <div id="changePwModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:center;justify-content:center;">'

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: removed duplicate display:flex from modal ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
