// ================================================
// TORROLINK — SET PASSWORD PAGE
// GET /set-password
// Dedicated page for password reset links.
// Supabase recovery links redirect here.
// No event detection — if you land here, you're resetting.
// ================================================

const SUPABASE_URL  = process.env.SUPABASE_URL  || "";
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || "";
const SITE          = process.env.DEPLOY_URL || "https://torrolink.com";

exports.handler = async () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Set New Password — Torrolink</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{background:#fff;border-radius:16px;padding:40px 32px;width:100%;max-width:400px;box-shadow:0 2px 24px rgba(0,0,0,0.07);}
    .logo{text-align:center;margin-bottom:28px;}
    .logo a{font-size:1.5rem;font-weight:800;color:#0f6b6b;text-decoration:none;letter-spacing:-0.5px;}
    h1{font-size:1.25rem;font-weight:700;color:#1a2e2e;margin-bottom:6px;text-align:center;}
    .sub{font-size:0.9rem;color:#666;text-align:center;margin-bottom:28px;}
    .email-badge{background:#e8f5f0;border-radius:8px;padding:10px 14px;font-size:0.9rem;color:#0a4d4d;font-weight:600;text-align:center;margin-bottom:24px;word-break:break-all;}
    label{display:block;font-size:0.85rem;font-weight:600;color:#444;margin-bottom:6px;}
    input[type=password]{width:100%;padding:12px 14px;border:1.5px solid #dde;border-radius:10px;font-size:1rem;color:#1a2e2e;outline:none;transition:border 0.15s;}
    input[type=password]:focus{border-color:#0f6b6b;}
    .field{margin-bottom:18px;}
    .btn{width:100%;background:#0f6b6b;color:#fff;border:none;border-radius:10px;padding:14px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:4px;transition:background 0.15s;}
    .btn:hover{background:#0a4d4d;}
    .btn:disabled{background:#aaa;cursor:not-allowed;}
    .msg{border-radius:8px;padding:12px 14px;font-size:0.9rem;margin-top:16px;text-align:center;}
    .msg.success{background:#e8f5f0;color:#0a4d4d;}
    .msg.error{background:#fef2f2;color:#c0392b;}
    .msg.info{background:#f0f4f4;color:#555;}
    #loading{text-align:center;color:#888;font-size:0.95rem;padding:20px 0;}
    #form{display:none;}
    #expired{display:none;text-align:center;}
    .expired-icon{font-size:2.5rem;margin-bottom:12px;}
    .back-link{display:block;text-align:center;margin-top:20px;font-size:0.875rem;color:#0f6b6b;text-decoration:none;}
    .back-link:hover{text-decoration:underline;}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><a href="${SITE}">Torrolink</a></div>

    <div id="loading">Verifying your link…</div>

    <div id="form">
      <h1>Set new password</h1>
      <p class="sub">Choose a strong password for your account.</p>
      <div id="emailBadge" class="email-badge"></div>
      <div class="field">
        <label for="pw1">New password</label>
        <input type="password" id="pw1" placeholder="At least 8 characters" autocomplete="new-password" />
      </div>
      <div class="field">
        <label for="pw2">Confirm new password</label>
        <input type="password" id="pw2" placeholder="Type it again" autocomplete="new-password" />
      </div>
      <button class="btn" id="submitBtn" onclick="setPassword()">Set New Password</button>
      <div id="pwMsg"></div>
    </div>

    <div id="expired">
      <div class="expired-icon">🔗</div>
      <h1>Link expired</h1>
      <p class="sub" style="margin-bottom:20px;">Password reset links expire after 1 hour or after use. Request a new one from the portal.</p>
      <a href="${SITE}/portal" class="btn" style="display:inline-block;text-decoration:none;padding:12px 24px;border-radius:10px;">Go to Portal</a>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
    var _sb = window.supabase.createClient('${SUPABASE_URL}', '${SUPABASE_ANON}');
    var _session = null;

    async function init() {
      try {
        var result = await _sb.auth.getSession();
        var session = result && result.data && result.data.session;
        if (session && session.user) {
          _session = session;
          var email = session.user.email || '';
          document.getElementById('emailBadge').textContent = email;
          document.getElementById('loading').style.display = 'none';
          document.getElementById('form').style.display = 'block';
        } else {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('expired').style.display = 'block';
        }
      } catch(e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('expired').style.display = 'block';
      }
    }

    async function setPassword() {
      var pw1 = document.getElementById('pw1').value;
      var pw2 = document.getElementById('pw2').value;
      var msg = document.getElementById('pwMsg');
      var btn = document.getElementById('submitBtn');

      if (!pw1 || pw1.length < 8) {
        msg.innerHTML = '<div class="msg error">Password must be at least 8 characters.</div>';
        return;
      }
      if (pw1 !== pw2) {
        msg.innerHTML = '<div class="msg error">Passwords don\\'t match — try again.</div>';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';
      msg.innerHTML = '';

      var result = await _sb.auth.updateUser({ password: pw1 });
      if (result.error) {
        msg.innerHTML = '<div class="msg error">' + (result.error.message || 'Something went wrong.') + '</div>';
        btn.disabled = false;
        btn.textContent = 'Set New Password';
      } else {
        msg.innerHTML = '<div class="msg success">Password set! Taking you to your profile…</div>';
        setTimeout(function() { window.location.href = '${SITE}/portal'; }, 1200);
      }
    }

    init();
  </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
    body: html,
  };
};
