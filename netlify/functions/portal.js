// ================================================
// TORROLINK — CUSTOMER PORTAL
// GET  /portal  → serves the portal HTML (login + profile editor)
// Auth: Supabase email + password, client-side via Supabase JS CDN
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.min.js"></script>
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
        .content-type-btn {
      padding: 7px 13px; border-radius: 20px; border: 1.5px solid #e0e0e8;
      background: #fff; cursor: pointer; font-size: 0.82rem; font-weight: 600;
      color: #555; transition: all 0.15s; font-family: inherit;
    }
    .content-type-btn.active { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .tl-inline-input {
      padding: 10px 12px; border: 1.5px solid #e0e0e8; border-radius: 10px;
      font-size: 0.9rem; font-family: inherit; outline: none;
      transition: border-color 0.2s; background: #fafafa; box-sizing: border-box;
    }
    .tl-inline-input:focus { border-color: #0f6b6b; }
    .rev-action-btn {
      padding: 5px 12px; border-radius: 20px; border: none;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .content-type-badge {
      display: inline-block; font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; padding: 2px 8px; border-radius: 20px; margin-right: 6px;
    }
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
    #fileInput, #headshotInput { display: none; }
    .checkbox-list { list-style: none; padding: 0; margin: 0 0 8px; }
    .checkbox-list li { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .checkbox-list input { flex: 1; }
    .checkbox-list .rm-btn {
      background: none; border: 1.5px solid #e2e6ea; border-radius: 6px;
      color: #999; cursor: pointer; padding: 6px 10px; font-size: 1rem;
      transition: color 0.15s, border-color 0.15s;
    }
    .checkbox-list .rm-btn:hover { color: #c0392b; border-color: #c0392b; }
    .section-tabs {
      display: flex; gap: 4px; margin-bottom: 24px;
      overflow-x: auto; -webkit-overflow-scrolling: touch;
      scrollbar-width: none; padding-bottom: 4px;
    }
    .section-tabs::-webkit-scrollbar { display: none; }
    .tab-btn {
      padding: 8px 16px; border-radius: 8px; border: 1.5px solid #e2e6ea;
      background: none; font-family: inherit; font-size: 0.85rem; font-weight: 600;
      color: #666; cursor: pointer; transition: all 0.15s;
      flex-shrink: 0; white-space: nowrap;
    }
    .tab-btn.active { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .pl-btn {
      flex: 1; padding: 10px 8px; border-radius: 10px; border: 1.5px solid #e2e6ea;
      background: none; font-family: inherit; color: #666; cursor: pointer;
      text-align: center; transition: all 0.15s; line-height: 1.4;
    }
    .pl-btn.active { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .qr-dot-btn {
      padding: 7px 14px; border-radius: 8px; border: 1.5px solid #e2e6ea;
      background: none; font-family: inherit; font-size: 0.85rem; font-weight: 600;
      color: #666; cursor: pointer; transition: all 0.15s;
    }
    .qr-dot-btn.active { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* ── Theme picker ─────────────────────────────── */
    .pattern-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;
    }
    .pattern-swatch {
      height: 64px; border-radius: 10px; cursor: pointer;
      border: 3px solid transparent; position: relative;
      transition: border-color 0.15s, transform 0.15s;
      overflow: hidden;
    }
    .pattern-swatch.selected { border-color: #0f6b6b; transform: scale(1.04); }
    .pattern-swatch span {
      position: absolute; bottom: 4px; left: 0; right: 0;
      text-align: center; font-size: 0.65rem; font-weight: 700;
      color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.6); pointer-events: none;
    }
    .color-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .color-field { flex: 1; min-width: 120px; }
    .color-field label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; margin-bottom: 6px; }
    .color-field input[type="color"] {
      width: 100%; height: 44px; border: 1.5px solid #e2e6ea;
      border-radius: 8px; cursor: pointer; padding: 4px; background: #fff;
    }
    .card-style-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .card-style-btn {
      flex: 1; padding: 10px 8px; border-radius: 8px;
      border: 1.5px solid #e2e6ea; background: none;
      font-family: inherit; font-size: 0.82rem; font-weight: 600;
      color: #666; cursor: pointer; transition: all 0.15s; text-align: center;
    }
    .card-style-btn.selected { background: #0f6b6b; color: #fff; border-color: #0f6b6b; }
    .dark-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      background: #f7f9fa; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
    }
    .dark-toggle-row label { font-size: 0.92rem; font-weight: 600; color: #333; }
    .dark-toggle-row p  { font-size: 0.8rem; color: #888; margin-top: 2px; }
    .toggle-switch { position: relative; width: 48px; height: 26px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; inset: 0; background: #ccc; border-radius: 26px;
      cursor: pointer; transition: background 0.25s;
    }
    .toggle-slider::before {
      content: ''; position: absolute;
      width: 20px; height: 20px; left: 3px; top: 3px;
      background: #fff; border-radius: 50%; transition: transform 0.25s;
    }
    .toggle-switch input:checked + .toggle-slider { background: #0f6b6b; }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(22px); }
    .section-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .sec-toggle {
      display: flex; align-items: center; justify-content: space-between;
      background: #f7f9fa; border-radius: 8px; padding: 10px 12px;
    }
    .sec-toggle span { font-size: 0.85rem; font-weight: 600; color: #333; }
    .theme-preview-btn {
      display: inline-block; margin-top: 12px;
      padding: 9px 20px; background: none;
      border: 1.5px solid #0f6b6b; border-radius: 8px;
      color: #0f6b6b; font-weight: 700; font-size: 0.88rem;
      cursor: pointer; font-family: inherit; text-decoration: none;
      transition: background 0.15s;
    }
    .theme-preview-btn:hover { background: #edf8f8; }
    .theme-note {
      background: #edf8f8; border-radius: 10px; padding: 12px 16px;
      font-size: 0.82rem; color: #0a5555; margin-bottom: 20px;
      border: 1px solid #c0dede;
    }
    @media (max-width: 480px) {
      .socials-grid { grid-template-columns: 1fr; }
      .pattern-grid { grid-template-columns: repeat(3, 1fr); }
      .section-toggles { grid-template-columns: 1fr; }
    }
  </style>
  <style>
    /* ── Gallery tab ──────────────────────────────────────────── */
    .gallery-grid-p { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
    .gallery-item-p { position:relative; }
    .gallery-item-p img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px; display:block; }
    .gallery-badge-p { position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.62); color:#fff; font-size:0.6rem; padding:2px 5px; border-radius:10px; pointer-events:none; }
    .gallery-cap-p { width:100%; font-size:0.72rem; border:1px solid #ddd; border-radius:5px; padding:3px 6px; margin-top:3px; box-sizing:border-box; }
    .gallery-del-p { font-size:0.68rem; color:#c00; background:none; border:none; cursor:pointer; padding:0; margin-top:2px; display:block; }
    .gallery-empty { color:#aaa; font-size:0.85rem; text-align:center; padding:22px 0; grid-column:1/-1; }
    .doc-item-p { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #eee; border-radius:8px; margin-bottom:6px; background:#fafafa; }
    .doc-icon-p { font-size:1.5rem; flex-shrink:0; }
    .doc-body-p { flex:1; min-width:0; }
    .doc-title-p { width:100%; font-size:0.85rem; border:1px solid #ddd; border-radius:5px; padding:4px 8px; box-sizing:border-box; }
    .doc-view-p { font-size:0.7rem; color:#0f6b6b; display:block; margin-top:2px; }
    .doc-del-p { color:#c00; background:none; border:none; cursor:pointer; font-size:0.9rem; flex-shrink:0; }
    .media-msg { font-size:0.8rem; color:#0f6b6b; margin-top:6px; min-height:18px; }
  </style>
</head>
<body class="tl-page">

  <div class="tl-topbar">
    <a href="/" class="logo">Torrolink</a>
    <span id="topbarHandle" style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-left:auto;"></span>
    <a id="viewProfileBtn" href="#" target="_blank" rel="noopener" style="display:none;background:rgba(255,255,255,0.18);border:none;color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:8px;text-decoration:none;">&#128279; My Profile</a>
    <button onclick="signOut()" id="signOutBtn" style="display:none;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:600;font-size:0.82rem;padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;margin-left:6px;">Sign out</button>
  </div>

  <div class="tl-content">

    <!-- LOGIN SCREEN -->
    <div id="loginScreen" class="tl-card" style="max-width:420px;margin:60px auto;">
      <h2 style="margin-bottom:6px;">Manage your QR profile</h2>
      <p style="font-size:0.9rem;color:#666;margin-bottom:20px;">Use the same email you purchased with.</p>

      <!-- Auth tabs -->
      <div style="display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1.5px solid #e2e6ea;">
        <button id="tabSignIn" onclick="switchAuthTab('signin')"
          style="flex:1;padding:10px;border:none;font-family:inherit;font-size:0.88rem;font-weight:700;cursor:pointer;background:#0f6b6b;color:#fff;transition:background 0.15s;">
          Sign In
        </button>
        <button id="tabCreate" onclick="switchAuthTab('create')"
          style="flex:1;padding:10px;border:none;font-family:inherit;font-size:0.88rem;font-weight:700;cursor:pointer;background:#fff;color:#666;transition:background 0.15s;">
          Create Account
        </button>
      </div>

      <div id="loginMsg"></div>

      <!-- Sign In panel -->
      <div id="panelSignIn">
        <div class="tl-field">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" placeholder="you@yourbusiness.com" autocomplete="email" />
        </div>
        <div class="tl-field">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" placeholder="Your password" autocomplete="current-password"
            onkeydown="if(event.key==='Enter') signInWithPassword()" />
        </div>
        <button class="tl-btn tl-btn-full" onclick="signInWithPassword()">Sign In</button>
        <p style="font-size:0.82rem;color:#999;margin-top:12px;text-align:center;">
          <a href="#" onclick="showResetForm(event)" style="color:#0f6b6b;">Forgot password?</a>
        </p>
      </div>

      <!-- Create Account panel -->
      <div id="panelCreate" style="display:none;">
        <div class="tl-field">
          <label for="createEmail">Email</label>
          <input type="email" id="createEmail" placeholder="Same email you purchased with" autocomplete="email" />
        </div>
        <div class="tl-field">
          <label for="createPassword">Create a password</label>
          <input type="password" id="createPassword" placeholder="Min 8 chars, 1 capital, 1 symbol" autocomplete="new-password" oninput="checkPasswordHints()" />
          <div id="pwHints" style="display:flex;gap:6px;flex-wrap:wrap;margin:5px 0 0;min-height:22px;"></div>
        </div>
        <div class="tl-field">
          <label for="createPasswordConfirm">Re-enter password</label>
          <input type="password" id="createPasswordConfirm" placeholder="Type it again to confirm" autocomplete="new-password"
            onkeydown="if(event.key==='Enter') createAccount()" />
        </div>
        <p style="font-size:0.78rem;color:#888;margin:-4px 0 12px;">Must be at least 8 characters with at least one capital letter and one symbol.</p>
        <button class="tl-btn tl-btn-full" onclick="createAccount()">Create Account</button>
        <p style="font-size:0.82rem;color:#999;margin-top:12px;text-align:center;">Already have an account? <a href="#" onclick="switchAuthTab('signin');return false;" style="color:#0f6b6b;">Sign in</a></p>
      </div>

      <!-- Password reset panel -->
      <div id="panelReset" style="display:none;">
        <p style="font-size:0.9rem;color:#555;margin-bottom:16px;">Enter your email and we'll send a password reset link.</p>
        <div class="tl-field">
          <label for="resetEmail">Email</label>
          <input type="email" id="resetEmail" placeholder="you@yourbusiness.com" autocomplete="email" />
        </div>
        <button class="tl-btn tl-btn-full" onclick="sendPasswordReset()">Send Reset Link</button>
        <p style="font-size:0.82rem;color:#999;margin-top:12px;text-align:center;">
          <a href="#" onclick="switchAuthTab('signin');return false;" style="color:#0f6b6b;">Back to sign in</a>
        </p>
      </div>
    </div>

    <!-- EDITOR SCREEN (hidden until logged in) -->
    <div id="editorScreen" style="display:none;">

      <div id="saveMsg"></div>

      <div class="section-tabs">
        <button class="tab-btn active" onclick="switchTab('profile')">Profile</button>
        <button class="tab-btn" onclick="switchTab('links')">Links &amp; Socials</button>
        <button class="tab-btn" onclick="switchTab('themes')">&#127912; Themes</button>
        <button class="tab-btn" onclick="switchTab('qr')">My QR Code</button>
        <button class="tab-btn" onclick="switchTab('reviews')">&#11088; Reviews</button>
        <button class="tab-btn" onclick="switchTab('gallery')">&#128247; Gallery</button>
        <button class="tab-btn" onclick="switchTab('upgrade')" style="color:#f4752b;border-color:#f4752b;">&#8679; Upgrade</button>
      </div>

      <!-- PROFILE TAB -->
      <div id="tab-profile" class="tab-panel active">
        <div id="welcomeBanner" style="display:none;background:linear-gradient(135deg,#edfaf9,#e6f5f5);border:1px solid #b8dede;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
          <h3 style="font-size:1rem;font-weight:700;margin:0 0 10px;color:#0f6b6b;">&#128075; Welcome! Let&#x27;s set up your profile in 5 minutes.</h3>
          <ol style="font-size:0.87rem;color:#444;line-height:2.1;margin:0 0 12px;padding-left:18px;">
            <li>Enter your <strong>business name</strong> and phone below</li>
            <li>Upload your <strong>logo or headshot</strong></li>
            <li>Go to <strong>Links &amp; Socials</strong> — add your website, booking link, and socials</li>
            <li>Go to <strong>Themes</strong> — pick a style that matches your brand</li>
            <li>Hit <strong>Save Changes</strong> at the bottom — you&#x27;re live!</li>
          </ol>
          <button onclick="document.getElementById('welcomeBanner').style.display='none'" style="background:none;border:none;color:#0f6b6b;font-size:0.8rem;cursor:pointer;text-decoration:underline;padding:0;">Dismiss</button>
        </div>
        <div class="tl-card">
          <h2>Profile details</h2>

          <!-- Logo upload -->
          <div class="tl-avatar-row">
            <div id="avatarPreview" class="tl-avatar-placeholder">🏢</div>
            <div>
              <label class="file-btn" for="fileInput">Upload logo</label>
              <input type="file" id="fileInput" accept="image/*" onchange="handleImageUpload(this,'logo')" />
              <p style="font-size:0.78rem;color:#999;margin-top:6px;">Your business logo. Used in Logo and Both display styles.</p>
            </div>
          </div>

          <!-- Headshot upload -->
          <div class="tl-avatar-row">
            <div id="headshotPreview" class="tl-avatar-placeholder" style="font-size:1.6rem;">🤳</div>
            <div>
              <label class="file-btn" for="headshotInput">Upload headshot</label>
              <input type="file" id="headshotInput" accept="image/*" onchange="handleImageUpload(this,'headshot')" />
              <p style="font-size:0.78rem;color:#999;margin-top:6px;">Your photo or portrait. Used in Photo and Both display styles.</p>
            </div>
          </div>
          <!-- Photo layout selector -->
          <div style="margin:4px 0 20px;">
            <label class="tl-label" style="margin-bottom:10px;display:block;">Display style</label>
            <div style="display:flex;gap:8px;">
              <button onclick="setPhotoLayout('logo')"     id="plLogo"     class="pl-btn active" title="Show logo only">
                <span style="font-size:1.1rem;">🏷</span><br><span style="font-size:0.72rem;">Logo</span>
              </button>
              <button onclick="setPhotoLayout('headshot')" id="plHeadshot" class="pl-btn" title="Show your photo only">
                <span style="font-size:1.1rem;">🙂</span><br><span style="font-size:0.72rem;">Photo</span>
              </button>
              <button onclick="setPhotoLayout('both')"     id="plBoth"     class="pl-btn" title="Show logo and photo side by side">
                <span style="font-size:1.1rem;">⊞</span><br><span style="font-size:0.72rem;">Both</span>
              </button>
            </div>
            <p style="font-size:0.78rem;color:#888;margin-top:8px;">Controls what visitors see first on your profile page.</p>
          </div>

          <div class="tl-field">
            <label>Owner / rep name <span style="color:#999;font-weight:400;">(shown under headshot)</span></label>
            <input type="text" id="fieldOwnerName" placeholder="e.g. Mike Torrence" maxlength="100" />
          </div>
          <div class="tl-field">
            <label>Business name</label>
            <input type="text" id="fieldBusinessName" placeholder="e.g. Mike's Plumbing LLC" maxlength="80" />
          </div>
          <div class="tl-field">
            <label>Tagline <span style="color:#999;font-weight:400;">(short — shows under your name)</span></label>
            <input type="text" id="fieldTagline" placeholder="e.g. Trusted plumbing since 2005" maxlength="120" />
          </div>
          <div class="tl-field">
            <label>Bio / About</label>
            <textarea id="fieldBio" rows="4" placeholder="Tell visitors who you are, what you do, and why they should choose you." maxlength="1000"></textarea>
          </div>
          <div class="tl-field">
            <label>Phone number</label>
            <input type="tel" id="fieldPhone" placeholder="(555) 867-5309" maxlength="30" />
          </div>
          <div class="tl-field">
            <label>Video URL <span style="color:#999;font-weight:400;">(YouTube or Vimeo — optional intro video)</span></label>
            <input type="url" id="fieldVideo" placeholder="https://youtube.com/watch?v=..." />
          </div>
        </div>

        <!-- LEAD FORM CONFIG -->
        <div class="tl-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div>
              <h2 style="margin-bottom:2px;">Lead / contact form</h2>
              <p style="font-size:0.85rem;color:#666;">Show a contact form at the bottom of your profile page so visitors can reach out directly.</p>
            </div>
            <label class="toggle-switch" style="margin-left:16px;flex-shrink:0;">
              <input type="checkbox" id="leadFormEnabled" onchange="toggleLeadFormConfig()" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div id="leadFormConfig" style="display:none;margin-top:20px;border-top:1px solid #e5e5ea;padding-top:20px;">
            <div class="dark-toggle-row" style="margin-bottom:12px;">
              <div>
                <label for="leadHasTextbox">Comment / message box</label>
                <p>Let visitors type a free-form message</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="leadHasTextbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="tl-field" style="margin-bottom:8px;">
              <label>Interest checkboxes <span style="color:#999;font-weight:400;">(optional — let visitors select what they need)</span></label>
            </div>
            <ul id="checkboxList" class="links-list" style="margin-bottom:8px;"></ul>
            <button class="add-link-btn" onclick="addCheckbox()">+ Add option</button>
          </div>
        </div>
      </div>

      <!-- LINKS & SOCIALS TAB -->
      <div id="tab-links" class="tab-panel">
        <div class="tl-card">
          <h2>Content</h2>
          <p style="font-size:0.88rem;color:#666;margin-bottom:14px;">Add links, specials, a menu, or services to your profile page.</p>
          <ul id="contentList" class="links-list" style="margin-bottom:14px;"></ul>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
            <button class="content-type-btn active" id="ctBtn-link"    onclick="selectContentType('link')">🔗 Link</button>
            <button class="content-type-btn"         id="ctBtn-update"  onclick="selectContentType('update')">📢 Update</button>
            <button class="content-type-btn"         id="ctBtn-menu"    onclick="selectContentType('menu')">🍽️ Menu</button>
            <button class="content-type-btn"         id="ctBtn-service" onclick="selectContentType('service')">⚙️ Service</button>
          </div>
          <div id="addForm-link">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
              <input type="text" id="newLinkLabel" placeholder="Label (e.g. Book Now)" class="tl-inline-input" style="flex:1;min-width:120px;" />
              <input type="url"  id="newLinkUrl"   placeholder="https://..."           class="tl-inline-input" style="flex:2;min-width:160px;" />
              <button class="add-link-btn" style="white-space:nowrap;flex-shrink:0;" onclick="addContentItem('link')">+ Add</button>
            </div>
          </div>
          <div id="addForm-update" style="display:none;">
            <input type="text" id="newUpdateTitle" placeholder="Title (e.g. Weekend Special!)" class="tl-inline-input" style="width:100%;margin-bottom:8px;" />
            <textarea id="newUpdateText" rows="3" placeholder="Describe your update or special offer..." class="tl-inline-input" style="width:100%;resize:vertical;margin-bottom:8px;"></textarea>
            <button class="add-link-btn" onclick="addContentItem('update')">+ Add Update</button>
          </div>
          <div id="addForm-menu" style="display:none;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
              <input type="text" id="newMenuCategory" placeholder="Category (e.g. Appetizers)" class="tl-inline-input" style="flex:1;min-width:130px;" />
              <input type="text" id="newMenuPrice"    placeholder="Price (e.g. $12.99)"         class="tl-inline-input" style="flex:0 0 120px;" />
            </div>
            <input type="text" id="newMenuName" placeholder="Item name (required)" class="tl-inline-input" style="width:100%;margin-bottom:8px;" />
            <textarea id="newMenuDesc" rows="2" placeholder="Description (optional)" class="tl-inline-input" style="width:100%;resize:vertical;margin-bottom:8px;"></textarea>
            <button class="add-link-btn" onclick="addContentItem('menu')">+ Add Menu Item</button>
          </div>
          <div id="addForm-service" style="display:none;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
              <input type="text" id="newServiceName"  placeholder="Service name (required)" class="tl-inline-input" style="flex:2;min-width:150px;" />
              <input type="text" id="newServicePrice" placeholder="Price / rate"             class="tl-inline-input" style="flex:1;min-width:110px;" />
            </div>
            <textarea id="newServiceDesc" rows="2" placeholder="Description (optional)" class="tl-inline-input" style="width:100%;resize:vertical;margin-bottom:8px;"></textarea>
            <button class="add-link-btn" onclick="addContentItem('service')">+ Add Service</button>
          </div>
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

      <!-- THEMES TAB -->
      <div id="tab-themes" class="tab-panel">
        <div class="tl-card">
          <h2 style="margin-bottom:6px;">Theme &amp; Style</h2>
          <div class="theme-note">🎁 All themes are <strong>free</strong> with your QR code purchase. Make it yours!</div>

          <div class="tl-field" style="margin-bottom:8px;"><label>Background pattern</label></div>
          <div class="pattern-grid" id="patternGrid">
            <!-- swatches rendered by JS -->
          </div>

          <div id="bgUploadSection" style="display:none;margin:10px 0 16px;">
            <label style="font-weight:600;font-size:0.85rem;">Upload background photo</label>
            <input type="file" id="bgImageInput" accept="image/jpeg,image/png,image/webp" onchange="handleBgImageUpload(event)" style="display:block;margin-top:6px;" />
            <div id="bgImagePreview"></div>
            <button type="button" onclick="removeBgImage()" style="margin-top:4px;font-size:0.75rem;color:#888;background:none;border:none;cursor:pointer;padding:0;">✕ Remove photo</button>
          </div>

          <div class="color-row">
            <div class="color-field">
              <label>Primary color</label>
              <input type="color" id="themeColor1" value="#0f6b6b" oninput="refreshSwatchColors()" />
            </div>
            <div class="color-field">
              <label>Secondary / accent color</label>
              <input type="color" id="themeColor2" value="#0a4d4d" oninput="refreshSwatchColors()" />
            </div>
          </div>

          <div class="tl-field" style="margin-bottom:8px;"><label>Card shape</label></div>
          <div class="card-style-row" id="cardStyleRow">
            <button class="card-style-btn selected" data-style="rounded" onclick="selectCardStyle('rounded')">Rounded</button>
            <button class="card-style-btn" data-style="sharp" onclick="selectCardStyle('sharp')">Sharp</button>
            <button class="card-style-btn" data-style="pill" onclick="selectCardStyle('pill')">Pill</button>
          </div>

          <div class="dark-toggle-row">
            <div>
              <label for="darkModeToggle">Dark mode</label>
              <p>Dark card backgrounds, white text</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="darkModeToggle" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="tl-field" style="margin-bottom:8px;"><label>Show / hide sections</label></div>
          <div class="section-toggles">
            <div class="sec-toggle">
              <span>Bio / About</span>
              <label class="toggle-switch"><input type="checkbox" id="secBio" checked /><span class="toggle-slider"></span></label>
            </div>
            <div class="sec-toggle">
              <span>Links</span>
              <label class="toggle-switch"><input type="checkbox" id="secLinks" checked /><span class="toggle-slider"></span></label>
            </div>
            <div class="sec-toggle">
              <span>Social media</span>
              <label class="toggle-switch"><input type="checkbox" id="secSocials" checked /><span class="toggle-slider"></span></label>
            </div>
            <div class="sec-toggle">
              <span>Video</span>
              <label class="toggle-switch"><input type="checkbox" id="secVideo" checked /><span class="toggle-slider"></span></label>
            </div>
            <div class="sec-toggle">
              <span>Lead / contact form</span>
              <label class="toggle-switch"><input type="checkbox" id="secLead" checked /><span class="toggle-slider"></span></label>
            </div>
          </div>
        </div>

        <div style="text-align:right;margin-top:8px;">
          <a id="previewProfileLink" href="#" target="_blank" class="theme-preview-btn">Preview profile →</a>
        </div>
      </div>

      <!-- REVIEWS TAB -->
      <div id="tab-reviews" class="tab-panel">
        <div class="tl-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <h2 style="margin:0;">Customer Reviews</h2>
            <button onclick="loadReviews()" class="add-link-btn" style="width:auto;padding:8px 14px;margin:0;">↻ Refresh</button>
          </div>
          <p style="font-size:0.85rem;color:#666;margin-bottom:18px;">Manage reviews on your profile. Hidden reviews won't appear publicly.</p>
          <div id="reviewsLoading" style="text-align:center;padding:20px;color:#888;font-size:0.9rem;">Loading reviews…</div>
          <div id="reviewsList"></div>
          <p id="reviewsEmpty" style="display:none;text-align:center;color:#888;padding:20px;font-size:0.9rem;">No reviews yet. Share your profile link to collect your first!</p>
        </div>
      </div>

      <!-- QR TAB -->
      <div id="tab-qr" class="tab-panel">
        <div class="tl-card">
          <h2>Your QR code</h2>
          <p style="font-size:0.9rem;color:#666;margin-bottom:20px;">Scan this to go to your profile page. Download and print it, share it digitally, or use it anywhere.</p>

          <div style="margin-bottom:20px;">
            <p style="font-size:0.8rem;font-weight:700;color:#444;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;">Dot style</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="setQRDotStyle('square')"        id="qrDotSquare"       class="qr-dot-btn active">&#9632; Square</button>
              <button onclick="setQRDotStyle('rounded')"       id="qrDotRounded"      class="qr-dot-btn">&#9673; Rounded</button>
              <button onclick="setQRDotStyle('dots')"          id="qrDotDots"         class="qr-dot-btn">&#9679; Dots</button>
              <button onclick="setQRDotStyle('extra-rounded')" id="qrDotExtraRounded" class="qr-dot-btn">&#9830; Smooth</button>
            </div>
          </div>

          <div style="display:flex;justify-content:center;margin-bottom:16px;">
            <div id="qrCanvas" style="border-radius:12px;overflow:hidden;line-height:0;"></div>
          </div>

          <div style="text-align:center;margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
            <button onclick="downloadQR('png')" class="tl-btn" style="background:none;border:1.5px solid #0f6b6b;color:#0f6b6b;padding:8px 20px;">&#8675; Download PNG</button>
            <button onclick="downloadQR('svg')" class="tl-btn" style="background:none;border:1.5px solid #444;color:#444;padding:8px 20px;" title="Vector — for print shops & vinyl wrap">&#8675; Download SVG</button>
          </div>

          <div id="profileUrlRow" style="text-align:left;background:#edf8f8;border-radius:8px;padding:14px 16px;">
            <p style="font-size:0.8rem;color:#888;margin-bottom:6px;">Your profile page URL</p>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <a id="profileUrlLink" href="#" target="_blank" style="color:#0f6b6b;font-weight:700;word-break:break-all;flex:1;min-width:0;"></a>
              <button id="copyUrlBtn" onclick="copyProfileUrl()" style="flex-shrink:0;background:#0f6b6b;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:0.8rem;font-weight:700;cursor:pointer;">&#128203; Copy</button>
            </div>
          </div>
          <div id="metricsRow" style="display:none;text-align:left;background:#f0faf5;border-radius:8px;padding:14px 16px;margin-top:10px;border:1px solid rgba(15,107,107,0.2);">
            <p style="font-size:0.8rem;color:#888;margin-bottom:6px;">&#128202; Scan Analytics</p>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:0.88rem;color:#0f6b6b;font-weight:600;flex:1;">Track scans, devices, and locations in real time.</span>
              <a id="metricsLink" href="#" target="_blank" style="flex-shrink:0;background:#0f6b6b;color:#fff;border-radius:6px;padding:6px 14px;font-size:0.8rem;font-weight:700;text-decoration:none;">View Analytics &#8599;</a>
            </div>
          </div>
        </div>
      </div>

      <!-- UPGRADE TAB -->
      <div id="tab-upgrade" class="tab-panel">
        <div id="upgradeContent">
          <!-- Populated by buildUpgradeTab() after profile loads -->
          <div class="tl-card" style="text-align:center;color:#888;padding:40px;">Loading…</div>
        </div>
      </div>

      <!-- GALLERY TAB -->
      <div id="tab-gallery" class="tab-panel">
        <!-- Photo Gallery -->
        <div class="tl-card">
          <h2>Photo Gallery</h2>
          <p style="font-size:0.85rem;color:#666;margin-bottom:14px;">Photos appear as a clickable grid on your profile. The <strong>&#128065; view count</strong> shows which ones visitors enlarge &mdash; perfect for chefs, bakers, trainers, and models.</p>
          <div id="galleryGrid" class="gallery-grid-p">
            <p class="gallery-empty">No photos yet. Add some below!</p>
          </div>
          <div id="galleryDropZone"
            style="margin-top:10px;border:2px dashed #c8d8d8;border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:background 0.15s,border-color 0.15s;"
            onclick="document.getElementById(\'galleryInput\').click()"
            ondragover="event.preventDefault();this.style.background=\'#e6f7f7\';this.style.borderColor=\'#0f6b6b\';"
            ondragleave="this.style.background=\'\';this.style.borderColor=\'#c8d8d8\';"
            ondrop="event.preventDefault();this.style.background=\'\';this.style.borderColor=\'#c8d8d8\';handleGalleryUpload({files:event.dataTransfer.files});">
            <div style="font-size:1.3rem;margin-bottom:4px;">&#128247;</div>
            <div style="font-size:0.88rem;color:#555;font-weight:600;">Drop photos here or <span style="color:#0f6b6b;text-decoration:underline;">browse</span></div>
            <div style="font-size:0.75rem;color:#aaa;margin-top:3px;">JPG / PNG / WebP &bull; max 8 MB each</div>
            <input type="file" id="galleryInput" accept="image/*" multiple style="display:none;" onchange="handleGalleryUpload(this)" />
          </div>
          <p id="galleryMsg" class="media-msg"></p>
        </div>
        <!-- Documents & Flyers -->
        <div class="tl-card">
          <h2>Documents &amp; Flyers</h2>
          <p style="font-size:0.85rem;color:#666;margin-bottom:14px;">Upload PDF menus, event flyers, promo sheets, or Word docs. Visitors can open and download them from your profile.</p>
          <div id="documentsList">
            <p style="color:#aaa;font-size:0.85rem;text-align:center;padding:12px 0;">No documents yet.</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;">
            <label class="file-btn" for="docInput" style="cursor:pointer;">+ Add Document</label>
            <input type="file" id="docInput" accept=".pdf,.doc,.docx" style="display:none;" onchange="handleDocUpload(this)" />
            <span style="font-size:0.75rem;color:#aaa;">PDF, DOC, DOCX &bull; max 20 MB</span>
          </div>
          <p id="docMsg" class="media-msg"></p>
        </div>
      </div> <!-- /tab-gallery -->

      <!-- SAVE BUTTON (always visible, hidden on upgrade tab) -->
      <div id="saveRow" style="text-align:right;margin-top:8px;">
        <button class="tl-btn tl-btn-teal" onclick="saveProfile()">Save Changes</button>
      </div>

    </div>
  </div>

  <script>
    // ── Supabase init ──────────────────────────────────────────────
    const _supabase = window.supabase.createClient('${SUPABASE_URL}', '${SUPABASE_ANON_KEY}');
    let _session      = null;
    let _profile      = null;
    let _customer     = null;
    let _logoBase64   = null;
    let _headshotBase64 = null;
    let _photoLayout  = 'logo';
    let _profileId      = null;
    let _bgImageUrl     = null;
    let _bgImageBase64  = null;
    let _qrCode       = null;
    let _qrDotStyle   = 'square';
    let _qrTargetUrl  = '';
    let _qrLogoUrl    = null;
    let _selectedPattern = 'solid';
    let _dirty = false; // true when profile has unsaved changes
    let _selectedCardStyle = 'rounded';

    // ── Pattern definitions (mirrors profile.js) ───────────────────
    const PATTERNS = [
      { id: 'solid',    label: 'Solid',      preview: (c1)     => 'background:' + c1 },
      { id: 'gradient', label: 'Gradient',   preview: (c1, c2) => 'background:linear-gradient(135deg,' + c1 + ',' + c2 + ')' },
      { id: 'camo', label: 'Green Camo', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(0,0,0,0.42)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(20,40,5,0.66)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(0,0,0,0.42)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(35,25,5,0.58)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(20,40,5,0.66)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(0,0,0,0.42)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(35,25,5,0.58)" transform="rotate(18,162,132)"/></svg>'; return 'background-color:#4a5c2f;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'camo-desert', label: 'Desert Camo', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(107,76,42,0.6)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(160,120,56,0.55)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(107,76,42,0.6)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(90,62,20,0.65)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(160,120,56,0.55)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(107,76,42,0.6)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(90,62,20,0.65)" transform="rotate(18,162,132)"/></svg>'; return 'background-color:#c8a96e;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'camo-pink', label: 'Pink Camo', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(155,27,106,0.62)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(219,39,119,0.55)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(155,27,106,0.62)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(109,0,80,0.65)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(219,39,119,0.55)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(155,27,106,0.62)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(109,0,80,0.65)" transform="rotate(18,162,132)"/></svg>'; return 'background-color:#f472b6;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'camo-blue', label: 'Blue Camo', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(15,40,96,0.65)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(45,92,170,0.55)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(15,40,96,0.65)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(10,24,80,0.7)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(45,92,170,0.55)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(15,40,96,0.65)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(10,24,80,0.7)" transform="rotate(18,162,132)"/></svg>'; return 'background-color:#1e4080;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'camo-rwb', label: 'Patriot Camo', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(29,78,216,0.65)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(255,255,255,0.5)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(29,78,216,0.65)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(29,78,216,0.5)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(255,255,255,0.5)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(29,78,216,0.65)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(29,78,216,0.5)" transform="rotate(18,162,132)"/></svg>'; return 'background-color:#b91c1c;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'leopard', label: 'Leopard', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="#3d1f00" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="#c8952a" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="#3d1f00" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="#c8952a" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="#3d1f00" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="#c8952a" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="#3d1f00" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="#c8952a" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="#3d1f00" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="#c8952a" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="#3d1f00" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="#c8952a" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="#3d1f00" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="#c8952a" opacity="0.97" transform="rotate(15,118,108)"/></svg>'; return 'background-color:#c8952a;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:130px 130px;background-repeat:repeat'; } },
      { id: 'cheetah', label: 'Cheetah', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="#1a1a1a" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="#f5c518" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="#1a1a1a" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="#f5c518" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="#1a1a1a" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="#f5c518" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="#1a1a1a" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="#f5c518" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="#1a1a1a" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="#f5c518" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="#1a1a1a" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="#f5c518" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="#1a1a1a" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="#f5c518" opacity="0.97" transform="rotate(15,118,108)"/></svg>'; return 'background-color:#f5c518;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:130px 130px;background-repeat:repeat'; } },
      { id: 'leopard-pink', label: 'Pink Leopard', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="#4a0032" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="#ff69b4" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="#4a0032" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="#ff69b4" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="#4a0032" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="#ff69b4" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="#4a0032" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="#ff69b4" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="#4a0032" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="#ff69b4" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="#4a0032" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="#ff69b4" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="#4a0032" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="#ff69b4" opacity="0.97" transform="rotate(15,118,108)"/></svg>'; return 'background-color:#ff1493;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:130px 130px;background-repeat:repeat'; } },
      { id: 'leopard-snow', label: 'Snow Leopard', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="#2a2a3a" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="#e8e8f5" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="#2a2a3a" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="#e8e8f5" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="#2a2a3a" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="#e8e8f5" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="#2a2a3a" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="#e8e8f5" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="#2a2a3a" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="#e8e8f5" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="#2a2a3a" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="#e8e8f5" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="#2a2a3a" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="#e8e8f5" opacity="0.97" transform="rotate(15,118,108)"/></svg>'; return 'background-color:#f0f0f8;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:130px 130px;background-repeat:repeat'; } },
      { id: 'leopard-rwb', label: 'Patriot Print', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="#1e3a8a" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="#ffffff" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="#1e3a8a" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="#ffffff" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="#1e3a8a" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="#ffffff" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="#1e3a8a" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="#ffffff" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="#1e3a8a" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="#ffffff" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="#1e3a8a" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="#ffffff" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="#1e3a8a" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="#ffffff" opacity="0.97" transform="rotate(15,118,108)"/></svg>'; return 'background-color:#dc2626;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:130px 130px;background-repeat:repeat'; } },
      { id: 'tropical', label: 'Tropical', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(0,145,55,0.88)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(0,165,65,0.82)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(0,145,55,0.88)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(0,165,65,0.82)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(0,145,55,0.88)" transform="rotate(32,185,220)"/><circle cx="78" cy="68" r="15" fill="rgba(255,55,100,0.92)" opacity="0.95"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,210,0,0.97)" opacity="0.97"/><circle cx="152" cy="152" r="13" fill="rgba(255,140,0,0.9)" opacity="0.9"/><circle cx="152" cy="152" r="5" fill="rgba(255,235,0,0.97)" opacity="0.97"/><circle cx="118" cy="28" r="8" fill="rgba(255,55,100,0.92)" opacity="0.85"/><circle cx="118" cy="28" r="3" fill="rgba(255,210,0,0.97)" opacity="0.95"/></svg>'; return 'background-color:#1a6b38;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'tropical-neon', label: 'Neon Jungle', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(57,255,20,0.85)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(0,200,16,0.75)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(57,255,20,0.85)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(0,200,16,0.75)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(57,255,20,0.85)" transform="rotate(32,185,220)"/><circle cx="78" cy="68" r="15" fill="rgba(255,20,147,0.95)" opacity="0.95"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,255,0,1)" opacity="0.97"/><circle cx="152" cy="152" r="13" fill="rgba(0,255,200,0.88)" opacity="0.9"/><circle cx="152" cy="152" r="5" fill="rgba(255,255,0,0.97)" opacity="0.97"/><circle cx="118" cy="28" r="8" fill="rgba(255,20,147,0.95)" opacity="0.85"/><circle cx="118" cy="28" r="3" fill="rgba(255,255,0,1)" opacity="0.95"/></svg>'; return 'background-color:#0a0a0a;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'tropical-pink', label: 'Pink Paradise', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(233,30,99,0.75)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(240,98,146,0.65)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(233,30,99,0.75)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(240,98,146,0.65)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(233,30,99,0.75)" transform="rotate(32,185,220)"/><circle cx="78" cy="68" r="15" fill="rgba(255,128,171,0.92)" opacity="0.95"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,210,0,0.97)" opacity="0.97"/><circle cx="118" cy="28" r="8" fill="rgba(255,128,171,0.92)" opacity="0.85"/><circle cx="118" cy="28" r="3" fill="rgba(255,210,0,0.97)" opacity="0.95"/></svg>'; return 'background-color:#fce4ec;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'tropical-sunset', label: 'Sunset Palms', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(74,0,128,0.75)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(109,40,217,0.65)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(74,0,128,0.75)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(109,40,217,0.65)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(74,0,128,0.75)" transform="rotate(32,185,220)"/><circle cx="78" cy="68" r="15" fill="rgba(255,215,0,0.92)" opacity="0.95"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,255,255,0.97)" opacity="0.97"/><circle cx="118" cy="28" r="8" fill="rgba(255,215,0,0.92)" opacity="0.85"/><circle cx="118" cy="28" r="3" fill="rgba(255,255,255,0.97)" opacity="0.95"/></svg>'; return 'background-color:#c2410c;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'tropical-dark', label: 'Midnight Tropics', preview: () => { var s='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(27,77,62,0.88)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(21,128,61,0.75)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(27,77,62,0.88)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(21,128,61,0.75)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(27,77,62,0.88)" transform="rotate(32,185,220)"/><circle cx="78" cy="68" r="15" fill="rgba(212,175,55,0.92)" opacity="0.95"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,235,100,0.97)" opacity="0.97"/><circle cx="118" cy="28" r="8" fill="rgba(212,175,55,0.92)" opacity="0.85"/><circle cx="118" cy="28" r="3" fill="rgba(255,235,100,0.97)" opacity="0.95"/></svg>'; return 'background-color:#0d1b2a;background-image:url("data:image/svg+xml,'+encodeURIComponent(s)+'");background-size:cover'; } },
      { id: 'marble',   label: 'Marble',     preview: (c1, c2) => 'background:linear-gradient(105deg,' + c1 + ' 0%,' + c2 + ' 20%,rgba(255,255,255,.2) 30%,' + c2 + ' 40%,' + c1 + ' 60%,rgba(255,255,255,.1) 70%,' + c2 + ' 80%,' + c1 + ' 100%)' },
      { id: 'carbon',   label: 'Carbon',     preview: ()       => 'background:#1a1a1a;background-image:repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.05) 2px,rgba(255,255,255,.05) 4px),repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,.07) 2px,rgba(255,255,255,.07) 4px)' },
      { id: 'wood',     label: 'Wood Grain', preview: ()       => 'background:linear-gradient(170deg,#8B5E3C 0%,#A0714F 15%,#7a4f2d 30%,#9a6540 45%,#b07848 60%,#8a5c38 75%,#a06840 100%)' },
      { id: 'custom',   label: '📷 Your Photo', preview: (c1, c2, bgUrl) => bgUrl ? 'background-image:url('+bgUrl+');background-size:cover;background-position:center' : 'background:linear-gradient(135deg,#667eea,#764ba2);background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0,rgba(255,255,255,.07) 1px,transparent 0,transparent 50%);background-size:auto,8px 8px' },
    ];

    function buildPatternGrid() {
      const grid = document.getElementById('patternGrid');
      const c1 = document.getElementById('themeColor1').value;
      const c2 = document.getElementById('themeColor2').value;
      const patMap = {};
      PATTERNS.forEach(function(p) { patMap[p.id] = p; });
      const topLevel = ['solid','gradient','camo','leopard','tropical','marble','carbon','wood','custom'];
      var html = '';
      topLevel.forEach(function(id) {
        const groupKey = (VARIANT_TO_GROUP[id] && PATTERN_GROUPS[VARIANT_TO_GROUP[id]].variants[0] === id) ? VARIANT_TO_GROUP[id] : null;
        if (groupKey) {
          const group = PATTERN_GROUPS[groupKey];
          const activeId = group.variants.includes(_selectedPattern) ? _selectedPattern : group.variants[0];
          const pat = patMap[activeId];
          const style = pat.preview(c1, c2);
          const isExp = _expandedGroup === groupKey;
          const hasSel = group.variants.includes(_selectedPattern);
          html += '<div class="pattern-swatch group-swatch' + (hasSel ? ' selected' : '') + (isExp ? ' expanded' : '') + '" style="' + style + '" onclick="togglePatternGroup(\'' + groupKey + '\')" title="' + group.label + '">';
          html += '<span>' + group.emoji + ' ' + group.label + (isExp ? ' &#9652;' : ' &#9662;') + '</span>';
          html += '</div>';
          if (isExp) {
            html += '<div class="pattern-subrow">';
            group.variants.forEach(function(vid) {
              const vp = patMap[vid];
              const vs = vp.preview(c1, c2);
              html += '<div class="pattern-sub-swatch' + (vid === _selectedPattern ? ' selected' : '') + '" style="' + vs + '" onclick="selectPatternVariant(\'' + vid + '\')" title="' + vp.label + '"><span>' + vp.label + '</span></div>';
            });
            html += '</div>';
          }
        } else {
          const p = patMap[id];
          if (!p) return;
          const style = p.id === 'custom' ? p.preview(c1, c2, _bgImageUrl) : p.preview(c1, c2);
          html += '<div class="pattern-swatch' + (p.id === _selectedPattern ? ' selected' : '') + '" style="' + style + '" onclick="selectPattern(\'' + p.id + '\')" title="' + p.label + '"><span>' + p.label + '</span></div>';
        }
      });
      grid.innerHTML = html;
    }

    function togglePatternGroup(groupKey) {
      _expandedGroup = (_expandedGroup === groupKey) ? null : groupKey;
      buildPatternGrid();
    }

    function selectPatternVariant(id) {
      _expandedGroup = null;
      selectPattern(id);
    }
    function selectPattern(id) {
      _selectedPattern = id;
      if (!GROUP_VARIANT_IDS.has(id)) _expandedGroup = null;
      var sec = document.getElementById('bgUploadSection');
      if (sec) sec.style.display = id === 'custom' ? '' : 'none';
      markDirty();
      buildPatternGrid();
    }
    function refreshSwatchColors() {
      buildPatternGrid();
    }

    function handleBgImageUpload(e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        _bgImageBase64 = ev.target.result; _bgImageUrl = ev.target.result;
        markDirty();
        var prev = document.getElementById('bgImagePreview');
        if (prev) prev.innerHTML = '<img src="' + _bgImageBase64 + '" style="width:100%;max-height:110px;object-fit:cover;border-radius:8px;margin-top:6px;" />';
        buildPatternGrid();
      };
      reader.readAsDataURL(file);
    }

    function removeBgImage() {
      _bgImageBase64 = null; _bgImageUrl = null;
      markDirty();
      var prev = document.getElementById('bgImagePreview');
      if (prev) prev.innerHTML = '';
      buildPatternGrid();
    }

    function selectCardStyle(style) {
      _selectedCardStyle = style;
      markDirty();
      document.querySelectorAll('.card-style-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.style === style);
      });
    }

    function getThemePayload() {
      return {
        pattern:   _selectedPattern,
        color1:    document.getElementById('themeColor1').value,
        color2:    document.getElementById('themeColor2').value,
        darkMode:  document.getElementById('darkModeToggle').checked,
        cardStyle: _selectedCardStyle,
        photoLayout: _photoLayout,
        sections: {
          bio:     document.getElementById('secBio').checked,
          links:   document.getElementById('secLinks').checked,
          socials: document.getElementById('secSocials').checked,
          video:   document.getElementById('secVideo').checked,
          lead:    document.getElementById('secLead').checked,
        },
      };
    }

    function populateThemeControls(theme) {
      if (!theme) { buildPatternGrid(); return; }
      _selectedPattern   = theme.pattern   || 'solid';
      _bgImageBase64 = null;
      var bgSec = document.getElementById('bgUploadSection');
      if (bgSec) bgSec.style.display = _selectedPattern === 'custom' ? '' : 'none';
      if (_bgImageUrl) { var pv = document.getElementById('bgImagePreview'); if (pv) pv.innerHTML = '<img src="' + _bgImageUrl + '" style="width:100%;max-height:110px;object-fit:cover;border-radius:8px;margin-top:6px;" />'; }
      _selectedCardStyle = theme.cardStyle || 'rounded';
      if (theme.color1) document.getElementById('themeColor1').value = theme.color1;
      if (theme.color2) document.getElementById('themeColor2').value = theme.color2;
      document.getElementById('darkModeToggle').checked = !!theme.darkMode;
      document.querySelectorAll('.card-style-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.style === _selectedCardStyle);
      });
      if (theme.sections) {
        if (typeof theme.sections.bio     !== 'undefined') document.getElementById('secBio').checked     = theme.sections.bio;
        if (typeof theme.sections.links   !== 'undefined') document.getElementById('secLinks').checked   = theme.sections.links;
        if (typeof theme.sections.socials !== 'undefined') document.getElementById('secSocials').checked = theme.sections.socials;
        if (typeof theme.sections.video   !== 'undefined') document.getElementById('secVideo').checked   = theme.sections.video;
        if (typeof theme.sections.lead    !== 'undefined') document.getElementById('secLead').checked    = theme.sections.lead;
      }
      if (theme.photoLayout) setPhotoLayout(theme.photoLayout, true);
            buildPatternGrid();
    }

    // ── Boot ───────────────────────────────────────────────────────
    (async () => {
      // Build pattern swatches with defaults right away
      buildPatternGrid();

      // Handle magic-link callback (hash contains access_token)
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
      });
    })();

    // ── Auth ───────────────────────────────────────────────────────
    function checkPasswordHints() {
      var pw = document.getElementById('createPassword').value;
      var h  = document.getElementById('pwHints');
      if (!h || !pw) { if(h) h.innerHTML=''; return; }
      var sym = /[!@#$%^&*()\-_=+\[\]{};:\'",.<>?\/\\|~]/.test(pw);
      var hints = [
        { label: '8+ chars', ok: pw.length >= 8 },
        { label: '1 capital', ok: /[A-Z]/.test(pw) },
        { label: '1 symbol',  ok: sym },
      ];
      h.innerHTML = hints.map(function(x){
        return '<span style="font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;transition:background 0.15s;background:'
          + (x.ok ? '#d1fae5' : '#f3f4f6') + ';color:' + (x.ok ? '#065f46' : '#9ca3af') + ';">'
          + (x.ok ? '✓ ' : '') + x.label + '</span>';
      }).join('');
    }
    function switchAuthTab(tab) {
      const isSignIn = tab === 'signin';
      const isCreate = tab === 'create';
      document.getElementById('panelSignIn').style.display  = isSignIn ? 'block' : 'none';
      document.getElementById('panelCreate').style.display  = isCreate ? 'block' : 'none';
      document.getElementById('panelReset').style.display   = 'none';
      document.getElementById('tabSignIn').style.background = isSignIn ? '#0f6b6b' : '#fff';
      document.getElementById('tabSignIn').style.color      = isSignIn ? '#fff'    : '#666';
      document.getElementById('tabCreate').style.background = isCreate ? '#0f6b6b' : '#fff';
      document.getElementById('tabCreate').style.color      = isCreate ? '#fff'    : '#666';
      document.getElementById('loginMsg').innerHTML = '';
    }

    function showResetForm(e) {
      e.preventDefault();
      document.getElementById('panelSignIn').style.display = 'none';
      document.getElementById('panelCreate').style.display = 'none';
      document.getElementById('panelReset').style.display  = 'block';
      document.getElementById('loginMsg').innerHTML = '';
    }

    async function signInWithPassword() {
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const msgEl    = document.getElementById('loginMsg');
      if (!email || !password) {
        msgEl.innerHTML = '<div class="tl-msg error">Please enter your email and password.</div>'; return;
      }
      msgEl.innerHTML = '<div class="tl-msg">Signing in…</div>';
      const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      } else {
        await onSignedIn(data.session);
      }
    }

    async function createAccount() {
      const email    = document.getElementById('createEmail').value.trim();
      const password = document.getElementById('createPassword').value;
      const confirm  = document.getElementById('createPasswordConfirm').value;
      const msgEl    = document.getElementById('loginMsg');

      if (!email || !password) {
        msgEl.innerHTML = '<div class="tl-msg error">Please enter your email and a password.</div>'; return;
      }
      if (password.length < 8) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must be at least 8 characters.</div>'; return;
      }
      if (!/[A-Z]/.test(password)) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must include at least one capital letter.</div>'; return;
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must include at least one symbol (e.g. ! @ # $).</div>'; return;
      }
      if (password !== confirm) {
        msgEl.innerHTML = '<div class="tl-msg error">Passwords do not match. Please re-enter.</div>'; return;
      }

      msgEl.innerHTML = '<div class="tl-msg">Creating account…</div>';

      // Call server-side signup (bypasses email confirmation)
      const res = await fetch('/.netlify/functions/portal-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(result.error || 'Account creation failed.') + '</div>';
        return;
      }

      // Account created — sign in immediately
      msgEl.innerHTML = '<div class="tl-msg">Account created! Signing you in…</div>';
      const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">Account created but sign-in failed: ' + escHtml(error.message) + '. Please use the Sign In tab.</div>';
        switchAuthTab('signin');
        document.getElementById('loginEmail').value = email;
      } else {
        await onSignedIn(data.session);
      }
    }

    async function sendPasswordReset() {
      const email = document.getElementById('resetEmail').value.trim();
      const msgEl = document.getElementById('loginMsg');
      if (!email) { msgEl.innerHTML = '<div class="tl-msg error">Please enter your email.</div>'; return; }
      msgEl.innerHTML = '<div class="tl-msg">Sending reset link…</div>';

      // Call server-side reset (sends via Resend, not Supabase email)
      await fetch('/.netlify/functions/portal-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success (never reveal whether account exists)
      msgEl.innerHTML = '<div class="tl-msg success">If an account exists for that email, a reset link has been sent. Check your inbox.</div>';
    }

    async function updatePassword() {
      const password = document.getElementById('newPassword').value;
      const msgEl    = document.getElementById('loginMsg');
      if (!password || password.length < 8) {
        msgEl.innerHTML = '<div class="tl-msg error">Password must be at least 8 characters.</div>'; return;
      }
      const { error } = await _supabase.auth.updateUser({ password });
      if (error) {
        msgEl.innerHTML = '<div class="tl-msg error">' + escHtml(error.message) + '</div>';
      } else {
        msgEl.innerHTML = '<div class="tl-msg success">Password updated! You are now signed in.</div>';
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
        .select('id, plan, metrics_active')
        .eq('email', email)
        .maybeSingle();

      if (!customer) {
        showMsg('error', 'No account found for ' + escHtml(email) + '. Use the email you purchased with.');
        return;
      }
      _customer = customer;

      const { data: profile } = await _supabase
        .from('profiles')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!profile) {
        showMsg('error', 'No profile found. Contact orders@torrolink.com for help.');
        return;
      }

      _profile = profile;
      populateEditor(profile);
    }

    // ── Populate form fields ───────────────────────────────────────
    function populateEditor(p) {
      document.getElementById('topbarHandle').textContent = '@' + p.handle;
      // Show onboarding banner for new/blank profiles
      if (!p.business_name) {
        var wb = document.getElementById('welcomeBanner');
        if (wb) wb.style.display = 'block';
      }
      document.getElementById('fieldBusinessName').value = p.business_name || '';
      document.getElementById('fieldTagline').value      = p.tagline       || '';
      document.getElementById('fieldBio').value          = p.bio           || '';
      document.getElementById('fieldPhone').value        = p.phone         || '';
      document.getElementById('fieldVideo').value        = p.video_url     || '';
      document.getElementById('fieldOwnerName').value    = p.owner_name    || '';

      // Logo
      if (p.logo_url) {
        const img = document.createElement('img');
        img.src = p.logo_url; img.className = 'tl-avatar';
        document.getElementById('avatarPreview').replaceWith(img);
        img.id = 'avatarPreview';
      }

      // Headshot
      if (p.photo_url) {
        const img = document.createElement('img');
        img.src = p.photo_url; img.className = 'tl-avatar';
        document.getElementById('headshotPreview').replaceWith(img);
        img.id = 'headshotPreview';
      }

      // Content blocks (new) — falls back to old links array for backward compat
      var cbArr = (Array.isArray(p.content_blocks) && p.content_blocks.length > 0)
        ? p.content_blocks
        : (Array.isArray(p.links) ? p.links : []).map(function(l){
            return { id: genId(), type: 'link', label: l.label||'', url: l.url||'' };
          });
      cbArr.forEach(function(b){ appendContentItem(b); });

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

      // Lead form config — gated behind Metrics & Leads plan
      const _hasMetrics = !!((_customer && _customer.metrics_active) || (_customer && _customer.plan === 'metrics'));
      const leadEl      = document.getElementById('leadFormEnabled');
      const leadCard    = leadEl ? leadEl.closest('.tl-card') : null;
      const leadEnabled = _hasMetrics && !!p.lead_form_enabled;
      leadEl.checked = leadEnabled;
      document.getElementById('leadHasTextbox').checked  = !!p.lead_form_has_textbox;
      document.getElementById('leadFormConfig').style.display = leadEnabled ? 'block' : 'none';
      const checkboxes = Array.isArray(p.lead_form_checkboxes) ? p.lead_form_checkboxes : [];
      checkboxes.forEach(opt => addCheckbox(opt));
      // Show upgrade notice or enable toggle based on plan
      if (leadCard) {
        var _oldNotice = leadCard.querySelector('.lead-metrics-notice');
        if (_oldNotice) _oldNotice.remove();
        if (!_hasMetrics) {
          leadEl.disabled = true;
          var _notice = document.createElement('div');
          _notice.className = 'lead-metrics-notice';
          _notice.style.cssText = 'margin-top:14px;padding:12px 14px;background:#fff8f0;border:1px solid rgba(244,117,43,0.25);border-radius:8px;font-size:0.85rem;color:#7c4000;';
          _notice.innerHTML = '🔒 Lead capture requires <strong>Metrics &amp; Leads</strong> ($10.28/mo). <a href="#" onclick="switchTab('upgrade');return false;" style="color:#f4752b;font-weight:700;text-decoration:none;">Upgrade &rarr;</a>';
          leadCard.appendChild(_notice);
        } else {
          leadEl.disabled = false;
        }
      }

      // Theme
      _bgImageUrl = p.background_image || null;
      populateThemeControls(p.theme || null);

      // QR tab
      _profileId   = p.id || null;
      _qrTargetUrl = window.location.origin + '/q/' + p.code;
      _qrLogoUrl   = p.logo_url || null;
      renderQRCode();
      const profileUrl = window.location.origin + '/p/' + p.handle;
      const link = document.getElementById('profileUrlLink');
      link.href = profileUrl; link.textContent = profileUrl;
      // Preview link in themes tab
      const prev = document.getElementById('previewProfileLink');
      if (prev) { prev.href = profileUrl; }
      const vpBtn = document.getElementById('viewProfileBtn');
      if (vpBtn) { vpBtn.href = profileUrl; vpBtn.style.display = 'inline-block'; }
      // Show metrics link for Metrics & Leads subscribers
      const metricsRow  = document.getElementById('metricsRow');
      const metricsLink = document.getElementById('metricsLink');
      if (metricsRow && _hasMetrics) {
        metricsRow.style.display = 'block';
        if (metricsLink) metricsLink.href = window.location.origin + '/metrics/' + p.handle;
      }
    }

    // ── Content management ────────────────────────────────────────
    function genId() {
      return Math.random().toString(36).slice(2,9) + Date.now().toString(36);
    }

    function selectContentType(type) {
      ['link','update','menu','service'].forEach(function(t) {
        var btn  = document.getElementById('ctBtn-'   + t);
        var form = document.getElementById('addForm-' + t);
        if (btn)  btn.classList.toggle('active', t === type);
        if (form) form.style.display = (t === type) ? 'block' : 'none';
      });
    }

    function addContentItem(type) {
      var item;
      if (type === 'link') {
        var label = document.getElementById('newLinkLabel').value.trim();
        var url   = document.getElementById('newLinkUrl').value.trim();
        if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) url = 'https://' + url;
        if (!label && !url) return;
        item = { id: genId(), type: 'link', label: label, url: url };
        document.getElementById('newLinkLabel').value = '';
        document.getElementById('newLinkUrl').value   = '';
      } else if (type === 'update') {
        var title = document.getElementById('newUpdateTitle').value.trim();
        var text  = document.getElementById('newUpdateText').value.trim();
        if (!title && !text) return;
        item = { id: genId(), type: 'update', title: title, text: text };
        document.getElementById('newUpdateTitle').value = '';
        document.getElementById('newUpdateText').value  = '';
      } else if (type === 'menu') {
        var name = document.getElementById('newMenuName').value.trim();
        if (!name) { document.getElementById('newMenuName').focus(); return; }
        item = {
          id: genId(), type: 'menu',
          category:    document.getElementById('newMenuCategory').value.trim(),
          name:        name,
          price:       document.getElementById('newMenuPrice').value.trim(),
          description: document.getElementById('newMenuDesc').value.trim(),
        };
        ['newMenuName','newMenuCategory','newMenuPrice','newMenuDesc'].forEach(function(id){
          document.getElementById(id).value = '';
        });
      } else if (type === 'service') {
        var svcName = document.getElementById('newServiceName').value.trim();
        if (!svcName) { document.getElementById('newServiceName').focus(); return; }
        item = {
          id: genId(), type: 'service',
          name:        svcName,
          price:       document.getElementById('newServicePrice').value.trim(),
          description: document.getElementById('newServiceDesc').value.trim(),
        };
        ['newServiceName','newServicePrice','newServiceDesc'].forEach(function(id){
          document.getElementById(id).value = '';
        });
      }
      if (!item) return;
      appendContentItem(item);
      markDirty();
    }

    function appendContentItem(item) {
      var colors = { link:'#0f6b6b', update:'#f4752b', menu:'#8b5cf6', service:'#2563eb' };
      var icons  = { link:'🔗', update:'📢', menu:'🍽️', service:'⚙️' };
      var summary = '';
      if (item.type === 'link')    summary = escHtml(item.label||'') + ' → ' + escHtml(item.url||'');
      if (item.type === 'update')  summary = '<strong>'+escHtml(item.title||'')+'</strong>'+(item.text?' — '+escHtml(item.text).slice(0,55)+'…':'');
      if (item.type === 'menu')    summary = (item.category?'<em>'+escHtml(item.category)+'</em> · ':'')+'<strong>'+escHtml(item.name||'')+'</strong>'+(item.price?' · '+escHtml(item.price):'');
      if (item.type === 'service') summary = '<strong>'+escHtml(item.name||'')+'</strong>'+(item.price?' · '+escHtml(item.price):'');
      var li = document.createElement('li');
      li.draggable = true;
      li.dataset.item = JSON.stringify(item);
      li.innerHTML =
        '<span class="drag-handle" title="Drag to reorder" style="cursor:grab;color:#bbb;font-size:1.2rem;padding:0 6px 0 0;user-select:none;">⠿</span>' +
        '<span class="content-type-badge" style="background:'+(colors[item.type]||'#666')+';color:#fff;">'+(icons[item.type]||'')+' '+item.type+'</span>' +
        '<span style="font-size:0.87rem;color:#444;flex:1;">'+summary+'</span>' +
        '<button class="rm-btn" onclick="this.parentElement.remove();markDirty();" title="Remove">✕</button>';
      document.getElementById('contentList').appendChild(li);
    }

    // ── Drag-to-reorder content items ─────────────────────────────
    (function() {
      var list = document.getElementById('contentList');
      if (!list) return;
      var _dragging = null;
      list.addEventListener('dragstart', function(e) {
        _dragging = e.target.closest('li');
        if (_dragging) { e.dataTransfer.effectAllowed = 'move'; setTimeout(function(){ if (_dragging) _dragging.style.opacity = '0.4'; }, 0); }
      });
      list.addEventListener('dragend', function() {
        if (_dragging) { _dragging.style.opacity = ''; _dragging = null; markDirty(); }
      });
      list.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!_dragging) return;
        var over = e.target.closest('li');
        if (over && over !== _dragging) {
          var rect = over.getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            list.insertBefore(_dragging, over);
          } else {
            list.insertBefore(_dragging, over.nextSibling);
          }
        }
      });
    })();

    function getContentBlocks() {
      return Array.from(document.querySelectorAll('#contentList li'))
        .map(function(li){ try{ return JSON.parse(li.dataset.item); }catch(e){ return null; } })
        .filter(Boolean);
    }

    function getLinks() {
      return getContentBlocks().filter(function(b){ return b.type==='link'; })
        .map(function(b){ return { label: b.label||'', url: b.url||'' }; });
    }

    // ── Lead form config ───────────────────────────────────────────
    function toggleLeadFormConfig() {
      const enabled = document.getElementById('leadFormEnabled').checked;
      document.getElementById('leadFormConfig').style.display = enabled ? 'block' : 'none';
    }

    function addCheckbox(value = '') {
      const li = document.createElement('li');
      li.className = 'checkbox-list-item';
      li.innerHTML =
        '<input type="text" placeholder="e.g. Free estimate, Emergency service, New installation" value="' + escAttr(value) + '" class="checkbox-option" />' +
        '<button class="rm-btn" onclick="this.parentElement.remove();markDirty();" title="Remove">✕</button>';
      document.getElementById('checkboxList').appendChild(li);
      if (value === '') markDirty(); // only mark dirty on user-initiated adds, not initial population
    }

    function getCheckboxOptions() {
      return Array.from(document.querySelectorAll('.checkbox-option'))
        .map(i => i.value.trim())
        .filter(v => v);
    }

    // ── Image upload ───────────────────────────────────────────────
    function handleImageUpload(input, type) {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) { alert('Image must be under 8 MB.'); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        // Compress: resize to max 900px, JPEG 0.85 — keeps base64 payload small
        const imgEl = new Image();
        imgEl.onload = () => {
          const MAX = 900;
          let w = imgEl.width, h = imgEl.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else       { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(imgEl, 0, 0, w, h);
          const b64 = canvas.toDataURL('image/jpeg', 0.85);
          if (type === 'headshot') {
            _headshotBase64 = b64;
            markDirty();
            const el = document.getElementById('headshotPreview');
            if (el.tagName === 'IMG') { el.src = b64; }
            else {
              const img = document.createElement('img');
              img.src = b64; img.className = 'tl-avatar'; img.id = 'headshotPreview';
              el.replaceWith(img);
            }
          } else {
            _logoBase64 = b64;
            markDirty();
            _qrLogoUrl  = b64;  // update QR logo preview live
            const el = document.getElementById('avatarPreview');
            if (el.tagName === 'IMG') { el.src = b64; }
            else {
              const img = document.createElement('img');
              img.src = b64; img.className = 'tl-avatar'; img.id = 'avatarPreview';
              el.replaceWith(img);
            }
            renderQRCode();
          }
        };
        imgEl.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // ── QR code rendering ────────────────────────────────────
    function renderQRCode() {
      const container = document.getElementById('qrCanvas');
      if (!container || !_qrTargetUrl) return;
      container.innerHTML = '';
      const opts = {
        width: 260, height: 260,
        data: _qrTargetUrl,
        dotsOptions:          { color: '#0a4d4d', type: _qrDotStyle },
        cornersSquareOptions: { color: '#0a4d4d', type: 'extra-rounded' },
        cornersDotOptions:    { color: '#0a4d4d' },
        backgroundOptions:    { color: '#ffffff' },
        qrOptions:            { errorCorrectionLevel: 'H' },
      };
      if (_qrLogoUrl) {
        opts.image = _qrLogoUrl;
        opts.imageOptions = { hideBackgroundDots: true, imageSize: 0.33, margin: 4 };
      }
      _qrCode = new QRCodeStyling(opts);
      _qrCode.append(container);
    }

    function setPhotoLayout(layout, silent) {
      _photoLayout = layout;
      if (!silent) markDirty();
      document.querySelectorAll('.pl-btn').forEach(b => b.classList.remove('active'));
      const map = { logo: 'plLogo', headshot: 'plHeadshot', both: 'plBoth' };
      const btn = document.getElementById(map[layout]);
      if (btn) btn.classList.add('active');
    }

    function setQRDotStyle(style) {
      _qrDotStyle = style;
      markDirty();
      document.querySelectorAll('.qr-dot-btn').forEach(b => b.classList.remove('active'));
      const idMap = { 'square': 'qrDotSquare', 'rounded': 'qrDotRounded', 'dots': 'qrDotDots', 'extra-rounded': 'qrDotExtraRounded' };
      const btn = document.getElementById(idMap[style]);
      if (btn) btn.classList.add('active');
      renderQRCode();
    }

    function downloadQR(ext) {
      if (_qrCode) _qrCode.download({ name: 'torrolink-qr', extension: ext || 'png' });
    }

    function copyProfileUrl() {
      var link = document.getElementById('profileUrlLink');
      var url  = link ? link.href : window.location.origin;
      var btn  = document.getElementById('copyUrlBtn');
      navigator.clipboard.writeText(url).then(function() {
        btn.textContent = '✓ Copied!';
        btn.style.background = '#16a34a';
        setTimeout(function(){ btn.textContent = '\u{1F4CB} Copy'; btn.style.background = '#0f6b6b'; }, 2000);
      }).catch(function() { prompt('Copy this link:', url); });
    }

    // ── Save profile ───────────────────────────────────────────────
    async function saveProfile() {
      if (!_session || !_profile) return;
      showMsg('', '');
      const btn = document.querySelector('[onclick="saveProfile()"]');
      btn.textContent = '⏳ Saving…'; btn.disabled = true; btn.style.background = '#888';

      const payload = {
        profileId:    _profile.id,
        businessName: document.getElementById('fieldBusinessName').value.trim(),
        tagline:      document.getElementById('fieldTagline').value.trim(),
        bio:          document.getElementById('fieldBio').value.trim(),
        phone:        document.getElementById('fieldPhone').value.trim(),
        videoUrl:     document.getElementById('fieldVideo').value.trim(),
        ownerName:    document.getElementById('fieldOwnerName').value.trim(),
        contentBlocks: getContentBlocks(),
        bgImageBase64: (_selectedPattern === 'custom' && _bgImageBase64) ? _bgImageBase64 : null,
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
        theme:              getThemePayload(),
        leadFormEnabled:    document.getElementById('leadFormEnabled').checked,
        leadFormHasTextbox: document.getElementById('leadHasTextbox').checked,
        leadFormCheckboxes: getCheckboxOptions(),
        logoBase64:         _logoBase64     || null,
        headshotBase64:     _headshotBase64 || null,
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
          _logoBase64 = null; _headshotBase64 = null; _dirty = false; // clear after successful save
          var _sb = document.querySelector('[onclick="saveProfile()"]');
          if (_sb) { _sb.style.outline = ''; _sb.style.outlineOffset = ''; _sb.title = ''; }
          btn.textContent = '✓ Saved!'; btn.style.background = '#16a34a';
          setTimeout(function(){ btn.textContent = 'Save Changes'; btn.style.background = ''; btn.disabled = false; }, 2200);
          const _pUrl = window.location.origin + '/p/' + (_profile ? _profile.handle : '');
          showMsg('success', '✓ Profile saved! <a href="' + _pUrl + '" target="_blank" rel="noopener" style="color:#0f6b6b;font-weight:700;">View live profile →</a>');
          return; // skip the finally reset
        } else if (res.status === 401) {
          // Session expired — try to refresh silently, then let user re-save
          const { data: { session: newSess } } = await _supabase.auth.refreshSession();
          if (newSess) {
            _session = newSess;
            showMsg('error', 'Session refreshed. Please click Save again.');
          } else {
            showMsg('error', 'Session expired. Please sign in again.');
            await _supabase.auth.signOut();
          }
        } else {
          showMsg('error', data.error || 'Save failed. Please try again.');
        }
      } catch (err) {
        showMsg('error', 'Network error. Please try again.');
      }

      btn.textContent = 'Save Changes'; btn.disabled = false; btn.style.background = '';
    }

    // ── Tab switching ──────────────────────────────────────────────
    // ── Reviews management ─────────────────────────────────────────
    function loadReviews() {
      if (!_profileId) return;
      var loading = document.getElementById('reviewsLoading');
      var list    = document.getElementById('reviewsList');
      var empty   = document.getElementById('reviewsEmpty');
      if (!loading) return;
      loading.style.display = 'block';
      loading.textContent = 'Loading reviews…';
      list.innerHTML = '';
      if (empty) empty.style.display = 'none';
      fetch('/.netlify/functions/portal-reviews?profileId=' + encodeURIComponent(_profileId), {
        headers: { 'Authorization': 'Bearer ' + _session.access_token }
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        loading.style.display = 'none';
        var reviews = data.reviews || [];
        if (!reviews.length){ if(empty) empty.style.display='block'; return; }
        list.innerHTML = reviews.map(function(r){ return renderReviewCard(r); }).join('');
      })
      .catch(function(){ loading.textContent = 'Failed to load. Please refresh.'; });
    }

    function renderReviewCard(r) {
      var filled  = '★'.repeat(r.rating||5) + '☆'.repeat(5-(r.rating||5));
      var date    = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '';
      var visBadge = r.is_visible
        ? '<span style="background:#d1fae5;color:#065f46;font-size:0.7rem;font-weight:700;padding:2px 9px;border-radius:20px;">Visible</span>'
        : '<span style="background:#fee2e2;color:#991b1b;font-size:0.7rem;font-weight:700;padding:2px 9px;border-radius:20px;">Hidden</span>';
      var featBadge = r.is_featured
        ? '<span style="background:#fef3c7;color:#92400e;font-size:0.7rem;font-weight:700;padding:2px 9px;border-radius:20px;margin-left:4px;">⭐ Featured</span>' : '';
      var hideAction = r.is_visible ? 'hide' : 'show';
      var hideLabel  = r.is_visible ? 'Hide' : 'Show';
      var featAction = r.is_featured ? 'unfeature' : 'feature';
      var featLabel  = r.is_featured ? 'Unfeature'  : '⭐ Feature';
      return (
        '<div style="border:1px solid #e5e5ea;border-radius:12px;padding:14px 16px;margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
          '<div><div style="color:#f4a724;letter-spacing:2px;">'+filled+'</div>' +
            '<div style="font-weight:600;font-size:0.9rem;">'+escHtml(r.reviewer_name||'Anonymous')+'</div>' +
            (date?'<div style="font-size:0.77rem;color:#888;">'+date+'</div>':'') +
          '</div>' +
          '<div>'+visBadge+featBadge+'</div>' +
        '</div>' +
        (r.review_text?'<p style="font-size:0.88rem;color:#444;margin:4px 0 12px;line-height:1.55;font-style:italic;">&ldquo;'+escHtml(r.review_text)+'&rdquo;</p>':'') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button data-rid="'+r.id+'" data-action="'+hideAction+'" onclick="reviewAction(this.dataset.rid,this.dataset.action)" class="rev-action-btn" style="background:'+(r.is_visible?'#fee2e2':'#d1fae5')+';color:'+(r.is_visible?'#991b1b':'#065f46')+';cursor:pointer;">'+hideLabel+'</button>' +
          '<button data-rid="'+r.id+'" data-action="'+featAction+'" onclick="reviewAction(this.dataset.rid,this.dataset.action)" class="rev-action-btn" style="background:#fef3c7;color:#92400e;cursor:pointer;">'+featLabel+'</button>' +
          '<button data-rid="'+r.id+'" data-action="delete" onclick="reviewAction(this.dataset.rid,this.dataset.action)" class="rev-action-btn" style="background:#fee2e2;color:#991b1b;cursor:pointer;">Delete</button>' +
        '</div></div>'
      );
    }

    async function reviewAction(reviewId, action) {
      if (action === 'delete' && !confirm('Delete this review permanently?')) return;
      try {
        var res = await fetch('/.netlify/functions/portal-reviews', {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+_session.access_token },
          body: JSON.stringify({ reviewId: reviewId, action: action })
        });
        if (res.ok) loadReviews();
        else alert('Action failed. Please try again.');
      } catch(e) { alert('Network error. Please try again.'); }
    }

    function switchTab(name) {
      const tabs = ['profile', 'links', 'themes', 'qr', 'reviews', 'gallery', 'upgrade'];
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', tabs[i] === name);
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      // Hide save button on upgrade tab
      const saveRow = document.getElementById('saveRow');
      if (name === 'reviews') loadReviews();
      if (saveRow) saveRow.style.display = name === 'upgrade' ? 'none' : 'block';
      // Build upgrade tab content on first open
      if (name === 'upgrade' && _profile) buildUpgradeTab(_profile);
    }

    // ── Upgrade tab ────────────────────────────────────────────────
    function buildUpgradeTab(profile) {
      const plan = _customer?.plan || 'qr-code';
      const hasStandard = plan.includes('branding') && !plan.includes('custom');
      const hasCustom   = plan.includes('custom');
      const hasBranding = hasStandard || hasCustom;
      const hasMetrics  = plan === 'metrics' || (_customer?.metrics_active === true);

      const SITE = window.location.origin;

      let cards = '';

      // ── Branding upgrades ──
      if (!hasBranding) {
        cards += upgradeCard({
          title:    'Standard Branding',
          price:    '$9.28',
          note:     'one time',
          desc:     'Your logo embedded in the center of your QR code. Preview and approve before we finalize.',
          features: ['Your logo in the QR center', 'High-res PNG delivered to inbox', 'Print-ready for cards, signs & vinyl'],
          plan:     'branding',
          cta:      'Add Standard Branding',
        });
        cards += upgradeCard({
          title:    'Custom Branding',
          price:    '$18.28',
          note:     'one time',
          desc:     'Full control — logo, custom dot style, QR color, and a "Scan Me" frame. You approve the design first.',
          features: ['Custom dot style & QR color', 'Optional "Scan Me" frame', 'High-res PDF, PNG & SVG'],
          plan:     'custom-branding',
          cta:      'Add Custom Branding',
          featured: true,
        });
      } else if (hasStandard && !hasCustom) {
        cards += upgradeCard({
          title:    'Upgrade to Custom Branding',
          price:    '$9.00',
          note:     'one time',
          desc:     'You already have Standard — upgrade to full custom colors, dot style, and a frame for just $9 more.',
          features: ['Custom dot style & QR color', 'Optional "Scan Me" frame', 'High-res PDF, PNG & SVG'],
          plan:     'custom-branding',
          cta:      'Upgrade to Custom',
          featured: true,
        });
      }

      // ── Metrics ──
      if (!hasMetrics) {
        cards += upgradeCard({
          title:    'Metrics & Leads',
          price:    '$10.28',
          note:     '/month',
          desc:     'See who is scanning your QR and automatically capture leads. Cancel anytime — your QR and profile stay active.',
          features: ['Real-time scan analytics', 'Lead capture form on your profile', 'All leads delivered to your inbox'],
          plan:     'metrics',
          cta:      'Add Metrics & Leads',
        });
      }

      // ── Buy another QR code ──
      cards += \`
        <div style="background:#fff;border:1px solid #e2e6ea;border-radius:12px;padding:24px 28px;">
          <h3 style="font-size:1rem;font-weight:700;margin:0 0 8px;">Need another QR code?</h3>
          <p style="font-size:0.88rem;color:#666;line-height:1.6;margin:0 0 16px;">
            Each QR code gets its own customizable profile page. If you want to market your business differently across events, platforms, or promotions — buy a new QR code and set it up separately.
          </p>
          <a href="/#pricing" style="display:inline-block;background:#1a1a2e;color:#fff;padding:10px 22px;border-radius:8px;font-size:0.88rem;font-weight:700;text-decoration:none;">
            Buy Another QR Code →
          </a>
        </div>\`;

      if (!cards) {
        cards = '<div style="text-align:center;padding:40px;color:#888;"><p style="font-size:1.1rem;font-weight:700;">You have everything! 🎉</p><p>Your plan is fully loaded. Buy another QR code if you need a separate profile.</p></div>';
      }

      document.getElementById('upgradeContent').innerHTML = \`
        <div style="display:flex;flex-direction:column;gap:16px;">\${cards}</div>\`;
    }

    function upgradeCard({ title, price, note, desc, features, plan, cta, featured }) {
      const border = featured ? 'border:2px solid #0f6b6b;' : 'border:1px solid #e2e6ea;';
      const btnStyle = featured
        ? 'background:#0f6b6b;color:#fff;'
        : 'background:#fff;color:#1a1a2e;border:1.5px solid #1a1a2e;';
      return \`
        <div style="background:#fff;\${border}border-radius:12px;padding:24px 28px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
            <div style="flex:1;min-width:200px;">
              <h3 style="font-size:1rem;font-weight:700;margin:0 0 4px;">\${title}</h3>
              <p style="font-size:1.4rem;font-weight:800;color:#0f6b6b;margin:0 0 8px;">\${price} <span style="font-size:0.85rem;font-weight:400;color:#888;">\${note}</span></p>
              <p style="font-size:0.88rem;color:#555;line-height:1.6;margin:0 0 12px;">\${desc}</p>
              <ul style="list-style:none;padding:0;margin:0;font-size:0.85rem;color:#444;display:flex;flex-direction:column;gap:4px;">
                \${features.map(f => '<li>✓ ' + f + '</li>').join('')}
              </ul>
            </div>
            <div style="padding-top:4px;">
              <button onclick="startUpgrade('\${plan}')" style="\${btnStyle}padding:10px 20px;border-radius:8px;font-family:inherit;font-size:0.88rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                \${cta} →
              </button>
            </div>
          </div>
        </div>\`;
    }

    async function startUpgrade(plan) {
      const email = _session?.user?.email || '';
      const businessName = _profile?.business_name || '';
      // Disable buttons while redirecting
      document.querySelectorAll('#upgradeContent button').forEach(function(b) {
        b.disabled = true; b.textContent = '⏳ Redirecting…';
      });
      try {
        const res = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, businessName, customerEmail: email }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Something went wrong. Please try again or email orders@torrolink.com');
          if (_profile) buildUpgradeTab(_profile);
        }
      } catch {
        alert('Something went wrong. Please try again or email orders@torrolink.com');
        if (_profile) buildUpgradeTab(_profile);
      }
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

    // ══════════════════════════════════════════════════════════
    // GALLERY & DOCUMENTS
    // ══════════════════════════════════════════════════════════

    var _photos    = [];
    var _documents = [];

    async function loadGallery() {
      if (!_profile) return;
      var pid = _profile.id;
      var results = await Promise.all([
        _supabase.from('profile_photos').select('id,file_url,caption,view_count,sort_order').eq('profile_id', pid).order('sort_order'),
        _supabase.from('profile_documents').select('id,file_url,title,file_type,sort_order').eq('profile_id', pid).order('sort_order'),
      ]);
      _photos    = results[0].data || [];
      _documents = results[1].data || [];
      renderGalleryGrid();
      renderDocumentsList();
    }

    function renderGalleryGrid() {
      var grid = document.getElementById('galleryGrid');
      if (!grid) return;
      if (!_photos.length) {
        grid.innerHTML = '<p class=\'gallery-empty\'>No photos yet. Add some below!</p>';
        return;
      }
      grid.innerHTML = _photos.map(function(ph) {
        return '<div class=\'gallery-item-p\'>' +
          '<div style=\'position:relative;\'>' +
            '<img src=\''+escHtml(ph.file_url)+'\' alt=\''+escHtml(ph.caption||'')+'\'  loading=\'lazy\' />' +
            '<span class=\'gallery-badge-p\'>&#128065; '+(ph.view_count||0)+'</span>' +
          '</div>' +
          '<input class=\'gallery-cap-p\' type=\'text\' value=\''+escHtml(ph.caption||'')+'\'  placeholder=\'Caption...\' onblur=\'saveCaption(\"'+escJs(ph.id)+'\",this.value)\' />' +
          '<button class=\'gallery-del-p\' onclick=\'deletePhoto(\"'+escJs(ph.id)+'\")\'  >&#10005; Remove</button>' +
        '</div>';
      }).join('');
    }

    function renderDocumentsList() {
      var list = document.getElementById('documentsList');
      if (!list) return;
      if (!_documents.length) {
        list.innerHTML = '<p style=\'color:#aaa;font-size:0.85rem;text-align:center;padding:12px 0;\'>No documents yet.</p>';
        return;
      }
      list.innerHTML = _documents.map(function(d) {
        var icon = d.file_type === 'pdf' ? '&#128196;' : '&#128221;';
        return '<div class=\'doc-item-p\' id=\'doc-'+escHtml(d.id)+'\' >' +
          '<span class=\'doc-icon-p\'>'+icon+'</span>' +
          '<div class=\'doc-body-p\'>' +
            '<input class=\'doc-title-p\' type=\'text\' value=\''+escHtml(d.title||'Document')+'\'  placeholder=\'Document title\' onblur=\'saveDocTitle(\"'+escJs(d.id)+'\",this.value)\' />' +
            '<a class=\'doc-view-p\' href=\''+escHtml(d.file_url)+'\' target=\'_blank\' rel=\'noopener\'>View document &#8599;</a>' +
          '</div>' +
          '<button class=\'doc-del-p\' onclick=\'deleteDocument(\"'+escJs(d.id)+'\")\'  >&#10005;</button>' +
        '</div>';
      }).join('');
    }

    function compressImageFile(file) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var img = new Image();
          img.onload = function() {
            var MAX = 1200;
            var w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
              else { w = Math.round(w * MAX / h); h = MAX; }
            }
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function fileToBase64(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    async function mediaPost(fn, data) {
      if (!_session) return { error: 'Not signed in' };
      var token = _session.access_token;
      try {
        var res = await fetch('/.netlify/functions/'+fn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ token: token }, data))
        });
        return await res.json();
      } catch(e) { return { error: e.message }; }
    }

    var _allowedPhotoExts = new Set(['jpg','jpeg','png','webp','gif']);
    async function handleGalleryUpload(input) {
      var files = Array.from(input.files || []);
      if (!files.length) return;
      var msg = document.getElementById('galleryMsg');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var _ext = file.name.split('.').pop().toLowerCase();
        if (!_allowedPhotoExts.has(_ext)) { msg.textContent = file.name+' is not a supported image type. Skipped.'; continue; }
        if (file.size > 8 * 1024 * 1024) { msg.textContent = file.name+' is too large (max 8 MB). Skipped.'; continue; }
        msg.textContent = 'Uploading '+(i+1)+' of '+files.length+'...';
        try {
          var b64 = await compressImageFile(file);
          var res = await mediaPost('upload-media', { type: 'photo', base64: b64, filename: file.name, caption: '' });
          if (res.ok && res.item) { _photos.push(res.item); renderGalleryGrid(); }
          else { msg.textContent = res.error || 'Upload failed'; }
        } catch(e) { msg.textContent = 'Error: '+e.message; }
      }
      msg.textContent = 'Done!';
      input.value = '';
      setTimeout(function(){ msg.textContent = ''; }, 2000);
    }

    var _allowedDocExts = new Set(['pdf','doc','docx']);
    async function handleDocUpload(input) {
      var file = input.files && input.files[0];
      if (!file) return;
      var msg = document.getElementById('docMsg');
      var _dext = file.name.split('.').pop().toLowerCase();
      if (!_allowedDocExts.has(_dext)) { msg.textContent = 'Unsupported file type. Please upload PDF, DOC, or DOCX.'; return; }
      if (file.size > 20 * 1024 * 1024) { msg.textContent = 'File too large (max 20 MB).'; return; }
      msg.textContent = 'Uploading...';
      try {
        var b64 = await fileToBase64(file);
        var title = file.name.replace(/\.[^.]+$/, '');
        var res = await mediaPost('upload-media', { type: 'document', base64: b64, filename: file.name, title: title });
        if (res.ok && res.item) { _documents.push(res.item); renderDocumentsList(); msg.textContent = 'Uploaded!'; }
        else { msg.textContent = res.error || 'Upload failed'; }
      } catch(e) { msg.textContent = 'Error: '+e.message; }
      input.value = '';
      setTimeout(function(){ msg.textContent = ''; }, 2000);
    }

    async function deletePhoto(id) {
      if (!confirm('Remove this photo?')) return;
      var res = await mediaPost('delete-media', { type: 'photo', itemId: id });
      if (res.ok) { _photos = _photos.filter(function(p){ return p.id !== id; }); renderGalleryGrid(); }
    }

    async function deleteDocument(id) {
      if (!confirm('Remove this document?')) return;
      var res = await mediaPost('delete-media', { type: 'document', itemId: id });
      if (res.ok) { _documents = _documents.filter(function(d){ return d.id !== id; }); renderDocumentsList(); }
    }

    async function saveCaption(id, caption) {
      var ph = _photos.find(function(p){ return p.id === id; });
      if (ph && ph.caption === caption) return;
      await mediaPost('update-media', { type: 'photo', itemId: id, caption: caption });
      if (ph) ph.caption = caption;
    }

    async function saveDocTitle(id, title) {
      var d = _documents.find(function(x){ return x.id === id; });
      if (d && d.title === title) return;
      await mediaPost('update-media', { type: 'document', itemId: id, title: title });
      if (d) d.title = title;
    }

    // ── Ctrl+S / Cmd+S shortcut to save ──────────────────────────
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        var saveRow = document.getElementById('saveRow');
        if (saveRow && saveRow.style.display !== 'none') {
          e.preventDefault();
          saveProfile();
        }
      }
    });

    // ── Dirty state: warn on tab close with unsaved changes ──────
    window.addEventListener('beforeunload', function(e) {
      if (_dirty && _profile) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    function markDirty() {
      if (!_profile) return;
      _dirty = true;
      var btn = document.querySelector('[onclick="saveProfile()"]');
      if (btn && btn.textContent !== '⏳ Saving…') {
        btn.style.outline = '2px solid #f4752b';
        btn.style.outlineOffset = '2px';
        btn.title = 'You have unsaved changes';
      }
    }
    document.addEventListener('input', function(e) {
      if (e.target.matches('input,textarea,select')) markDirty();
    });
    document.addEventListener('change', function(e) {
      if (e.target.matches('input,textarea,select')) markDirty();
    });

  </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
