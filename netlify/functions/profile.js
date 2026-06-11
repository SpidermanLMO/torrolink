// ================================================
// TORROLINK — PROFILE PAGE FUNCTION
// Serves the customer's public profile page at /p/:handle
// Full theme engine: patterns, dark mode, photo carousel, section controls
// ================================================

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const handle = event.path.replace(/^\/p\//, "").split("/")[0].toLowerCase();
  if (!handle) return { statusCode: 302, headers: { Location: "/" } };

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
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: renderProfile(profile),
  };
};

// ── THEME ENGINE ───────────────────────────────────────────────────────────────

function getThemeCSS(theme = {}) {
  const pattern    = theme.pattern    || "solid";
  const color1     = theme.color1     || "#0f6b6b";
  const color2     = theme.color2     || "#0a4d4d";
  const darkMode   = theme.darkMode   || false;
  const cardStyle  = theme.cardStyle  || "rounded";

  const cardBg     = darkMode ? "#1a1a2e" : "#ffffff";
  const cardBorder = darkMode ? "#2d2d4a" : "#e5e5ea";
  const textPri    = darkMode ? "#f0f0f0" : "#1a1a2e";
  const textSec    = darkMode ? "#a0a0c0" : "#555577";
  const pageBg     = darkMode ? "#0e0e1a" : "#f5f7fa";
  const linkBg     = darkMode ? "#1f2f2f" : "#f0fafa";
  const linkBorder = darkMode ? "#2a4040" : "#d0eaea";
  const linkColor  = darkMode ? "#5ac8c8" : "#0f6b6b";
  const socBg      = darkMode ? "#1e1e30" : "#f7f7fa";
  const socBorder  = darkMode ? "#2d2d4a" : "#e5e5ea";
  const socColor   = darkMode ? "#d0d0f0" : "#333";
  const cardRadius = cardStyle === "sharp" ? "8px" : cardStyle === "pill" ? "28px" : "20px";

  const patterns = {
    solid: `background: ${color1};`,
    gradient: `background: linear-gradient(135deg, ${color1} 0%, ${color2} 100%);`,
    camo: `background-color: ${color1};
      background-image:
        radial-gradient(ellipse 60px 40px at 20% 30%, ${adjustAlpha(color2, 0.8)} 0%, transparent 70%),
        radial-gradient(ellipse 40px 60px at 70% 60%, ${adjustAlpha(color2, 0.7)} 0%, transparent 70%),
        radial-gradient(ellipse 50px 35px at 50% 10%, #2d4a1e80 0%, transparent 70%),
        radial-gradient(ellipse 35px 50px at 10% 70%, #1a3a1280 0%, transparent 70%),
        radial-gradient(ellipse 45px 30px at 80% 20%, #4a6a2880 0%, transparent 70%),
        radial-gradient(ellipse 30px 45px at 40% 80%, #2a4a1a80 0%, transparent 70%);`,
    leopard: `background-color: ${color1};
      background-image:
        radial-gradient(ellipse 12px 10px at 15% 20%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 8px 12px at 17% 18%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 10px 8px at 13% 23%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 12px 10px at 45% 55%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 8px 12px at 47% 53%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 10px 8px at 43% 58%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 12px 10px at 75% 25%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 8px 12px at 77% 23%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 12px 10px at 25% 75%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 8px 12px at 27% 73%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 12px 10px at 60% 85%, ${color2} 60%, transparent 100%),
        radial-gradient(ellipse 8px 12px at 62% 83%, ${color2} 60%, transparent 100%);`,
    tropical: `background-color: ${color1};
      background-image:
        radial-gradient(ellipse 30px 60px at 10% 50%, #00805080 0%, transparent 70%),
        radial-gradient(ellipse 20px 50px at 90% 30%, #00804080 0%, transparent 70%),
        radial-gradient(ellipse 25px 55px at 50% 90%, #00806080 0%, transparent 70%),
        radial-gradient(circle 8px at 30% 20%, #ff6b9d90 0%, transparent 70%),
        radial-gradient(circle 6px at 70% 70%, #ff9f4390 0%, transparent 70%),
        radial-gradient(circle 7px at 20% 80%, #ffcd3c90 0%, transparent 70%),
        radial-gradient(circle 5px at 80% 10%, #ff6b6b90 0%, transparent 70%),
        radial-gradient(circle 9px at 55% 40%, #c44dff80 0%, transparent 70%);`,
    marble: `background: linear-gradient(
        105deg,
        ${color1} 0%,
        ${color2} 20%,
        ${adjustAlpha("#ffffff", 0.15)} 30%,
        ${color2} 40%,
        ${color1} 55%,
        ${adjustAlpha("#ffffff", 0.1)} 65%,
        ${color2} 75%,
        ${color1} 100%
      );`,
    carbon: `background-color: #1a1a1a;
      background-image:
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(255,255,255,0.03) 2px,
          rgba(255,255,255,0.03) 4px
        ),
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 2px,
          rgba(255,255,255,0.05) 2px,
          rgba(255,255,255,0.05) 4px
        );`,
    wood: `background: linear-gradient(
        170deg,
        #8B5E3C 0%,
        #A0714F 8%,
        #7a4f2d 16%,
        #9a6540 24%,
        #b07848 32%,
        #8a5c38 40%,
        #a06840 48%,
        #7c5030 56%,
        #9a6540 64%,
        #b27a4a 72%,
        #8c5e3a 80%,
        #a06840 88%,
        #7a4e2c 100%
      );`,
    america: `background: linear-gradient(
        180deg,
        #B22234 0%, #B22234 8%,
        #FFFFFF 8%, #FFFFFF 16%,
        #B22234 16%, #B22234 24%,
        #FFFFFF 24%, #FFFFFF 32%,
        #B22234 32%, #B22234 40%,
        #FFFFFF 40%, #FFFFFF 48%,
        #B22234 48%, #B22234 56%,
        #FFFFFF 56%, #FFFFFF 64%,
        #B22234 64%, #B22234 72%,
        #FFFFFF 72%, #FFFFFF 80%,
        #B22234 80%, #B22234 88%,
        #FFFFFF 88%, #FFFFFF 100%
      );
      position: relative;`,
  };

  const headerBg = patterns[pattern] || patterns.solid;

  // America's 250th — star canton overlay handled in HTML
  const americaOverlay = pattern === "america"
    ? `<div style="position:absolute;top:0;left:0;width:40%;height:54%;background:#3C3B6E;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;padding:6px;">
        ${"★ ".repeat(50).trim().split(" ").map(s => `<span style="color:#fff;font-size:10px;line-height:1.4;">${s}</span>`).join("")}
       </div>`
    : "";

  return { headerBg, cardBg, cardBorder, textPri, textSec, pageBg, linkBg, linkBorder, linkColor, socBg, socBorder, socColor, cardRadius, darkMode, americaOverlay, pattern };
}

