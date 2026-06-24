"""
LUCIUS — Fix password recovery for PKCE flow

Root cause: Supabase uses PKCE by default. Recovery links redirect to
/portal?code=... (query param), NOT #type=recovery (hash). My previous
fix only checked window.location.hash for 'type=recovery', which is
empty in PKCE flow. So _isRecovery = false, getSession() returns a
session from the code exchange, and onSignedIn() sends the user to the
dashboard. PASSWORD_RECOVERY event fires later but it's too late.

Fix:
1. Detect PKCE ?code= param in URL (_hasPkceCode)
2. If PKCE code present, do NOT call onSignedIn() from getSession() return
3. Set _isRecovery = true inside PASSWORD_RECOVERY handler so SIGNED_IN
   event (which fires after PASSWORD_RECOVERY) can't override and take
   user to dashboard
4. Show loginScreen as placeholder while waiting for PASSWORD_RECOVERY event
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = """      // Detect recovery link in hash BEFORE getSession processes it
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

new = """      // Detect recovery flow from URL — Supabase uses PKCE by default:
      // implicit flow → #access_token=...&type=recovery (hash)
      // PKCE flow    → ?code=... (query param, type unknown until event fires)
      var _hashParams  = new URLSearchParams(window.location.hash.slice(1));
      var _isRecovery  = _hashParams.get('type') === 'recovery'; // implicit flow only
      var _hasPkceCode = new URLSearchParams(window.location.search).has('code'); // PKCE

      // Register listener FIRST — before getSession() triggers code exchange
      _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
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
          _session = session;
        } else if (event === 'SIGNED_IN' && session && !_isRecovery) {
          await onSignedIn(session);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          _session = session;
        } else if (event === 'SIGNED_OUT') {
          location.reload();
        }
      });

      // getSession() triggers PKCE code exchange if ?code= is in URL
      const { data: { session } } = await _supabase.auth.getSession();
      if (session && !_isRecovery && !_hasPkceCode) {
        // Normal existing session — go straight to dashboard
        await onSignedIn(session);
      } else if (_hasPkceCode) {
        // PKCE code in URL — PASSWORD_RECOVERY or SIGNED_IN event will handle UI
        // Show login screen as placeholder; the event handler updates it
        document.getElementById('loginScreen').style.display = 'block';
      } else {
        // No session, or implicit recovery — show login screen
        document.getElementById('loginScreen').style.display = 'block';
      }"""

count = src.count(old)
if count == 0:
    print("MISS: auth init block not found — check for whitespace changes")
else:
    src = src.replace(old, new, 1)
    print(f"OK: auth init block replaced ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:400])
print("Done.")
