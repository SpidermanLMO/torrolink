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

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, review_text, is_featured, submitted_at")
    .eq("profile_id", profile.id)
    .eq("is_visible", true)
    .order("is_featured", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(20);

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: renderProfile(profile, reviews || []),
  };
};

// ── THEME ENGINE ───────────────────────────────────────────────────────────────

function getThemeCSS(theme = {}, backgroundImage = null) {
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
    camo: (() => {
      const camoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><ellipse cx="45" cy="35" rx="55" ry="40" fill="rgba(0,0,0,0.42)" transform="rotate(-20,45,35)"/><ellipse cx="155" cy="80" rx="62" ry="44" fill="rgba(20,40,5,0.66)"/><ellipse cx="25" cy="158" rx="48" ry="64" fill="rgba(0,0,0,0.36)" transform="rotate(12,25,158)"/><ellipse cx="172" cy="168" rx="58" ry="40" fill="rgba(35,25,5,0.58)"/><ellipse cx="118" cy="28" rx="44" ry="58" fill="rgba(10,30,0,0.5)" transform="rotate(25,118,28)"/><ellipse cx="98" cy="118" rx="52" ry="38" fill="rgba(0,0,0,0.38)" transform="rotate(-8,98,118)"/><ellipse cx="162" cy="132" rx="36" ry="48" fill="rgba(45,32,5,0.52)" transform="rotate(18,162,132)"/></svg>`;
      return `background-color: ${color1}; background-image: url("data:image/svg+xml,${encodeURIComponent(camoSvg)}"); background-size: cover;`;
    })(),
    leopard: (() => {
      const lSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130"><ellipse cx="22" cy="20" rx="15" ry="11" fill="${color2}" opacity="0.93"/><ellipse cx="22" cy="20" rx="7" ry="5" fill="${color1}" opacity="0.97"/><ellipse cx="72" cy="62" rx="11" ry="16" fill="${color2}" opacity="0.93" transform="rotate(22,72,62)"/><ellipse cx="72" cy="62" rx="5" ry="8" fill="${color1}" opacity="0.97" transform="rotate(22,72,62)"/><ellipse cx="104" cy="18" rx="13" ry="10" fill="${color2}" opacity="0.93" transform="rotate(-18,104,18)"/><ellipse cx="104" cy="18" rx="6" ry="4.5" fill="${color1}" opacity="0.97" transform="rotate(-18,104,18)"/><ellipse cx="28" cy="85" rx="10" ry="14" fill="${color2}" opacity="0.93" transform="rotate(12,28,85)"/><ellipse cx="28" cy="85" rx="4.5" ry="6.5" fill="${color1}" opacity="0.97" transform="rotate(12,28,85)"/><ellipse cx="96" cy="88" rx="14" ry="10" fill="${color2}" opacity="0.93" transform="rotate(-28,96,88)"/><ellipse cx="96" cy="88" rx="6.5" ry="4.5" fill="${color1}" opacity="0.97" transform="rotate(-28,96,88)"/><ellipse cx="52" cy="112" rx="12" ry="9" fill="${color2}" opacity="0.93"/><ellipse cx="52" cy="112" rx="5.5" ry="4" fill="${color1}" opacity="0.97"/><ellipse cx="118" cy="108" rx="9" ry="13" fill="${color2}" opacity="0.93" transform="rotate(15,118,108)"/><ellipse cx="118" cy="108" rx="4" ry="6" fill="${color1}" opacity="0.97" transform="rotate(15,118,108)"/></svg>`;
      return `background-color: ${color1}; background-image: url("data:image/svg+xml,${encodeURIComponent(lSvg)}"); background-size: 130px 130px; background-repeat: repeat;`;
    })(),
    tropical: (() => {
      const tSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><ellipse cx="-5" cy="110" rx="20" ry="88" fill="rgba(0,145,55,0.88)" transform="rotate(-38,-5,110)"/><ellipse cx="225" cy="85" rx="17" ry="78" fill="rgba(0,165,65,0.82)" transform="rotate(42,225,85)"/><ellipse cx="110" cy="225" rx="16" ry="82" fill="rgba(0,135,52,0.85)" transform="rotate(16,110,225)"/><ellipse cx="35" cy="-5" rx="13" ry="70" fill="rgba(0,155,60,0.78)" transform="rotate(-22,35,-5)"/><ellipse cx="185" cy="220" rx="18" ry="80" fill="rgba(0,150,58,0.83)" transform="rotate(32,185,220)"/><ellipse cx="155" cy="45" rx="14" ry="68" fill="rgba(0,140,50,0.76)" transform="rotate(-12,155,45)"/><circle cx="78" cy="68" r="15" fill="rgba(255,55,100,0.92)"/><circle cx="78" cy="68" r="5.5" fill="rgba(255,210,0,0.97)"/><circle cx="152" cy="152" r="13" fill="rgba(255,140,0,0.9)"/><circle cx="152" cy="152" r="5" fill="rgba(255,235,0,0.97)"/><circle cx="118" cy="28" r="8" fill="rgba(255,75,155,0.85)"/><circle cx="118" cy="28" r="3" fill="rgba(255,230,0,0.95)"/><circle cx="42" cy="168" r="7" fill="rgba(255,185,0,0.88)"/><circle cx="42" cy="168" r="2.5" fill="rgba(255,245,0,0.97)"/></svg>`;
      return `background-color: ${color1}; background-image: url("data:image/svg+xml,${encodeURIComponent(tSvg)}"); background-size: cover;`;
    })(),
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

  };

  const headerBg = backgroundImage
    ? `background-image: url('${escHtml(backgroundImage)}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : (patterns[pattern] || patterns.solid);



  return { headerBg, cardBg, cardBorder, textPri, textSec, pageBg, linkBg, linkBorder, linkColor, socBg, socBorder, socColor, cardRadius, darkMode, pattern };
}

function adjustAlpha(hex, alpha) {
  // Returns rgba from hex + alpha
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── SOCIAL ICONS (SVG, no emojis) ────────────────────────────────────────────
function normalizeSocialUrl(platform, val) {
  if (!val) return '';
  val = String(val).trim();
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  const handle = val.replace(/^@/, '');
  const bases = {
    instagram: 'https://www.instagram.com/',
    tiktok:    'https://www.tiktok.com/@',
    twitter:   'https://x.com/',
    facebook:  'https://www.facebook.com/',
    youtube:   'https://www.youtube.com/',
    linkedin:  'https://www.linkedin.com/in/',
    yelp:      'https://www.yelp.com/biz/',
    google:    'https://www.google.com/maps/search/?q=',
  };
  return (bases[platform] || 'https://') + handle;
}

function getSocialIcon(platform) {
  const i = {
    instagram: ['#E1306C','<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>'],
    facebook:  ['#1877F2','<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>'],
    twitter:   ['#000000','<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>'],
    tiktok:    ['#010101','<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l.05-8.07a8.16 8.16 0 0 0 4.78 1.55V6.44a4.83 4.83 0 0 1-1.06-.25z"/>'],
    youtube:   ['#FF0000','<path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>'],
    linkedin:  ['#0A66C2','<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>'],
    yelp:      ['#D32323','<path d="M20.16 12.73l-4.703 1.612c-.8.276-1.464-.8-.887-1.494l3.085-3.7a.87.87 0 0 0-.105-1.24 9.204 9.204 0 0 0-2.742-1.566.877.877 0 0 0-1.108.52L12.16 12.9c-.294.832-1.53.832-1.824 0L8.3 6.854a.877.877 0 0 0-1.108-.52 9.204 9.204 0 0 0-2.742 1.566.87.87 0 0 0-.105 1.24l3.085 3.7c.577.694-.087 1.77-.887 1.494L1.84 12.73a.877.877 0 0 0-1.107.72 9.277 9.277 0 0 0 .386 3.163.877.877 0 0 0 1.023.58l4.86-1.07c.826-.182 1.358.886.78 1.504l-3.25 3.455a.877.877 0 0 0 .064 1.249 9.22 9.22 0 0 0 2.913 1.738.877.877 0 0 0 1.085-.47l1.985-4.527c.338-.77 1.462-.77 1.8 0l1.985 4.527a.877.877 0 0 0 1.085.47 9.22 9.22 0 0 0 2.913-1.738.877.877 0 0 0 .064-1.249l-3.25-3.455c-.578-.618-.046-1.686.78-1.504l4.86 1.07a.877.877 0 0 0 1.023-.58 9.277 9.277 0 0 0 .386-3.162.877.877 0 0 0-1.107-.72z"/>'],
    google:    ['#ffffff','<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>'],
  };
  const d = i[platform];
  if (!d) return `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const [bg, path] = d;
  return `<span class="soc-badge" style="background:${bg}"><svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">${path}</svg></span>`;
}

// ── HTML RENDERER ──────────────────────────────────────────────────────────────

function renderProfile(p, reviews = []) {
  const theme    = (typeof p.theme === "object" && p.theme) ? p.theme : {};
  const t        = getThemeCSS(theme, p.background_image || null);
  const links    = Array.isArray(p.links)   ? p.links   : [];
  const contentBlocks  = Array.isArray(p.content_blocks) ? p.content_blocks : [];
  const updateBlocks   = contentBlocks.filter(b => b.type === 'update');
  const menuBlocks     = contentBlocks.filter(b => b.type === 'menu');
  const serviceBlocks  = contentBlocks.filter(b => b.type === 'service');
  const socials  = p.socials || {};
  const sections = theme.sections || {};

  // Section visibility defaults (true = show)
  const showLinks   = sections.links   !== false;
  const showSocials = sections.socials !== false;
  const showVideo   = sections.video   !== false;
  const showLead    = sections.lead    !== false;
  const showBio     = sections.bio     !== false;

  // ── HERO LAYOUT ─────────────────────────────────────────────────────────────
  // photoLayout: 'logo' | 'headshot' | 'both' | 'auto' (default)
  const photoLayout = theme.photoLayout || 'auto';
  let eff = photoLayout;
  if (eff === 'auto') {
    eff = (p.logo_url && p.photo_url) ? 'both' : p.photo_url ? 'headshot' : 'logo';
  }

  let heroPhotos = '';
  if (eff === 'both' && p.logo_url && p.photo_url) {
    heroPhotos = `<div class="hero-duo">
      <div class="duo-item">
        <div class="avatar-lg"><img src="${escHtml(p.logo_url)}" alt="${escHtml(p.business_name||"")}" loading="eager"/></div>
        ${p.business_name ? `<p class="duo-caption">${escHtml(p.business_name)}</p>` : ""}
      </div>
      <div class="duo-item">
        <div class="avatar-lg person"><img src="${escHtml(p.photo_url)}" alt="${escHtml(p.owner_name||"")}" loading="eager"/></div>
        ${p.owner_name ? `<p class="duo-caption">${escHtml(p.owner_name)}</p>` : ""}
      </div>
    </div>`;
  } else if (eff === 'headshot' && p.photo_url) {
    heroPhotos = `<div class="hero-solo"><div class="avatar-xl person"><img src="${escHtml(p.photo_url)}" alt="${escHtml(p.owner_name||p.business_name||"")}" loading="eager"/></div></div>`;
  } else if (p.logo_url) {
    heroPhotos = `<div class="hero-solo"><div class="avatar-xl"><img src="${escHtml(p.logo_url)}" alt="${escHtml(p.business_name||"")}" loading="eager"/></div></div>`;
  } else {
    heroPhotos = `<div class="hero-solo"><div class="avatar-xl"><span style="font-size:3rem;">🏢</span></div></div>`;
  }

  // ── LINKS ───────────────────────────────────────────────────────────────────
  const customLinks = showLinks ? links
    .filter(l => l.label && l.url)
    .map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener" class="link-btn">
      <span class="link-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
      <span class="link-label-text">${escHtml(l.label)}</span>
    </a>`).join("") : "";

  // ── SOCIALS ─────────────────────────────────────────────────────────────────
  const socialLabels = {
    instagram: "Instagram", facebook: "Facebook", twitter: "Twitter / X",
    tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn",
    yelp: "Yelp", google: "Google",
  };

  const socialLinks = showSocials ? Object.entries(socials)
    .filter(([, url]) => url)
    .map(([platform, url]) => {
      const label = socialLabels[platform] || platform;
      const href = normalizeSocialUrl(platform, url);
      return `<a href="${escHtml(href)}" target="_blank" rel="noopener" class="social-btn">
        ${getSocialIcon(platform)}
        <span class="soc-name">${label}</span>
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
        <span class="link-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.7 19.79 19.79 0 0 1 1.61 4.1 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
        <span class="link-label-text">${escHtml(p.phone)}</span>
       </a>` : "";

  // ── LEAD FORM ────────────────────────────────────────────────────────────────
  const leadSection = (showLead && p.lead_form_enabled) ? buildLeadForm(p) : "";

  // ── AMERICA CANTON ───────────────────────────────────────────────────────────
  // ── CONTENT BLOCKS ────────────────────────────────────────────────────────
  const updatesSection = updateBlocks.length ? `
  <div class="card">
    <div class="section-title">Updates &amp; Specials</div>
    ${updateBlocks.map(b => `
      <div class="update-card">
        <div class="update-badge">📢 Update</div>
        ${b.title ? `<div class="update-title">${escHtml(b.title)}</div>` : ""}
        ${b.text  ? `<div class="update-text">${escHtml(b.text)}</div>` : ""}
      </div>
    `).join("")}
  </div>` : "";

  const menuByCategory = {};
  menuBlocks.forEach(b => {
    const cat = b.category || "Menu";
    if (!menuByCategory[cat]) menuByCategory[cat] = [];
    menuByCategory[cat].push(b);
  });
  const menuSection = menuBlocks.length ? `
  <div class="card">
    <div class="section-title">Menu</div>
    ${Object.entries(menuByCategory).map(([cat, items]) => `
      <div class="menu-cat-label">${escHtml(cat)}</div>
      ${items.map(b => `
        <div class="menu-row">
          <div class="menu-item-left">
            <div class="menu-item-name">${escHtml(b.name || "")}</div>
            ${b.description ? `<div class="menu-item-desc">${escHtml(b.description)}</div>` : ""}
          </div>
          ${b.price ? `<div class="menu-item-price">${escHtml(b.price)}</div>` : ""}
        </div>
      `).join("")}
    `).join("")}
  </div>` : "";

  const servicesSection = serviceBlocks.length ? `
  <div class="card">
    <div class="section-title">Services</div>
    ${serviceBlocks.map(b => `
      <div class="service-row">
        <div class="service-left">
          <div class="service-name">${escHtml(b.name || "")}</div>
          ${b.description ? `<div class="service-desc">${escHtml(b.description)}</div>` : ""}
        </div>
        ${b.price ? `<div class="service-price">${escHtml(b.price)}</div>` : ""}
      </div>
    `).join("")}
  </div>` : "";

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
      padding: 48px 24px 90px;
      text-align: center;
      position: relative;
      overflow: hidden;
      min-height: 290px;
    }
    /* America canton */
    .star-canton {
      position: absolute; top: 0; left: 0;
      width: 38%; max-width: 155px;
      height: 54%;
      background: #3C3B6E;
    }
    .star-canton svg { display: block; width: 100%; height: 100%; }

    /* ── HERO PHOTOS ─────────────────────────────── */
    .hero-solo { display: flex; justify-content: center; margin: 0 auto 20px; }
    .avatar-xl {
      width: 152px; height: 152px; border-radius: 50%;
      overflow: hidden; flex-shrink: 0;
      border: 5px solid rgba(255,255,255,0.55);
      box-shadow: 0 0 0 3px rgba(255,255,255,0.15), 0 16px 48px rgba(0,0,0,0.35);
      background: rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-xl.person { border-color: rgba(255,255,255,0.75); }
    .avatar-xl img { width: 100%; height: 100%; object-fit: cover; }
    .hero-duo { display: flex; gap: 28px; justify-content: center; margin: 0 auto 20px; }
    .duo-item { text-align: center; }
    .avatar-lg {
      width: 122px; height: 122px; border-radius: 50%;
      overflow: hidden; margin: 0 auto;
      border: 4px solid rgba(255,255,255,0.55);
      box-shadow: 0 0 0 2px rgba(255,255,255,0.12), 0 10px 32px rgba(0,0,0,0.3);
      background: rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-lg.person { border-color: rgba(255,255,255,0.75); }
    .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
    .duo-caption {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
      color: rgba(255,255,255,0.82); margin-top: 7px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
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
    .link-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
      background: rgba(15,107,107,0.12);
      color: #0f6b6b;
    }
    .link-icon svg { width: 18px; height: 18px; }
    .link-label-text { flex: 1; }
    .soc-badge {
      width: 38px; height: 38px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px;
    }
    .soc-badge svg { width: 20px; height: 20px; }
    .soc-name { flex: 1; font-weight: 600; }

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

    /* ── UPDATES / SPECIALS ──────────────────────── */
    .update-card {
      border-left: 4px solid #f4752b;
      border-radius: 0 12px 12px 0;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .update-badge {
      display: inline-block; font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.07em;
      color: #fff; background: #f4752b;
      border-radius: 20px; padding: 2px 9px; margin-bottom: 6px;
    }
    .update-title { font-weight: 700; font-size: 0.96rem; margin-bottom: 4px; }
    .update-text  { font-size: 0.88rem; line-height: 1.6; }

    /* ── MENU ──────────────────────────────────────────────── */
    .menu-cat-label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #8b5cf6; margin: 16px 0 8px;
      padding-bottom: 4px; border-bottom: 1px solid rgba(139,92,246,0.18);
    }
    .menu-cat-label:first-child { margin-top: 0; }
    .menu-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 9px 0; gap: 12px;
    }
    .menu-row + .menu-row { border-top: 1px dashed rgba(0,0,0,0.07); }
    .menu-item-left { flex: 1; }
    .menu-item-name { font-weight: 600; font-size: 0.93rem; }
    .menu-item-desc { font-size: 0.8rem; margin-top: 2px; opacity: 0.72; line-height: 1.45; }
    .menu-item-price { font-weight: 700; font-size: 0.93rem; color: #0f6b6b; white-space: nowrap; }

    /* ── SERVICES ──────────────────────────────────────────── */
    .service-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 11px 0; gap: 12px;
    }
    .service-row + .service-row { border-top: 1px dashed rgba(0,0,0,0.07); }
    .service-left { flex: 1; }
    .service-name { font-weight: 700; font-size: 0.93rem; }
    .service-desc { font-size: 0.8rem; margin-top: 2px; opacity: 0.72; line-height: 1.45; }
    .service-price { font-weight: 700; color: #0f6b6b; white-space: nowrap; font-size: 0.93rem; }

    /* ── REVIEWS ────────────────────────────────────────────── */
    .review-card {
      border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;
      background: rgba(15,107,107,0.04);
    }
    .review-card.featured { background: rgba(244,167,36,0.06); }
    .featured-badge {
      display: inline-block; font-size: 0.7rem; font-weight: 700;
      color: #92400e; background: #fef3c7; border-radius: 20px;
      padding: 2px 9px; margin-bottom: 6px;
    }
    .review-stars { font-size: 1.05rem; color: #f4a724; letter-spacing: 1px; margin-bottom: 5px; }
    .review-text { font-size: 0.9rem; line-height: 1.65; margin-bottom: 7px; font-style: italic; opacity: 0.88; }
    .review-author { font-size: 0.82rem; font-weight: 600; }
    .review-write-btn {
      width: 100%; padding: 12px; margin-top: 10px;
      background: transparent; cursor: pointer;
      font-size: 0.9rem; font-family: inherit; font-weight: 600;
      transition: all 0.2s; border-radius: 12px;
      border: 1.5px dashed rgba(15,107,107,0.3); color: #0f6b6b;
    }
    .review-write-btn:hover { border-color: #0f6b6b; background: rgba(15,107,107,0.05); }
    .star-picker { display: flex; gap: 6px; margin-bottom: 12px; }
    .star-btn {
      background: none; border: none; font-size: 1.8rem; cursor: pointer;
      color: #ddd; padding: 0; transition: color 0.12s; line-height: 1;
    }
    .star-btn.on { color: #f4a724; }
    .review-input {
      width: 100%; padding: 11px 14px; border-radius: 10px;
      font-size: 0.92rem; font-family: inherit;
      margin-bottom: 10px; outline: none; resize: vertical;
      border: 1.5px solid rgba(0,0,0,0.14);
      background: transparent; color: inherit;
      transition: border-color 0.2s;
    }
    .review-input:focus { border-color: #0f6b6b; }

    /* ── FOOTER ──────────────────────────────────── */
    .powered {
      text-align: center; padding: 16px 24px 40px;
      font-size: 0.8rem; color: ${t.textSec};
    }
    .powered a { color: #0f6b6b; text-decoration: none; font-weight: 600; }

    /* ── MOBILE ──────────────────────────────────── */
    @media (max-width: 520px) {
      .hero-band { padding: 40px 20px 80px; min-height: 260px; }
      .card { margin: -40px 16px 16px; }
      .biz-name { font-size: 1.6rem; }
      .hero-duo { gap: 18px; }
      .avatar-xl { width: 132px; height: 132px; }
      .avatar-lg { width: 108px; height: 108px; }
    }
  </style>
</head>
<body>

  <div class="hero-band${(t.pattern === "carbon" || t.pattern === "wood") ? " dark-header" : ""}">


    ${heroPhotos}

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

  ${updatesSection}

  ${menuSection}

  ${servicesSection}

  ${buildReviews(p, reviews)}

  ${leadSection}

  <div class="powered">
    Powered by <a href="https://torrolink.com" target="_blank" rel="noopener">Torrolink</a>
  </div>

  <script>
    // ── No carousel — hero layout is static ──────────────────────────────────

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

    // ── Reviews ──────────────────────────────────────────────────────────────
    var _reviewRating = 5;
    function pickStar(n) {
      _reviewRating = n;
      document.querySelectorAll('.star-btn').forEach(function(btn, i) {
        btn.classList.toggle('on', i < n);
      });
    }
    pickStar(5);
    function toggleReviewForm() {
      var f = document.getElementById('reviewForm');
      if (!f) return;
      var open = f.style.display === 'block';
      f.style.display = open ? 'none' : 'block';
      var wb = document.querySelector('.review-write-btn');
      if (wb) wb.textContent = open ? '✏️ Write a Review' : '✕ Cancel';
    }
    async function submitReview(e, profileId) {
      e.preventDefault();
      var btn  = document.getElementById('reviewSubmitBtn');
      var name = document.getElementById('reviewerName').value.trim();
      var text = document.getElementById('reviewerText').value.trim();
      if (!name || !text) { alert('Please enter your name and review.'); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        var res = await fetch('/.netlify/functions/review-submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profileId, name: name, rating: _reviewRating, text: text })
        });
        if (res.ok) {
          document.getElementById('reviewSuccess').style.display = 'block';
          document.getElementById('reviewForm').style.display = 'none';
          document.querySelector('.review-write-btn').style.display = 'none';
        } else {
          var d = await res.json().catch(function(){ return {}; });
          alert(d.error || 'Failed to submit. Please try again.');
          btn.disabled = false; btn.textContent = 'Submit Review';
        }
      } catch(err) {
        alert('Network error. Please try again.');
        btn.disabled = false; btn.textContent = 'Submit Review';
      }
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

// ── REVIEWS SECTION ───────────────────────────────────────────────────────────

function buildReviews(p, reviews) {
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  const cards = reviews.map(r => `
    <div class="review-card${r.is_featured ? ' featured' : ''}">
      ${r.is_featured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
      <div class="review-stars">${stars(r.rating || 5)}</div>
      <div class="review-text">&ldquo;${escHtml(r.review_text || '')}&rdquo;</div>
      <div class="review-author">— ${escHtml(r.reviewer_name || 'Anonymous')}</div>
    </div>
  `).join('');

  const empty = !reviews.length
    ? '<p style="font-size:0.85rem;opacity:0.55;text-align:center;padding:6px 0 4px;">No reviews yet — be the first!</p>'
    : '';

  return `<div class="card">
    <div class="section-title">Reviews</div>
    ${cards}
    ${empty}
    <button class="review-write-btn" onclick="toggleReviewForm()">✏️ Write a Review</button>
    <form id="reviewForm" style="display:none;margin-top:16px;" onsubmit="submitReview(event,'${escJs(p.id)}')">
      <div class="star-picker">
        ${[1,2,3,4,5].map(n => `<button type="button" class="star-btn" onclick="pickStar(${n})">★</button>`).join('')}
      </div>
      <input  type="text"  id="reviewerName" placeholder="Your name" required class="review-input" />
      <textarea id="reviewerText" rows="3" placeholder="Share your experience..." required class="review-input"></textarea>
      <button type="submit" class="submit-btn" id="reviewSubmitBtn">Submit Review</button>
    </form>
    <p id="reviewSuccess" style="display:none;text-align:center;color:#0f6b6b;font-weight:700;padding:16px 0;">✓ Thanks for your review!</p>
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
