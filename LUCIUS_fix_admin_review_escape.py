"""
LUCIUS — Fix admin.js review button onclick escapes

Bug: script lines 93-94 — toggleRev and deleteRev onclick handlers
use '' (two apostrophes) around rv.id inside a single-quoted JS string.

In the template literal: \\'' was intended to produce \\' (escaped quote)
but the file has '' (bare apostrophes). JavaScript parser sees:
  '... onclick="toggleRev('   <- string closes here
  '                           <- NEW string starts (no operator!)
= SyntaxError: Unexpected string at admin:314:73

Fix: use &apos; HTML entity for the single quotes wrapping the ID.
Browser decodes &apos; -> ' when parsing the onclick attribute,
so the handler receives toggleRev('uuid', true, this) correctly.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/admin.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

fixes = [
    # Line 93: toggleRev
    (
        """'<button class="ba '+(vis?'sus':'act')+'" onclick="toggleRev(''+rv.id+'','+(String(!vis))+',this)">'+(vis?'Hide':'Show')+'</button>'+""",
        """'<button class="ba '+(vis?'sus':'act')+'" onclick="toggleRev(&apos;'+rv.id+'&apos;,'+(String(!vis))+',this)">'+(vis?'Hide':'Show')+'</button>'+"""
    ),
    # Line 94: deleteRev
    (
        """'<button class="ba del" onclick="deleteRev(''+rv.id+'',this)">Delete</button>'+""",
        """'<button class="ba del" onclick="deleteRev(&apos;'+rv.id+'&apos;,this)">Delete</button>'+"""
    ),
]

for old, new in fixes:
    count = src.count(old)
    if count == 0:
        print(f"MISS: {old[:60]}")
    else:
        src = src.replace(old, new, 1)
        print(f"OK ({count}x): {old[:60]}")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:200])
print("Done.")
