"""
LUCIUS — Fix two JS string literal bugs in portal.js renderReferral
Caused by Python \\' -> ' being written into single-quoted JS strings.

Bug 1: People You've Referred  (apostrophe terminates JS string)
Bug 2: onclick="switchTab('upgrade')" (single quotes terminate JS string)

Fix: use HTML entities (&rsquo; and &apos;) which the browser decodes correctly.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

original_len = len(src)

# Bug 1: apostrophe in "People You've Referred" breaks the single-quoted JS string
old1 = "People You've Referred"
new1 = "People You&rsquo;ve Referred"
count1 = src.count(old1)
src = src.replace(old1, new1, 1)

# Bug 2: single quotes in onclick inside a single-quoted JS string
old2 = """onclick="switchTab('upgrade');return false;" """
new2 = """onclick="switchTab(&apos;upgrade&apos;);return false;" """
count2 = src.count(old2.strip())

# Try with trailing space, then without
if count2 == 0:
    old2 = """onclick="switchTab('upgrade');return false;"""
    new2 = """onclick="switchTab(&apos;upgrade&apos;);return false;"""
    count2 = src.count(old2)

src = src.replace(old2, new2, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print(f"Bug 1 occurrences found: {count1}")
print(f"Bug 2 occurrences found: {count2}")
print(f"File length: {original_len} -> {len(src)}")
print("Done.")
