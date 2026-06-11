// ================================================
// TORROLINK — CUSTOMER PORTAL
// GET  /portal  → serves the portal HTML (login + profile editor)
// Auth: Supabase magic-link (OTP), client-side via Supabase JS CDN
// After login, the client calls /portal-save to persist changes
// ================================================

exports.handler = async () => {
  const SUPABASE_URL      = process.env.SUPABASE_URL      || "";
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

  const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Profile — Torrolink</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <style>
    .links-list { list-style: none; padding: 0; margin: 0 0 12px; }
    .links-list li {
      display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
    }
    .links-list input { flex: 1; }
    .links-list .rm-btn {
      background: none; border: 1.5px solid #e2e6ea; border-radius: 6px;
      color: #999; cursor: pointer; padding: 6px 10px; font-size: 1rem;
      transition: color 0.15s, border-color 0.15s;
    }
    .links-list .rm-btn:hover { color: #c0392b; border-color: #c0392b; }
    .add-link-btn {
      background: none; border: 1.5px dashed #c0d8d8; border-radius: 8px;
      color: #0f6b6b; font-weight: 600; font-size: 0.9rem; cursor: pointer;
      padding: 9px 16px; width: 100%; font-family: inherit;
      transition: background 0.15s;
    }
    .add-link-btn:hover { background: #edf8f8; }
    .socials-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .tl-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .tl-avatar {
      width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
      border: 2px solid #e2e6ea; background: #f4f6f8;
    }
    .tl-avatar-placeholder {
      width: 72px; height: 72px; border-radius: 50%; background: #edf8f8;
      border: 2px solid #c0d8d8; display: flex; align-items: center;
      justify-content: center; font-size: 1.8rem; color: #0f6b6b; flex-shrink: 0;
    }
    .file-btn {
      display: inline-block; padding: 8px 16px;
      border: 1.5px solid #0f6b6b; border-radius: 8px;
      color: #0f6b6b; font-weight: 600; font-size: 0.85rem;
      cursor: pointer; font-family: inherit; background: none;
      transition: background 0.15s;
    }
    .file-btn:hover { background: #edf8f8; }
    #fileInput { display: none; }
    .section-tabs { display: flex; gap: 4px; margin-bottom: 24px; flex-wrap: wrap; }
    .tab-btn {
      padding: 8px 18px; border-radius: 8px; border: 1.5px solid #e2e6ea;
      background: none; font-family: inherit; font-size: 0.88rem; font-weight: 600;
      color: #666; cursor: pointer; transition: all 0.15s;
    }
    .tab-btn.active { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }
    @media (max-width: 480px) { .socials-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body class="tl-page">

  <div class="tl-topbar">
    <a href="/" class="logo">Torrolink</a>
    <span id="topbarHandle" style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-left:auto;"></span>
    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.15);border:none;color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:8px;">Sign out</button>
  </div>

  <div class="tl-content">

    <!-- LOGIN SCREEN -->
    <div id="loginScreen" class="tl-card" style="max-width:420px;margin:60px auto;">
      <h2 style="margin-bottom:6px;">Sign in to your portal</h2>
      <p style="font-size:0.9rem;color:#666;margin-bottom:24px;">We'll email you a sign-in link — no password needed.</p>
      <div id="loginMsg"></div>
      <div class="tl-field">
        <label for="loginEmail">Email address</label>
        <input type="email" id="loginEmail" placeholder="you@yourbusiness.com" autocomplete="email" />
      </div>
      <button class="tl-btn tl-btn-full" onclick="sendMagicLink()">Send Sign-In Link</button>
      <p style="font-size:0.8rem;color:#999;margin-top:14px;text-align:center;">Use the same email you used when you purchased.</p>
    </div>

    <!-- EDITOR SCREEN (hidden until logged in) -->
    <div id="editorScreen" style="display:none;">

      <div id="saveMsg"></div>

      <div class="section-tabs">
        <button class="tab-btn active" onclick="switchTab('profile')">Profile</button>
        <button class="tab-btn" onclick="switchTab('links')">Links &amp; Socials</button>
        <button class="tab-btn" onclick="switchTab('qr')">My QR Code</button>
      </div>

      <!-- PROFILE TAB -->
      <div id="tab-profile" class="tab-panel active">
        <div class="tl-card">
          <h2>Profile details</h2>
          <div class="tl-avatar-row">
            <div id="avatarPreview" class="tl-avatar-placeholder">🏢</div>
            <div>
              <label class="file-btn" for="fileInput">Upload logo / photo</label>
              <input type="file" id="fileInput" accept="image/*" onchange="handleImageUpload(this)" />
              <p style="font-size:0.78rem;color:#999;margin-top:6px;">PNG or JPG. Appears at top of your profile page.</p>
            </div>
          </div>
          <div class="tl-field">
            <label>Business name</label>
            <input type="text" id="fieldBusinessName" placeholder="e.g. Mike's Plumbing LLC" />
          </div>
          <div class="tl-field">
            <label>Tagline <span style="color:#999;font-weight:400;">(short — shows under your name)</span></label>
            <input type="text" id="fieldTagline" placeholder="e.g. Trusted plumbing since 2005" />
          </div>
          <div class="tl-field">
            <label>Bio / About</label>
            <textarea id="fieldBio" rows="4" placeholder="Tell visitors who you are, what you do, and why they should choose you."></textarea>
          </div>
          <div class="tl-field">
            <label>Phone number</label>
            <input type="tel" id="fieldPhone" placeholder="(555) 867-5309" />
          </div>
          <div class="tl-field">
            <label>Video URL <span style="color:#999;font-weight:400;">(YouTube or Vimeo — optional intro video)</span></label>
            <input type="url" id="fieldVideo" placeholder="https://youtube.com/watch?v=..." />
          </div>
        </div>
      </div>

      <!-- LINKS & SOCIALS TAB -->
      <div id="tab-links" class="tab-panel">
        <div class="tl-card">
          <h2>Custom links</h2>
          <p style="font-size:0.88rem;color:#666;margin-bottom:16px;">Add any links you want on your profile — booking page, menu, portfolio, etc.</p>
          <ul id="linksList" class="links-list"></ul>
          <button class="add-link-btn" onclick="addLink()">+ Add a link</button>
        </div>
        <div class="tl-card">
          <h2>Social profiles</h2>
          <div class="socials-grid">
            <div class="tl-field"><label>Instagram</label><input type="text" id="socInstagram" placeholder="@yourhandle" /></div>
            <div class="tl-field"><label>Facebook</label><input type="url" id="socFacebook" placeholder="facebook.com/yourpage" /></div>
            <div class="tl-field"><label>TikTok</label><input type="text" id="socTiktok" placeholder="@yourhandle" /></div>
            <div class="tl-field"><label>YouTube</label><input type="url" id="socYoutube" placeholder="youtube.com/yourchannel" /></div>
            <div class="tl-field"><label>LinkedIn</label><input type="url" id="socLinkedin" placeholder="linkedin.com/in/you" /></div>
            <div class="tl-field"><label>Twitter / X</label><input type="text" id="socTwitter" placeholder="@yourhandle" /></div>
            <div class="tl-field"><label>Yelp</label><input type="url" id="socYelp" placeholder="yelp.com/biz/yourpage" /></div>
            <div class="tl-field"><label>Google Business</label><input type="url" id="socGoogle" placeholder="maps.google.com/..." /></div>
          </div>
        </div>
      </div>

      <!-- QR TAB -->
      <div id="tab-qr" class="tab-panel">
        <div class="tl-card" style="text-align:center;">
          <h2 style="text-align:left;">Your QR code</h2>
          <p style="font-size:0.9rem;color:#666;margin-bottom:20px;text-align:left;">This is your permanent QR code. Right-click → Save image to download.</p>
          <div id="qrPlaceholder" style="background:#f4f6f8;border-radius:12px;padding:40px;margin-bottom:20px;">
            <p style="color:#888;">Loading your QR code…</p>
          </div>
          <div id="profileUrlRow" style="text-align:left;background:#edf8f8;border-radius:8px;padding:14px 16px;">
            <p style="font-size:0.8rem;color:#888;margin-bottom:4px;">Your profile page URL</p>
            <a id="profileUrlLink" href="#" style="color:#0f6b6b;font-weight:700;word-break:break-all;"></a>
          </div>
        </div>
      </div>

      <!-- SAVE BUTTON (always visible) -->
      <div style="text-align:right;margin-top:8px;">
        <button class="tl-btn tl-btn-teal" onclick="saveProfile()">Save Changes</button>
      </div>

    </div>
  </div>

  <script>
    // ── Supabase init ──────────────────────────────────────────────
    const _supabase = window.supabase.createClient('${SUPABASE_URL}', '${SUPABASE_ANON_KEY}');
    let _session   = null;
    let _profile   = null;
    let _logoBase64 = null; // new logo if uploaded

    // ── Boot ───────────────────────────────────────────────────────
    (async () => {
      // Handle magic-link callback (hash contains access_token)
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        await onSignedIn(session);
      } else {
        document.getElementById('loginScreen').style.display = 'block';
      }
      // Listen for auth changes (magic link click)
      _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await onSignedIn(session);
        } else if (event === 'SIGNED_OUT') {
          location.reload();
        }
      });
    })();

    // ── Auth ───────────────────────────────────────────────────────
    async function sendMagicLink() {
      const email = document.getElementById('loginEmail').value.trim();
      const msgEl = document.getElementById('loginMsg');
      if (!email) { msgEl.innerHTML = '<div class="tl-msg error">Please enter your email.</div>'; return; }
      msgEl.innerHTML = '<div class="tl-msg">Sending…</div>';
      const { error } = await _supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '/portal' },
      });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      } else {
        msgEl.innerHTML = '<div class="tl-msg success">Check your email — we sent you a sign-in link! It expires in 1 hour.</div>';
      }
    }

    async function signOut() {
      await _supabase.auth.signOut();
    }

    // ── After sign-in ──────────────────────────────────────────────
    async function onSignedIn(session) {
      _session = session;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('editorScreen').style.display = 'block';
      document.getElementById('signOutBtn').style.display = 'inline-block';

      // Load profile for this customer email
      const email = session.user.email;
      const { data: customer } = await _supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!customer) {
        showMsg('error', 'No account found for ' + escHtml(email) + '. Use the email you purchased with.');
        return;
      }

      const { data: profile } = await _supabase
        .from('profiles')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!profile) {
        showMsg('error', 'No profile found. Contact hello@torrolink.com for help.');
        return;
      }

      _profile = profile;
      populateEditor(profile);
    }

    // ── Populate form fields ───────────────────────────────────────
    function populateEditor(p) {
      document.getElementById('topbarHandle').textContent = '@' + p.handle;
      document.getElementById('fieldBusinessName').value = p.business_name || '';
      document.getElementById('fieldTagline').value      = p.tagline       || '';
      document.getElementById('fieldBio').value          = p.bio           || '';
      document.getElementById('fieldPhone').value        = p.phone         || '';
      document.getElementById('fieldVideo').value        = p.video_url     || '';

      // Logo
      if (p.logo_url) {
        const img = document.createElement('img');
        img.src = p.logo_url; img.className = 'tl-avatar';
        document.getElementById('avatarPreview').replaceWith(img);
        img.id = 'avatarPreview';
      }

      // Links
      const links = Array.isArray(p.links) ? p.links : [];
      links.forEach(l => addLink(l.label, l.url));

      // Socials
      const s = p.socials || {};
      document.getElementById('socInstagram').value = s.instagram || '';
      document.getElementById('socFacebook').value  = s.facebook  || '';
      document.getElementById('socTiktok').value    = s.tiktok    || '';
      document.getElementById('socYoutube').value   = s.youtube   || '';
      document.getElementById('socLinkedin').value  = s.linkedin  || '';
      document.getElementById('socTwitter').value   = s.twitter   || '';
      document.getElementById('socYelp').value      = s.yelp      || '';
      document.getElementById('socGoogle').value    = s.google    || '';

      // QR tab
      const qrUrl = window.location.origin + '/q/' + p.code;
      document.getElementById('qrPlaceholder').innerHTML =
        '<img src="https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(qrUrl) +
        '&size=300x300&color=0a4d4d&margin=2" style="border-radius:8px;max-width:240px;" alt="Your QR code" />';
      const profileUrl = window.location.origin + '/p/' + p.handle;
      const link = document.getElementById('profileUrlLink');
      link.href = profileUrl; link.textContent = profileUrl;
    }

    // ── Links management ───────────────────────────────────────────
    function addLink(label = '', url = '') {
      const li = document.createElement('li');
      li.innerHTML =
        '<input type="text"  placeholder="Label (e.g. Book Now)" value="' + escAttr(label) + '" class="link-label" />' +
        '<input type="url"   placeholder="https://..." value="' + escAttr(url) + '" class="link-url" />' +
        '<button class="rm-btn" onclick="this.parentElement.remove()" title="Remove">✕</button>';
      document.getElementById('linksList').appendChild(li);
    }

    function getLinks() {
      return Array.from(document.querySelectorAll('#linksList li')).map(li => ({
        label: li.querySelector('.link-label').value.trim(),
        url:   li.querySelector('.link-url').value.trim(),
      })).filter(l => l.label || l.url);
    }

    // ── Image upload ───────────────────────────────────────────────
    function handleImageUpload(input) {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) { alert('Image must be under 4 MB.'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        _logoBase64 = e.target.result;
        const el = document.getElementById('avatarPreview');
        if (el.tagName === 'IMG') {
          el.src = _logoBase64;
        } else {
          const img = document.createElement('img');
          img.src = _logoBase64; img.className = 'tl-avatar'; img.id = 'avatarPreview';
          el.replaceWith(img);
        }
      };
      reader.readAsDataURL(file);
    }

    // ── Save profile ───────────────────────────────────────────────
    async function saveProfile() {
      if (!_session || !_profile) return;
      showMsg('', '');
      const btn = document.querySelector('[onclick="saveProfile()"]');
      btn.textContent = 'Saving…'; btn.disabled = true;

      const payload = {
        profileId:    _profile.id,
        businessName: document.getElementById('fieldBusinessName').value.trim(),
        tagline:      document.getElementById('fieldTagline').value.trim(),
        bio:          document.getElementById('fieldBio').value.trim(),
        phone:        document.getElementById('fieldPhone').value.trim(),
        videoUrl:     document.getElementById('fieldVideo').value.trim(),
        links:        getLinks(),
        socials: {
          instagram: document.getElementById('socInstagram').value.trim(),
          facebook:  document.getElementById('socFacebook').value.trim(),
          tiktok:    document.getElementById('socTiktok').value.trim(),
          youtube:   document.getElementById('socYoutube').value.trim(),
          linkedin:  document.getElementById('socLinkedin').value.trim(),
          twitter:   document.getElementById('socTwitter').value.trim(),
          yelp:      document.getElementById('socYelp').value.trim(),
          google:    document.getElementById('socGoogle').value.trim(),
        },
        logoBase64: _logoBase64 || null,
      };

      try {
        const res = await fetch('/.netlify/functions/portal-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + _session.access_token,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          _logoBase64 = null; // clear after successful save
          showMsg('success', '✓ Profile saved! Changes are live on your profile page.');
        } else {
          showMsg('error', data.error || 'Save failed. Please try again.');
        }
      } catch (err) {
        showMsg('error', 'Network error. Please try again.');
      }

      btn.textContent = 'Save Changes'; btn.disabled = false;
    }

    // ── Tab switching ──────────────────────────────────────────────
    function switchTab(name) {
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        const tabs = ['profile', 'links', 'qr'];
        b.classList.toggle('active', tabs[i] === name);
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
    }

    // ── Helpers ────────────────────────────────────────────────────
    function showMsg(type, text) {
      const el = document.getElementById('saveMsg');
      if (!text) { el.innerHTML = ''; return; }
      el.innerHTML = '<div class="tl-msg ' + type + '">' + text + '</div>';
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function escHtml(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function escAttr(s) {
      return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
  </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
