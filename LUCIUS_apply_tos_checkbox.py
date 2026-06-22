"""
LUCIUS — Add ToS agreement checkbox to checkout modal
Patches index.html and script.js.

Changes:
1. index.html: adds ToS checkbox + error message before the submit button
2. script.js: adds checkbox validation in submitCheckoutModal()

Run: python3 LUCIUS_apply_tos_checkbox.py
Then verify: open index.html and test the checkout modal
"""

import os

BASE = os.path.dirname(__file__)
HTML_FILE = os.path.join(BASE, "index.html")
JS_FILE   = os.path.join(BASE, "script.js")

# ── PATCH 1: index.html — insert ToS checkbox before submit button ──────────

with open(HTML_FILE, "r", encoding="utf-8") as f:
    html = f.read()

OLD_BTN = '      <button id="modalSubmitBtn" class="btn btn-primary btn-full" onclick="submitCheckoutModal()">Continue to Payment →</button>'

NEW_BTN = (
    '      <div style="margin-top:14px;">\n'
    '        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:0.84rem;color:#555;line-height:1.45;">\n'
    '          <input type="checkbox" id="modalAgreeToS" style="margin-top:3px;flex-shrink:0;accent-color:#0f6b6b;" />\n'
    '          <span>I agree to the <a href="/terms" target="_blank" style="color:#0f6b6b;font-weight:600;">Terms of Service</a> and <a href="/privacy" target="_blank" style="color:#0f6b6b;font-weight:600;">Privacy Policy</a>, including the collection and use of data as described therein.</span>\n'
    '        </label>\n'
    '        <div id="modalAgreeError" style="color:#e53e3e;font-size:0.8rem;margin-top:6px;display:none;">Please agree to the Terms of Service to continue.</div>\n'
    '      </div>\n'
    '      <button id="modalSubmitBtn" class="btn btn-primary btn-full" onclick="submitCheckoutModal()" style="margin-top:14px;">Continue to Payment →</button>'
)

if OLD_BTN not in html:
    print("ERROR: Could not find submit button in index.html — string mismatch.")
    exit(1)

html = html.replace(OLD_BTN, NEW_BTN, 1)

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html)

print("Patched: index.html — ToS checkbox added to checkout modal")

# ── PATCH 2: script.js — add checkbox validation in submitCheckoutModal() ────

with open(JS_FILE, "r", encoding="utf-8") as f:
    js = f.read()

OLD_VALIDATION = (
    "  if (!businessName) {\n"
    "    nameInput.classList.add('error');\n"
    "    nameInput.focus();\n"
    "    return;\n"
    "  }\n"
    "  nameInput.classList.remove('error');"
)

NEW_VALIDATION = (
    "  const agreeToS = document.getElementById('modalAgreeToS');\n"
    "  if (agreeToS && !agreeToS.checked) {\n"
    "    document.getElementById('modalAgreeError').style.display = 'block';\n"
    "    return;\n"
    "  }\n"
    "  if (agreeToS) document.getElementById('modalAgreeError').style.display = 'none';\n"
    "\n"
    "  if (!businessName) {\n"
    "    nameInput.classList.add('error');\n"
    "    nameInput.focus();\n"
    "    return;\n"
    "  }\n"
    "  nameInput.classList.remove('error');"
)

if OLD_VALIDATION not in js:
    print("ERROR: Could not find validation block in script.js — string mismatch.")
    exit(1)

js = js.replace(OLD_VALIDATION, NEW_VALIDATION, 1)

with open(JS_FILE, "w", encoding="utf-8") as f:
    f.write(js)

print("Patched: script.js — ToS checkbox validation added to submitCheckoutModal()")
print("\nDone. Verify by opening index.html and testing the checkout modal.")
print("Deploy: update _fix_deploy.bat commit message, then Laign runs it.")