function adjustAlpha(hex, alpha) {
  // Returns rgba from hex + alpha
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── HTML RENDERER ──────────────────────────────────────────────────────────────

function renderProfile(p) {
  const theme    = (typeof p.theme === "object" && p.theme) ? p.theme : {};
  const t        = getThemeCSS(theme);
  const links    = Array.isArray(p.links)   ? p.links   : [];
  const socials  = p.socials || {};
  const sections = theme.sections || {};

  // Section visibility defaults (true = show)
  const showLinks   = sections.links   !== false;
  const showSocials = sections.socials !== false;
  const showVideo   = sections.video   !== false;
  const showLead    = sections.lead    !== false;
  const showBio     = sections.bio     !== false;

  // ── CAROUSEL ────────────────────────────────────────────────────────────────
  // Slides: [logo, headshot, ...extra photos]
  const photos = [];
  if (p.logo_url)  photos.push({ src: p.logo_url,  label: p.business_name || "", type: "logo" });
  if (p.photo_url) photos.push({ src: p.photo_url, label: p.owner_name    || "", type: "person" });
  if (Array.isArray(p.gallery)) p.gallery.forEach(g => photos.push({ src: g.url, label: g.caption || "", type: "gallery" }));

  const carouselSlides = photos.map((ph, i) =>
    `<div class="slide${i === 0 ? " active" : ""}" data-index="${i}">
      <div class="avatar-ring${ph.type === "person" ? " person-ring" : ""}">
        <img src="${escHtml(ph.src)}" alt="${escHtml(ph.label)}" loading="${i === 0 ? "eager" : "lazy"}" />
      </div>
      ${ph.label ? `<p class="slide-label">${escHtml(ph.label)}</p>` : ""}
    </div>`
  ).join("");

  const carouselDots = photos.length > 1
    ? `<div class="carousel-dots">${photos.map((_, i) => `<button class="dot${i === 0 ? " active" : ""}" data-dot="${i}" aria-label="Photo ${i + 1}"></button>`).join("")}</div>`
    : "";

  const carouselArrows = photos.length > 1
    ? `<button class="carousel-arrow left" onclick="carouselPrev()" aria-label="Previous">&#8249;</button>
       <button class="carousel-arrow right" onclick="carouselNext()" aria-label="Next">&#8250;</button>`
    : "";

  // ── LINKS ───────────────────────────────────────────────────────────────────
  const customLinks = showLinks ? links
    .filter(l => l.label && l.url)
    .map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener" class="link-btn">
      <span class="btn-icon">🔗</span> ${escHtml(l.label)}
    </a>`).join("") : "";

  // ── SOCIALS ─────────────────────────────────────────────────────────────────
  const socialDefs = {
    instagram: { icon: "📸", label: "Instagram" },
    facebook:  { icon: "👍", label: "Facebook" },
    twitter:   { icon: "🐦", label: "Twitter / X" },
    tiktok:    { icon: "🎵", label: "TikTok" },
    youtube:   { icon: "▶️", label: "YouTube" },
    linkedin:  { icon: "💼", label: "LinkedIn" },
    yelp:      { icon: "⭐", label: "Yelp" },
    google:    { icon: "🔍", label: "Google" },
  };

  const socialLinks = showSocials ? Object.entries(socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => {
      const info = socialDefs[platform] || { icon: "🔗", label: platform };
      return `<a href="${escHtml(url)}" target="_blank" rel="noopener" class="social-btn">
        <span class="btn-icon">${info.icon}</span> ${info.label}
      </a>`;
    }).join("") : "";

  // ── VIDEO ───────────────────────────────────────────────────────────────────
  const videoEmbed = (showVideo && p.video_url)
    ? `<div class="card"><div class="section-title">Intro</div>
        <div class="video-wrap">
          <iframe src="${toEmbedUrl(p.video_url)}" frameborder="0" allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"></iframe>
        </div>
       </div>` : "";

  // ── BIO ─────────────────────────────────────────────────────────────────────
  const bioSection = (showBio && p.bio)
    ? `<div class="card"><div class="section-title">About</div>
        <p class="bio-text">${escHtml(p.bio)}</p>
       </div>` : "";

  // ── PHONE ───────────────────────────────────────────────────────────────────
  const phoneSection = p.phone
    ? `<a href="tel:${escHtml(p.phone)}" class="link-btn phone-btn">
        <span class="btn-icon">📞</span> ${escHtml(p.phone)}
       </a>` : "";

  // ── LEAD FORM ────────────────────────────────────────────────────────────────
  const leadSection = (showLead && p.lead_form_enabled) ? buildLeadForm(p) : "";

  // ── AMERICA CANTON ───────────────────────────────────────────────────────────
  const stars50 = Array(50).fill("★").join(" ");

  return `<!DOCTYPE html>
<html lang="en"${t.darkMode ? ' class="dark"' : ""}>
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
      background: ${t.pageBg};
      color: ${t.textPri};
      min-height: 100vh;
      transition: background 0.3s;
    }

    /* ── HEADER ─────────────────────────────────── */
    .hero-band {
      ${t.headerBg}
      padding: 48px 24px 80px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    /* America canton */
    .star-canton {
      position: absolute; top: 0; left: 0;
      width: 38%; max-width: 140px;
      background: #3C3B6E;
      padding: 6px 4px;
      display: flex; flex-wrap: wrap; gap: 1px;
      align-content: flex-start;
    }
    .star-canton span { color: #fff; font-size: 9px; line-height: 1.5; }

    .carousel {
      position: relative;
      width: 120px; margin: 0 auto 16px;
    }
    .slide { display: none; text-align: center; }
    .slide.active { display: block; }
    .avatar-ring {
      width: 100px; height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      margin: 0 auto 8px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      border: 4px solid rgba(255,255,255,0.35);
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .avatar-ring.person-ring { border-color: rgba(255,255,255,0.6); }
    .avatar-ring img { width: 100%; height: 100%; object-fit: cover; }
    .slide-label {
      color: rgba(255,255,255,0.85);
      font-size: 0.75rem; font-weight: 600;
      text-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .carousel-arrow {
      position: absolute; top: 38px;
      background: rgba(255,255,255,0.2);
      border: none; color: #fff; font-size: 1.6rem;
      width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      line-height: 1; padding: 0;
      transition: background 0.15s;
    }
    .carousel-arrow:hover { background: rgba(255,255,255,0.35); }
    .carousel-arrow.left  { left: -14px; }
    .carousel-arrow.right { right: -14px; }
    .carousel-dots { display: flex; gap: 6px; justify-content: center; margin-top: 10px; }
    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: rgba(255,255,255,0.4); border: none; cursor: pointer;
      padding: 0; transition: background 0.2s;
    }
    .dot.active { background: #fff; }

    .biz-name {
      font-size: 1.75rem; font-weight: 800;
      color: #fff; line-height: 1.2; margin-bottom: 8px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .tagline {
      font-size: 1rem; color: rgba(255,255,255,0.85);
      line-height: 1.5;
      text-shadow: 0 1px 4px rgba(0,0,0,0.25);
    }
    /* Carbon/wood — always light text */
    .hero-band.dark-header .biz-name,
    .hero-band.dark-header .tagline,
    .hero-band.dark-header .slide-label { color: #f0f0f0; }

    /* ── CARDS ───────────────────────────────────── */
    .card {
      background: ${t.cardBg};
      border-radius: ${t.cardRadius};
      box-shadow: 0 4px 24px rgba(0,0,0,${t.darkMode ? "0.3" : "0.08"});
      margin: -40px auto 20px;
      max-width: 480px;
      padding: 28px 24px;
      position: relative;
      border: 1px solid ${t.cardBorder};
    }
    .card + .card { margin-top: 0; }

    .section-title {
      font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: ${t.textSec};
      margin-bottom: 14px;
    }

    /* ── BUTTONS ─────────────────────────────────── */
    .link-btn, .social-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 14px 18px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 0.95rem; font-weight: 600;
      margin-bottom: 10px;
      transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
      color: ${t.linkColor};
      background: ${t.linkBg};
      border: 1px solid ${t.linkBorder};
    }
    .social-btn {
      color: ${t.socColor};
      background: ${t.socBg};
      border-color: ${t.socBorder};
    }
    .link-btn:hover, .social-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0,0,0,${t.darkMode ? "0.3" : "0.1"});
    }
    .phone-btn { color: ${t.linkColor}; background: ${t.linkBg}; border-color: ${t.linkBorder}; }
    .btn-icon { font-size: 1.1rem; flex-shrink: 0; }

    /* ── BIO ─────────────────────────────────────── */
    .bio-text {
      font-size: 0.95rem; color: ${t.textSec};
      line-height: 1.75; white-space: pre-wrap;
    }

    /* ── VIDEO ───────────────────────────────────── */
    .video-wrap {
      position: relative; padding-bottom: 56.25%;
      height: 0; border-radius: 12px; overflow: hidden;
    }
    .video-wrap iframe {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
    }

    /* ── LEAD FORM ───────────────────────────────── */
    .lead-form input, .lead-form textarea {
      width: 100%; padding: 12px 14px;
      border: 1.5px solid ${t.cardBorder};
      border-radius: 10px;
      font-size: 0.95rem; font-family: inherit;
      margin-bottom: 10px; outline: none;
      background: ${t.darkMode ? "#12121f" : "#fafafa"};
      color: ${t.textPri};
      transition: border-color 0.2s;
    }
    .lead-form input:focus, .lead-form textarea:focus { border-color: #0f6b6b; }
    .check-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9rem; color: ${t.textSec};
      margin-bottom: 8px; cursor: pointer;
    }
    .check-label input { width: auto; margin: 0; accent-color: #0f6b6b; }
    .checkboxes { margin-bottom: 12px; }
    .submit-btn {
      width: 100%; padding: 14px;
      background: #0f6b6b; color: #fff;
      border: none; border-radius: 12px;
      font-size: 1rem; font-weight: 700;
      cursor: pointer; font-family: inherit;
      transition: background 0.2s, transform 0.15s;
    }
    .submit-btn:hover { background: #0a4a4a; transform: translateY(-1px); }
    .submit-btn:disabled { background: #aaa; cursor: default; transform: none; }
    .form-success {
      text-align: center; padding: 24px;
      color: #0f6b6b; font-weight: 600;
      font-size: 1rem; display: none;
    }

    /* ── HOLIDAY BADGE ───────────────────────────── */
    .holiday-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: #fff; font-size: 0.75rem; font-weight: 700;
      padding: 4px 12px; border-radius: 20px;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.3);
    }

    /* ── FOOTER ──────────────────────────────────── */
    .powered {
      text-align: center; padding: 16px 24px 40px;
      font-size: 0.8rem; color: ${t.textSec};
    }
    .powered a { color: #0f6b6b; text-decoration: none; font-weight: 600; }

    /* ── MOBILE ──────────────────────────────────── */
    @media (max-width: 520px) {
      .hero-band { padding: 40px 20px 72px; }
      .card { margin: -36px 16px 16px; }
      .biz-name { font-size: 1.5rem; }
    }
  </style>
</head>
<body>

  <div class="hero-band${(t.pattern === "carbon" || t.pattern === "wood") ? " dark-header" : ""}">
    ${t.pattern === "america" ? `<div class="star-canton">${Array(50).fill('<span>★</span>').join("")}</div>` : ""}
    ${t.pattern === "america" ? `<div class="holiday-badge">🇺🇸 America's 250th</div><br>` : ""}

    <div class="carousel">
      ${carouselArrows}
      ${carouselSlides || `<div class="slide active"><div class="avatar-ring"><span style="font-size:2.5rem;">🏢</span></div></div>`}
      ${carouselDots}
    </div>

    <div class="biz-name">${escHtml(p.business_name || "Business Profile")}</div>
    ${p.tagline ? `<div class="tagline">${escHtml(p.tagline)}</div>` : ""}
  </div>

  ${bioSection}

  ${(phoneSection || customLinks) ? `
  <div class="card">
    ${p.phone ? `<div class="section-title">Contact</div>${phoneSection}` : ""}
    ${customLinks ? `<div class="section-title" style="margin-top:${p.phone ? "16px" : "0"}">Links</div>${customLinks}` : ""}
  </div>` : ""}

  ${socialLinks ? `
  <div class="card">
    <div class="section-title">Find us on</div>
    ${socialLinks}
  </div>` : ""}

  ${videoEmbed}

  ${leadSection}

  <div class="powered">
    Powered by <a href="https://torrolink.com" target="_blank" rel="noopener">Torrolink</a>
  </div>

  <script>
    // ── Carousel ────────────────────────────────────────────────────────
    var _slides = document.querySelectorAll('.slide');
    var _dots   = document.querySelectorAll('.dot');
    var _cur    = 0;

    function carouselGo(n) {
      if (!_slides.length) return;
      _slides[_cur].classList.remove('active');
      if (_dots[_cur]) _dots[_cur].classList.remove('active');
      _cur = (n + _slides.length) % _slides.length;
      _slides[_cur].classList.add('active');
      if (_dots[_cur]) _dots[_cur].classList.add('active');
    }
    function carouselNext() { carouselGo(_cur + 1); }
    function carouselPrev() { carouselGo(_cur - 1); }

    _dots.forEach(function(dot) {
      dot.addEventListener('click', function() { carouselGo(parseInt(this.dataset.dot)); });
    });

    // Touch swipe
    var _touchX = 0;
    var hero = document.querySelector('.hero-band');
    if (hero) {
      hero.addEventListener('touchstart', function(e) { _touchX = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].clientX - _touchX;
        if (Math.abs(dx) > 40) { dx < 0 ? carouselNext() : carouselPrev(); }
      }, { passive: true });
    }

    // ── Lead form ────────────────────────────────────────────────────────
    var leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var btn = document.getElementById('leadSubmitBtn');
        btn.disabled = true; btn.textContent = 'Sending…';
        var fd = new FormData(leadForm);
        var payload = {
          profileId: '${escJs(p.id)}',
          name:      fd.get('lead_name'),
          phone:     fd.get('lead_phone'),
          email:     fd.get('lead_email'),
          message:   fd.get('lead_comment'),
          interests: fd.getAll('interests'),
        };
        try {
          await fetch('/.netlify/functions/lead-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          document.getElementById('leadSuccess').style.display = 'block';
          leadForm.style.display = 'none';
        } catch {
          btn.disabled = false; btn.textContent = 'Send →';
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
      <input type="checkbox" name="interests" value="${escHtml(opt)}" /> ${escHtml(opt)}
    </label>`).join("");

  const textbox = p.lead_form_has_textbox
    ? `<textarea name="lead_comment" rows="3" placeholder="Tell us what you need…"></textarea>` : "";

  return `<div class="card">
    <div class="section-title">Get in Touch</div>
    <form class="lead-form" id="leadForm">
      <input type="text"  name="lead_name"  placeholder="Your name"     required />
      <input type="tel"   name="lead_phone" placeholder="Phone number" />
      <input type="email" name="lead_email" placeholder="Email address" />
      ${checkboxes ? `<div class="checkboxes">${checkboxes}</div>` : ""}
      ${textbox}
      <button type="submit" class="submit-btn" id="leadSubmitBtn">Send →</button>
    </form>
    <div class="form-success" id="leadSuccess">✅ Got it! We'll be in touch soon.</div>
  </div>`;
}

// ── 404 PAGE ──────────────────────────────────────────────────────────────────

function notFoundPage(handle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Profile Not Found — Torrolink</title>
  <style>body{font-family:sans-serif;text-align:center;padding:80px 24px;background:#f5f7fa;color:#333;}h1{font-size:2rem;color:#0f6b6b;margin-bottom:12px;}p{color:#666;margin-bottom:32px;}a{color:#0f6b6b;font-weight:700;text-decoration:none;}</style>
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
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function escJs(str) {
  return String(str || "").replace(/'/g, "\\'").replace(/\\/g, "\\\\");
}

function toEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
