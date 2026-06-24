"""
LUCIUS — Fix password recovery (PKCE + message visibility), v2

Three bugs to fix:

1. SIGNED_IN event still calls onSignedIn() when _hasPkceCode is true.
   If Supabase fires SIGNED_IN before PASSWORD_RECOVERY in PKCE flow,
   user goes to dashboard. Fix: also guard SIGNED_IN with !_hasPkceCode.

2. loginMsg is inside panelSignIn. PASSWORD_RECOVERY hides panelSignIn,
   which also hides loginMsg (and the "set password for email" message).
   Fix: put email + status messages directly inside panelReset, not loginMsg.

3. updatePassword() writes to loginMsg (hidden when in recovery mode).
   Fix: write to a resetMsg div inside panelReset instead.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

fixes = []

# Fix 1: Block SIGNED_IN from calling onSignedIn() when _hasPkceCode is true
fixes.append((
    "        } else if (event === 'SIGNED_IN' && session && !_isRecovery) {\n          await onSignedIn(session);",
    "        } else if (event === 'SIGNED_IN' && session && !_isRecovery && !_hasPkceCode) {\n          await onSignedIn(session);",
    "SIGNED_IN: block when _hasPkceCode"
))

# Fix 2: PASSWORD_RECOVERY handler — put email + form inside panelReset (not loginMsg)
# loginMsg is inside panelSignIn which gets hidden, making the message invisible
fixes.append((
    """        if (event === 'PASSWORD_RECOVERY') {
          _isRecovery = true; // block SIGNED_IN (fires after this) from sending to dashboard
          var _recEmail = session && session.user ? session.user.email : '';
          document.getElementById('loginScreen').style.display = 'block';
          document.getElementById('loginMsg').innerHTML =
            '<div class="tl-msg success" style="margin-bottom:16px;">Set a new password for <strong>' + escHtml(_recEmail) + '</strong></div>';
          document.getElementById('panelSignIn').style.display = 'none';
          document.getElementById('panelCreate').style.display = 'none';
          document.getElementById('panelReset').innerHTML =
            '<div class="tl-field"><label>New password</label>' +
            '<input type="password" id="newPassword" placeholder="At least 8 characters" autocomplete="new-password" /></div>' +
            '<div class="tl-field"><label>Confirm new password</label>' +
            '<input type="password" id="newPasswordConfirm" placeholder="Type it again" autocomplete="new-password" /></div>' +
            '<button class="tl-btn tl-btn-full" onclick="updatePassword()">Set New Password</button>';
          document.getElementById('panelReset').style.display = 'block';
          _session = session;""",
    """        if (event === 'PASSWORD_RECOVERY') {
          _isRecovery = true; // block SIGNED_IN (fires after this) from sending to dashboard
          var _recEmail = session && session.user ? session.user.email : '';
          document.getElementById('loginScreen').style.display = 'block';
          document.getElementById('loginMsg').innerHTML = ''; // clear sign-in errors
          document.getElementById('panelSignIn').style.display = 'none';
          document.getElementById('panelCreate').style.display = 'none';
          // Email + form + status msg all inside panelReset so they stay visible
          document.getElementById('panelReset').innerHTML =
            '<div class="tl-msg success" style="margin-bottom:16px;">Setting a new password for <strong>' + escHtml(_recEmail) + '</strong></div>' +
            '<div class="tl-field"><label>New password</label>' +
            '<input type="password" id="newPassword" placeholder="At least 8 characters" autocomplete="new-password" /></div>' +
            '<div class="tl-field"><label>Confirm new password</label>' +
            '<input type="password" id="newPasswordConfirm" placeholder="Type it again" autocomplete="new-password" /></div>' +
            '<button class="tl-btn tl-btn-full" onclick="updatePassword()">Set New Password</button>' +
            '<div id="resetMsg" style="margin-top:10px;"></div>';
          document.getElementById('panelReset').style.display = 'block';
          _session = session;""",
    "PASSWORD_RECOVERY: email+form inside panelReset, resetMsg for status"
))

# Fix 3: updatePassword() — write to resetMsg (inside panelReset) not loginMsg (hidden)
fixes.append((
    """    async function updatePassword() {
      var password  = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
      var confirm   = document.getElementById('newPasswordConfirm') ? document.getElementById('newPasswordConfirm').value : password;
      var msgEl     = document.getElementById('loginMsg');""",
    """    async function updatePassword() {
      var password  = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
      var confirm   = document.getElementById('newPasswordConfirm') ? document.getElementById('newPasswordConfirm').value : password;
      var msgEl     = document.getElementById('resetMsg') || document.getElementById('loginMsg');""",
    "updatePassword: use resetMsg (inside panelReset) for status"
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
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:400])
print("Done.")
