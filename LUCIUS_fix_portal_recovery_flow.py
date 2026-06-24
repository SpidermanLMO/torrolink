"""
LUCIUS — Fix portal password recovery flow

Root cause: onAuthStateChange listener registered AFTER getSession() call.
Supabase v2 processes the recovery token in getSession(), returns a session,
so our code calls onSignedIn() and sends user to dashboard — listener misses
the PASSWORD_RECOVERY event entirely.

Fix:
1. Register onAuthStateChange FIRST (before getSession)
2. Detect recovery link via URL hash and skip onSignedIn if recovery flow
3. Show new-password form with email (readonly), new password, confirm password
4. updatePassword() validates confirm field + signs user in after success
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ── Replace the auth init block ──────────────────────────────────────────────
old = """      // Handle magic-link callback (hash contains access_token)
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        await onSignedIn(session);
      } else {
        document.getElementById('loginScreen').style.display = 'block';
      }
      // Listen for auth state changes (password reset redirect, etc.)
      _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await onSignedIn(session);
        } else if (event === 'PASSWORD_RECOVERY') {
          // User clicked the reset link — show a new password form
          document.getElementById('loginScreen').style.display = 'block';
          document.getElementById('loginMsg').innerHTML =
            '<div class="tl-msg success" style="margin-bottom:16px;">Enter a new password below.</div>';
          document.getElementById('panelSignIn').style.display = 'none';
          document.getElementById('panelCreate').style.display = 'none';
          document.getElementById('panelReset').innerHTML =
            '<div class="tl-field"><label>New password</label>' +
            '<input type="password" id="newPassword" placeholder="At least 8 characters" /></div>' +
            '<button class="tl-btn tl-btn-full" onclick="updatePassword()">Set New Password</button>';
          document.getElementById('panelReset').style.display = 'block';
        } else if (event === 'TOKEN_REFRESHED' && session) {
          _session = session; // keep access_token current after auto-refresh
        } else if (event === 'SIGNED_OUT') {
          location.reload();
        }
      });"""

new = """      // Detect recovery link in hash BEFORE getSession processes it
      var _hashParams = new URLSearchParams(window.location.hash.slice(1));
      var _isRecovery = _hashParams.get('type') === 'recovery';

      // Register listener FIRST — getSession() fires events synchronously on next tick
      _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Show new-password form with email + confirm field
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
          _session = session; // store so updateUser works
        } else if (event === 'SIGNED_IN' && session && !_isRecovery) {
          await onSignedIn(session);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          _session = session;
        } else if (event === 'SIGNED_OUT') {
          location.reload();
        }
      });

      // Now call getSession — if recovery token in hash, skip onSignedIn
      const { data: { session } } = await _supabase.auth.getSession();
      if (session && !_isRecovery) {
        await onSignedIn(session);
      } else if (!session && !_isRecovery) {
        document.getElementById('loginScreen').style.display = 'block';
      } else if (_isRecovery) {
        // loginScreen shown by PASSWORD_RECOVERY event above
        document.getElementById('loginScreen').style.display = 'block';
      }"""

count = src.count(old)
if count == 0:
    print("MISS: auth init block not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: auth init block replaced ({count} match)")

# ── Update updatePassword() to validate confirm field ────────────────────────
old2 = """    async function updatePassword() {
      const password = document.getElementById('newPassword').value;
      const msgEl    = document.getElementById('loginMsg');
      if (!password || password.length < 8) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must be at least 8 characters.</div>'; return;
      }
      const { data: updData, error } = await _supabase.auth.updateUser({ password });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      } else {
        msgEl.innerHTML = '<div class="tl-msg success">Password set! Taking you to your profile…</div>';
        const { data: { session: freshSession } } = await _supabase.auth.getSession();
        if (freshSession) {
          setTimeout(() => onSignedIn(freshSession), 800);
        } else {
          setTimeout(() => location.reload(), 900);
        }
      }
    }"""

new2 = """    async function updatePassword() {
      var password  = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
      var confirm   = document.getElementById('newPasswordConfirm') ? document.getElementById('newPasswordConfirm').value : password;
      var msgEl     = document.getElementById('loginMsg');
      if (!password || password.length < 8) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must be at least 8 characters.</div>'; return;
      }
      if (password !== confirm) {
        msgEl.innerHTML = '<div class="tl-msg error">Passwords don\\'t match — please re-enter.</div>'; return;
      }
      msgEl.innerHTML = '<div class="tl-msg">Saving…</div>';
      const { error } = await _supabase.auth.updateUser({ password });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      } else {
        msgEl.innerHTML = '<div class="tl-msg success">Password set! Taking you to your profile…</div>';
        _isRecovery = false; // allow SIGNED_IN to proceed now
        const { data: { session: freshSession } } = await _supabase.auth.getSession();
        if (freshSession) {
          setTimeout(() => onSignedIn(freshSession), 800);
        } else {
          setTimeout(() => location.reload(), 900);
        }
      }
    }"""

count2 = src.count(old2)
if count2 == 0:
    print("MISS: updatePassword not found")
else:
    src = src.replace(old2, new2, 1)
    print(f"OK: updatePassword with confirm field ({count2} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:400])
print("Done.")
