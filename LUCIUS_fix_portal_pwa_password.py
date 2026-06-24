"""
LUCIUS — Portal: PWA manifest + Change Password

1. Add manifest link, theme-color, apple-touch-icon, SW registration to <head>
2. Add "Change Password" button to top bar (visible when signed in)
3. Add changePassword() function + modal UI
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

fixes = []

# ── 1. Add to <head>: manifest + theme-color + apple-touch-icon + SW registration
old1 = '''  <link rel="stylesheet" href="/styles.css" />'''
new1 = '''  <link rel="stylesheet" href="/styles.css" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0f6b6b" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />'''
fixes.append((old1, new1, "head: manifest + theme-color + apple-touch-icon"))

# ── 2. Add Change Password button in topbar (after signOutBtn)
old2 = '    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:6px;">Sign out</button>'
new2 = '''    <button onclick="showChangePwModal()" id="changePwBtn" style="display:none;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.20);color:rgba(255,255,255,0.75);font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:6px;">&#128274; Password</button>
    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:6px;">Sign out</button>
  <!-- Change Password modal -->
  <div id="changePwModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:14px;padding:32px 28px;max-width:380px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
      <h3 style="margin:0 0 6px;color:#0a4d4d;">Set a Password</h3>
      <p style="margin:0 0 20px;font-size:0.88rem;color:#666;">Choose a password you\'ll use to sign in from now on.</p>
      <div id="changePwMsg"></div>
      <input type="password" id="changePwInput" placeholder="New password (8+ chars)" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;margin-bottom:10px;" />
      <input type="password" id="changePwConfirm" placeholder="Confirm password" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:0.95rem;margin-bottom:16px;" />
      <div style="display:flex;gap:10px;">
        <button onclick="submitChangePassword()" style="flex:1;background:#0f6b6b;color:#fff;border:none;padding:11px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.95rem;">Set Password</button>
        <button onclick="closeChangePwModal()" style="background:#f0f0f0;border:none;padding:11px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
      </div>
    </div>
  </div>'''
fixes.append((old2, new2, "topbar: change password button + modal"))

# ── 3. Show changePwBtn when signed in (alongside signOutBtn)
old3 = "      document.getElementById('signOutBtn').style.display = 'inline-block';"
new3 = "      document.getElementById('signOutBtn').style.display = 'inline-block';\n      document.getElementById('changePwBtn').style.display = 'inline-block';"
fixes.append((old3, new3, "show changePwBtn on sign-in"))

# ── 4. Add changePassword functions before signOut
old4 = "    async function signOut() {"
new4 = '''    function showChangePwModal() {
      document.getElementById('changePwMsg').innerHTML = '';
      document.getElementById('changePwInput').value = '';
      document.getElementById('changePwConfirm').value = '';
      document.getElementById('changePwModal').style.display = 'flex';
    }
    function closeChangePwModal() {
      document.getElementById('changePwModal').style.display = 'none';
    }
    async function submitChangePassword() {
      var pw  = document.getElementById('changePwInput').value;
      var pw2 = document.getElementById('changePwConfirm').value;
      var msg = document.getElementById('changePwMsg');
      if (!pw || pw.length < 8) {
        msg.innerHTML = '<div class="tl-msg error" style="margin-bottom:12px;">Password must be at least 8 characters.</div>'; return;
      }
      if (pw !== pw2) {
        msg.innerHTML = '<div class="tl-msg error" style="margin-bottom:12px;">Passwords don\'t match.</div>'; return;
      }
      msg.innerHTML = '<div class="tl-msg" style="margin-bottom:12px;">Saving…</div>';
      var result = await _supabase.auth.updateUser({ password: pw });
      if (result.error) {
        msg.innerHTML = '<div class="tl-msg error" style="margin-bottom:12px;">' + escHtml(result.error.message) + '</div>';
      } else {
        msg.innerHTML = '<div class="tl-msg success" style="margin-bottom:12px;">Password set! You\'re all set.</div>';
        setTimeout(closeChangePwModal, 1400);
      }
    }
    async function signOut() {'''
fixes.append((old4, new4, "changePassword functions"))

# ── 5. Register service worker in PWA install section
old5 = "// ── PWA install banner ──────────────────────────────────────────────────────"
new5 = '''// ── Service worker registration ─────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function(){});
      });
    }

// ── PWA install banner ──────────────────────────────────────────────────────'''
fixes.append((old5, new5, "service worker registration"))

# Apply all fixes
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
