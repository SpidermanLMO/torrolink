"""
LUCIUS — Fix admin.js CSV export template literal escape bug

Bug: admin.js line 681 — inside the large template literal that generates
the admin HTML, the JS code uses '\n' to join CSV rows.

Inside a template literal, \n is evaluated as a real newline character.
So the browser receives:
    const csv = rows...join('
    ');
which is a SyntaxError: Unexpected string (unterminated string literal).

This crashes the ENTIRE <script> block, making openBeta, toast, etc.
all undefined — which is why the Add Beta Tester button does nothing.

Fix: change '\n' to '\\n' so the template literal outputs '\n' (the
two-character escape sequence) instead of a real newline.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/admin.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# The file contains backslash-n as two chars (\, n).
# Python raw strings make this unambiguous.
old = r"""join(',')).join('\n');"""
new = r"""join(',')).join('\\n');"""

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found — check file")
else:
    src = src.replace(old, new, 1)
    print(f"Fixed '\\'\\n\\'' escape ({count} occurrence(s))")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

# Verify
with open(path, "r", encoding="utf-8") as f:
    verify = f.read()

if r"join('\\n')" in verify:
    print("Verified: '\\\\n' is now in file")
else:
    print("WARNING: verification failed")

# node --check won't catch browser-JS bugs, but confirm Node syntax is OK
import subprocess
result = subprocess.run(["node", "--check", path], capture_output=True, text=True)
if result.returncode == 0:
    print("node --check: SYNTAX OK")
else:
    print("node --check ERROR:", result.stderr[:200])

print("Done.")
