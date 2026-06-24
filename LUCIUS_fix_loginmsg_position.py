"""
LUCIUS — Move loginMsg below Sign In button

Bug: loginMsg div sits above the form (between auth tabs and email field).
On mobile, users scroll to the Sign In button to tap it. Any error appears
above their view — looks like the button did nothing.

Fix: move loginMsg to below the Sign In button and Forgot password link,
so errors appear right where the user is looking.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

fixes = []

# Remove loginMsg from its current position (above the form panels)
fixes.append((
    "\n      <div id=\"loginMsg\"></div>\n\n      <!-- Sign In panel -->",
    "\n\n      <!-- Sign In panel -->",
    "remove loginMsg from above form"
))

# Add loginMsg below the Sign In button and Forgot password link (inside panelSignIn)
fixes.append((
    """        <button class="tl-btn tl-btn-full" onclick="signInWithPassword()">Sign In</button>
        <p style="font-size:0.82rem;color:#999;margin-top:12px;text-align:center;">
          <a href="#" onclick="showResetForm(event)" style="color:#0f6b6b;">Forgot password?</a>
        </p>
      </div>

      <!-- Create Account panel -->""",
    """        <button class="tl-btn tl-btn-full" onclick="signInWithPassword()">Sign In</button>
        <p style="font-size:0.82rem;color:#999;margin-top:12px;text-align:center;">
          <a href="#" onclick="showResetForm(event)" style="color:#0f6b6b;">Forgot password?</a>
        </p>
        <div id="loginMsg" style="margin-top:10px;"></div>
      </div>

      <!-- Create Account panel -->""",
    "add loginMsg below Sign In + forgot password"
))

for old, new, label in fixes:
    count = src.count(old)
    if count == 0:
        print(f"  MISS  [{label}]")
    else:
        src = src.replace(old, new, 1)
        print(f"  OK    [{label}]")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
