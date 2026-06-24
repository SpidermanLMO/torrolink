"""
LUCIUS — Fix deleteLog onclick escape in portal.js

Bug: portal.js line 1635 uses \'' inside template literal.
Template literal processes \' -> ', producing '' (two adjacent quotes)
in the browser's <script> block, causing SyntaxError: Unexpected string.

Also scan for any other \' patterns in the script block (line 876+).

Fix: replace \' with &apos; in onclick HTML attribute strings.
Browser decodes &apos; -> ' when setting innerHTML, so deleteLog('id','id') works correctly.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Fix: deleteLog(\'' + log.id + '\',\'' + p.id + '\')
# The \' in the template literal becomes ' in HTML output, producing adjacent string literals.
old = r"""'<button class="log-del" title="Remove" onclick="deleteLog(\'' + log.id + '\',\'' + p.id + '\')">✕</button></div>';"""
new =  """'<button class="log-del" title="Remove" onclick="deleteLog(&apos;' + log.id + '&apos;,&apos;' + p.id + '&apos;)">✕</button></div>';"""

count = src.count(old)
if count == 0:
    print("ERROR: Pattern not found — check for whitespace/encoding differences")
    # Try to find approximate match for diagnosis
    idx = src.find("deleteLog(\\'")
    if idx == -1:
        idx = src.find("deleteLog(\\''")
    print(f"  Approximate location search: {idx}")
else:
    src = src.replace(old, new, 1)
    print(f"Fixed deleteLog pattern ({count} occurrence(s))")

# Scan for any remaining \' in script block (line 876+) that could cause same issue
script_start = src.find("<script>")
script_section = src[script_start:] if script_start != -1 else ""

import re
# Find JS string literals that use \' inside single-quoted strings in the script block
# These produce broken JS when template literal processes \' -> '
broken_patterns = re.findall(r"'[^']*\\''[^']*'", script_section[:5000])  # check first 5000 chars of script
if broken_patterns:
    print(f"WARNING: Other potential \\' patterns in script block: {broken_patterns[:3]}")
else:
    print("No other \\' patterns detected in first 5000 chars of script block")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done.")
