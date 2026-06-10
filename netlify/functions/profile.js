// ================================================
// TORROLINK — PROFILE PAGE FUNCTION
// Serves the customer's public profile page at /p/:handle
// Fetches data from Supabase, renders full HTML
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  // Extract handle from path: /p/johnsplumbing → johnsplumbing
  const handle = event.path.replace(/^\/p\//, "").split("/")[0].toLowerCase();

  if (!handle) {
    return { statusCode: 302, headers: { Location: "/" } };
  }

  // Fetch profile from Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .eq("is_active", true)
    .single();

  if (error || !profile) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: notFoundPage(handle),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: renderProfile(profile),
  };
};

// ── HTML RENDERER ──────────────────────────────────────────────────────────────

function renderProfile(p) {
  const links = Array.isArray(p.links) ? p.links : [];
  const socials = p.socials || {};

  const socialIcons = {
    instagram: { icon: "📸", label: "Instagram" },
    facebook:  { icon: "👍", label: "Facebook" },
    twitter:   { icon: "🐦", label: "Twitter / X" },
    tiktok:    { icon: "🎵", label: "TikTok" },
    youtube:   { icon: "▶️", label: "YouTube" },
    linkedin:  { icon: "💼", label: "LinkedIn" },
    yelp:      { icon: "⭐", label: "Yelp" },
    google:    { icon: "🔍", label: "Google" },
  };

  const socialLinks = Object.entries(socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => {
      const info = socialIcons[platform] || { icon: "🔗", label: platform };
      return `<a href="${escHtml(url)}" target="_blank" rel="noopener" class="social-btn">
        <span>${info.icon}</span> ${info.label}
      </a>`;
    }).join("");

  const customLinks = links
    .filter(l => l.label && l.url)
    .map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener" class="link-btn">
      🔗 ${escHtml(l.label)}
    </a>`).join("");

  const videoEmbed = p.video_url
    ? `<div class="video-wrap">
        <iframe src="${toEmbedUrl(p.video_url)}" frameborder="0" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"></iframe>
      </div>`
    : "";

  const leadForm = p.lead_form_enabled
    ? buildLeadForm(p)
    : "";

  const checkboxOptions = (p.lead_form_checkboxes || [])
    .map(opt => `<label class="check-label">
      <input type="checkbox" name="interests" value="${escHtml(opt)}" />
      ${escHtml(opt)}
    </label>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(p.business_name || "Business Profile")} — Torrolink</title>
  <meta name="description" content="${escHtml(p.tagline || p.business_name || "")}" />
  <meta property="og:title" content="${escHtml(p.business_name || "")}" />
  <meta property="og:description" content="${escHtml(p.tagline || "")}" />
  ${p.logo_url ? `<meta property="og:image" content="${escHtml(p.logo_url)}" />` : ""}
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f5f7fa;
      color: #1a1a2e;
      min-height: 100vh;
    }

    /* ── HEADER BAND ─────────────────────────────── */
    .hero-band {
      background: linear-gradient(135deg, #0f6b6b 0%, #0a4a4a 100%);
      padding: 48px 24px 80px;
      text-align: center;
    }
    .logo-ring {
      width: 100px; height: 100px;
      border-radius: 50%;
      background: #fff;
      margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      border: 4px solid rgba(255,255,255,0.3);
    }
    .logo-ring img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .logo-placeholder {
      font-size: 2.8rem; line-height: 1;
    }
    .profile-photo {
      width: 86px; height: 86px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255,255,255,0.5);
      margin: 0 auto 16px;
      display: block;
    }
    .biz-name {
      font-size: 1.75rem; font-weight: 800;
      color: #fff; line-height: 1.2;
      margin-bottom: 8px;
    }
    .tagline {
      font-size: 1rem; color: rgba(255,255,255,0.8);
      line-height: 1.5;
    }

    /* ── CARD ─────────────────────────────────────── */
    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      margin: -40px auto 24px;
      max-width: 480px;
      padding: 28px 24px;
      position: relative;
    }
    .section-title {
      font-size: 0.75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 14px;
    }

    /* ── BUTTONS ──────────────────────────────────── */
    .link-btn, .social-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
      padding: 14px 18px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 0.95rem; font-weight: 600;
      margin-bottom: 10px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .link-btn:hover, .social-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .link-btn {
      background: #f0fafa;
      color: #0f6b6b;
      border: 1px solid #d0eaea;
    }
    .social-btn {
      background: #f7f7fa;
      color: #333;
      border: 1px solid #e5e5ea;
    }

    /* ── VIDEO ─────────────────────────────────────── */
    .video-wrap {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      border-radius: 14px;
      overflow: hidden;
    }
    .video-wrap iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }

    /* ── LEAD FORM ─────────────────────────────────── */
    .lead-form { margin-top: 4px; }
    .lead-form input, .lead-form textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #e5e5ea;
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: inherit;
      margin-bottom: 10px;
      outline: none;
      transition: border-color 0.2s;
    }
    .lead-form input:focus, .lead-form textarea:focus {
      border-color: #0f6b6b;
    }
    .checkboxes { margin-bottom: 12px; }
    .check-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9rem; color: #444;
      margin-bottom: 8px;
      cursor: pointer;
    }
    .check-label input { width: auto; margin: 0; }
    .submit-btn {
      width: 100%;
      padding: 14px;
      background: #0f6b6b;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem; font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .submit-btn:hover { background: #0a4a4a; }
    .submit-btn:disabled { background: #aaa; cursor: default; }
    .form-success {
      text-align: center; padding: 24px;
      color: #0f6b6b; font-weight: 600;
      font-size: 1rem; display: none;
    }

    /* ── FOOTER ─────────────────────────────────────── */
    .powered {
      text-align: center;
      padding: 20px 24px 40px;
      font-size: 0.8rem;
      color: #bbb;
    }
    .powered a { color: #0f6b6b; text-decoration: none; font-weight: 600; }

    /* ── MOBILE ──────────────────────────────────────── */
    @media (max-width: 520px) {
      .hero-band { padding: 40px 20px 72px; }
      .card { margin: -36px 16px 20px; }
      .biz-name { font-size: 1.5rem; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="hero-band">
    <div class="logo-ring">
      ${p.logo_url
        ? `<img src="${escHtml(p.logo_url)}" alt="${escHtml(p.business_name || "")} logo" />`
        : `<span class="logo-placeholder">🏢</span>`
      }
    </div>
    ${p.photo_url ? `<img src="${escHtml(p.photo_url)}" alt="Profile photo" class="profile-photo" />` : ""}
    <div class="biz-name">${escHtml(p.business_name || "Business Profile")}</div>
    ${p.tagline ? `<div class="tagline">${escHtml(p.tagline)}</div>` : ""}
  </div>

  <!-- LINKS -->
  ${customLinks ? `
  <div class="card">
    <div class="section-title">Links</div>
    ${customLinks}
  </div>` : ""}

  <!-- SOCIALS -->
  ${socialLinks ? `
  <div class="card">
    <div class="section-title">Find us on</div>
    ${socialLinks}
  </div>` : ""}

  <!-- INTRO VIDEO -->
  ${videoEmbed ? `
  <div class="card">
    <div class="section-title">Intro</div>
    ${videoEmbed}
  </div>` : ""}

  <!-- LEAD FORM -->
  ${leadForm}

  <!-- FOOTER -->
  <div class="powered">
    Powered by <a href="https://torrolink.com" target="_blank">Torrolink</a>
  </div>

  <script>
    // Lead form submission
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('leadSubmitBtn');
        btn.disabled = true;
        btn.textContent = 'Sending…';

        const formData = new FormData(leadForm);
        const interests = formData.getAll('interests');
        const payload = {
          profileHandle: '${escJs(p.handle)}',
          name: formData.get('lead_name'),
          phone: formData.get('lead_phone'),
          email: formData.get('lead_email'),
          comment: formData.get('lead_comment'),
          interests,
        };

        try {
          await fetch('/.netlify/functions/lead-router-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          document.getElementById('leadSuccess').style.display = 'block';
          leadForm.style.display = 'none';
        } catch {
          btn.disabled = false;
          btn.textContent = 'Send →';
          alert('Something went wrong. Please try again.');
        }
      });
    }
  </script>
</body>
</html>`;
}

// ── LEAD FORM BUILDER ──────────────────────────────────────────────────────────

function buildLeadForm(p) {
  const checkboxes = (p.lead_form_checkboxes || [])
    .map(opt => `<label class="check-label">
      <input type="checkbox" name="interests" value="${escHtml(opt)}" />
      ${escHtml(opt)}
    </label>`).join("");

  const textbox = p.lead_form_has_textbox
    ? `<textarea name="lead_comment" rows="3" placeholder="Tell us what you need…"></textarea>`
    : "";

  return `
  <div class="card">
    <div class="section-title">Get in Touch</div>
    <form class="lead-form" id="leadForm">
      <input type="text" name="lead_name" placeholder="Your name" required />
      <input type="tel" name="lead_phone" placeholder="Phone number" />
      <input type="email" name="lead_email" placeholder="Email address" />
      ${checkboxes ? `<div class="checkboxes">${checkboxes}</div>` : ""}
      ${textbox}
      <button type="submit" class="submit-btn" id="leadSubmitBtn">Send →</button>
    </form>
    <div class="form-success" id="leadSuccess">
      ✅ Got it! We'll be in touch soon.
    </div>
  </div>`;
}

// ── 404 PAGE ──────────────────────────────────────────────────────────────────

function notFoundPage(handle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Profile Not Found — Torrolink</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 80px 24px; background: #f5f7fa; color: #333; }
    h1 { font-size: 2rem; color: #0f6b6b; margin-bottom: 12px; }
    p { color: #666; margin-bottom: 32px; }
    a { color: #0f6b6b; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Profile not found</h1>
  <p>The profile <strong>/${escHtml(handle)}</strong> doesn't exist or has been removed.</p>
  <a href="https://torrolink.com">Get your own Torrolink →</a>
</body>
</html>`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function escJs(str) {
  return String(str || "").replace(/'/g, "\\'").replace(/\\/g, "\\\\");
}

function toEmbedUrl(url) {
  // Convert YouTube watch URLs to embed URLs
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}
