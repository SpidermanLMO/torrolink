"""
LUCIUS — Fix PWA banner .show class

The JS calls b.classList.add('show') on the banners but no CSS defines .show.
Fix: add CSS to the portal <style> block that makes .show override display:none.
pwaBanner is flex (horizontal layout), iosBanner is block.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = "  </style>\n</head>"
new = """  #pwaBanner.show { display: flex !important; }
  #iosBanner.show { display: block !important; }
  </style>
</head>"""

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: added .show CSS for PWA banners ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
