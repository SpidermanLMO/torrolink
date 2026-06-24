"""
LUCIUS — Fix admin.js undefined OWNER_EMAIL

Bug: OWNER_EMAIL is referenced at line 282 (email alert in create_beta)
but was never declared as a constant. Node throws ReferenceError → 500.

Fix: add const OWNER_EMAIL = process.env.OWNER_EMAIL || "laign@ptorro.com";
to the constants block near the top of admin.js.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/admin.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = 'const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";'
new = ('const SITE        = process.env.DEPLOY_URL || "https://torrolink.com";\n'
       'const OWNER_EMAIL = process.env.OWNER_EMAIL || "laign@ptorro.com";')

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: added OWNER_EMAIL constant ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
