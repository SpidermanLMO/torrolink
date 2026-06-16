// ================================================
// TORROLINK — DESIGN PORTAL
// GET  /design/:code  → render logo upload + preview UI
// POST /design/:code  → receive logo, generate branded QR, email it
// ================================================

const { createClient } = require("@supabase/supabase-js");
const { Resend }       = require("resend");
const QRCode           = require("qrcode");
const Jimp             = require("jimp");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const SITE   = process.env.DEPLOY_URL || "https://torrolink.com";

// ── MAIN HANDLER ─────────────────────────────────

exports.handler = async (event) => {
  const code = event.path.replace(/.*\/design\//, "").split("/")[0];

  if (!code) {
    return { statusCode: 400, body: "Missing design code." };
  }

  // Look up profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, code, handle, business_name, branding_tier, branding_status, customer_id")
    .eq("code", code)
    .maybeSingle();

  if (!profile) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html" },
      body: notFoundHtml(),
    };
  }

  if (profile.branding_status === "approved") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: alreadyDoneHtml(profile),
    };
  }

  // GET → render portal page
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: portalHtml(profile),
    };
  }

  // POST → process logo upload + generate QR
  if (event.httpMethod === "POST") {
    return await processApproval(event, profile);
  }

  return { statusCode: 405, body: "Method not allowed" };
};

// ── QR RENDERER (supports square / dots / rounded) ───────────────

async function renderQRWithStyle(qrUrl, dotStyle = "square", qrColor = "#0a4d4d") {
  const IMG_SIZE = 1200;
  const qrData   = QRCode.create(qrUrl, { errorCorrectionLevel: "H" });
  const modules  = qrData.modules;
  const modCount = modules.size;
  const margin   = 2; // module-width margin
  const cell     = Math.floor(IMG_SIZE / (modCount + margin * 2));
  const off      = Math.floor((IMG_SIZE - cell * modCount) / 2);

  // Parse hex color → RGBA bytes
  const hex = qrColor.replace("#", "").padEnd(6, "0");
  const dr  = parseInt(hex.slice(0, 2), 16);
  const dg  = parseInt(hex.slice(2, 4), 16);
  const db  = parseInt(hex.slice(4, 6), 16);

  const img = new Jimp(IMG_SIZE, IMG_SIZE, 0xffffffff);

  function setCell(x, y, w, h) {
    img.scan(x, y, w, h, (_px, _py, idx) => {
      img.bitmap.data[idx]     = dr;
      img.bitmap.data[idx + 1] = dg;
      img.bitmap.data[idx + 2] = db;
      img.bitmap.data[idx + 3] = 255;
    });
  }

  for (let row = 0; row < modCount; row++) {
    for (let col = 0; col < modCount; col++) {
      if (!modules.get(row, col)) continue;
      const x = off + col * cell;
      const y = off + row * cell;

      if (dotStyle === "dots") {
        // Circle
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        const r  = cell * 0.44;
        const r2 = r * r;
        for (let dy = Math.ceil(-r); dy <= Math.floor(r); dy++) {
          for (let dx = Math.ceil(-r); dx <= Math.floor(r); dx++) {
            if (dx * dx + dy * dy > r2) continue;
            const px = Math.round(cx + dx);
            const py = Math.round(cy + dy);
            if (px < 0 || py < 0 || px >= IMG_SIZE || py >= IMG_SIZE) continue;
            const idx = (py * IMG_SIZE + px) * 4;
            img.bitmap.data[idx]     = dr;
            img.bitmap.data[idx + 1] = dg;
            img.bitmap.data[idx + 2] = db;
            img.bitmap.data[idx + 3] = 255;
          }
        }
      } else if (dotStyle === "rounded") {
        // Square with rounded corners
        const cr = Math.round(cell * 0.28); // corner radius in px
        img.scan(x, y, cell, cell, (_px, _py, idx) => {
          const rx = _px - x;
          const ry = _py - y;
          const inTL = rx < cr && ry < cr && (rx - cr) ** 2 + (ry - cr) ** 2 > cr * cr;
          const inTR = rx >= cell - cr && ry < cr && (rx - (cell - cr)) ** 2 + (ry - cr) ** 2 > cr * cr;
          const inBL = rx < cr && ry >= cell - cr && (rx - cr) ** 2 + (ry - (cell - cr)) ** 2 > cr * cr;
          const inBR = rx >= cell - cr && ry >= cell - cr && (rx - (cell - cr)) ** 2 + (ry - (cell - cr)) ** 2 > cr * cr;
          if (inTL || inTR || inBL || inBR) return;
          img.bitmap.data[idx]     = dr;
          img.bitmap.data[idx + 1] = dg;
          img.bitmap.data[idx + 2] = db;
          img.bitmap.data[idx + 3] = 255;
        });
      } else {
        // Square (classic)
        setCell(x, y, cell, cell);
      }
    }
  }

  return img.getBufferAsync(Jimp.MIME_PNG);
}

// ── PROCESS APPROVAL ─────────────────────────────

async function processApproval(event, profile) {
  try {
    // Parse multipart body for logo image
    const contentType = event.headers["content-type"] || "";

    let logoBase64 = null;
    let dotStyle   = "square";
    let qrColor    = "#0a4d4d";
    let frameLabel = "";

    if (contentType.includes("application/json")) {
      const body = JSON.parse(event.body || "{}");
      logoBase64 = body.logoBase64;
      dotStyle   = body.dotStyle || dotStyle;
      qrColor    = body.qrColor  || qrColor;
      frameLabel = body.frameLabel || "";
    }

    // Generate QR PNG with dot style support
    const qrUrl    = `${SITE}/q/${profile.code}`;
    const qrBuffer = await renderQRWithStyle(qrUrl, dotStyle, qrColor);

    let finalBuffer = qrBuffer;

    // If logo provided, composite it into the center
    if (logoBase64) {
      const logoData   = logoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const logoBuffer = Buffer.from(logoData, "base64");

      const qrImg   = await Jimp.read(qrBuffer);
      const logoImg = await Jimp.read(logoBuffer);

      const qrSize    = qrImg.getWidth();
      const logoSize  = Math.round(qrSize * 0.22); // 22% of QR width
      const padding   = Math.round(logoSize * 0.15);
      const bgSize    = logoSize + padding * 2;
      const offset    = Math.round((qrSize - bgSize) / 2);

      // White background circle/square behind logo
      const bg = new Jimp(bgSize, bgSize, 0xffffffff);
      logoImg.resize(logoSize, logoSize, Jimp.RESIZE_LANCZOS3);
      bg.composite(logoImg, padding, padding);
      qrImg.composite(bg, offset, offset);

      finalBuffer = await qrImg.getBufferAsync(Jimp.MIME_PNG);
    }

    // Upload to Supabase Storage
    const storagePath = `qr-codes/${profile.code}.png`;
    await supabase.storage
      .from("qr-assets")
      .upload(storagePath, finalBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    // Get customer email
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", profile.customer_id)
      .maybeSingle();

    // Update branding status
    await supabase
      .from("profiles")
      .update({ branding_status: "approved" })
      .eq("id", profile.id);

    // Email the final QR
    const firstName  = (customer?.name || "").split(" ")[0] || "there";
    const profileUrl = `${SITE}/p/${profile.handle}`;

    await resend.emails.send({
      from:    "Torrolink <orders@torrolink.com>",
      to:      customer?.email,
      subject: "Your branded QR code is ready! 🎉",
      attachments: [{ filename: "torrolink-branded-qr.png", content: finalBuffer.toString("base64") }],
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#0a4d4d;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:1.8rem;">Your branded QR is attached!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">You approved it — we generated it. It's yours forever.</p>
  </div>
  <div style="background:#f9f9fb;padding:32px;border-radius:0 0 12px 12px;">
    <p style="color:#333;">Hey ${esc(firstName)},</p>
    <p style="color:#555;line-height:1.7;">
      Your branded QR code for <strong>${esc(profile.business_name)}</strong> is attached as a high-res PNG (1200×1200 px — print-ready).
    </p>
    <div style="background:#fff;border-radius:10px;padding:20px;margin:24px 0;border:1px solid #e5e5ea;text-align:center;">
      <p style="margin:0 0 8px;font-size:0.9rem;color:#888;">Your profile page</p>
      <a href="${profileUrl}" style="color:#0f6b6b;font-weight:700;">${profileUrl}</a>
    </div>
    <p style="font-size:0.85rem;color:#888;">Questions? Reply to this email or reach us at <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
    <p style="font-size:0.75rem;color:#bbb;">A PTorro Holdings Company &bull; torrolink.com</p>
  </div>
</div>`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };

  } catch (err) {
    console.error("Design portal error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

// ── HTML PAGES ────────────────────────────────────

function portalHtml(profile) {
  const isCustom = profile.branding_tier === "custom";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Design Your QR — Torrolink</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:#f4f4f8;color:#111;min-height:100vh;}
    .header{background:#0a4d4d;padding:20px 24px;text-align:center;}
    .header h1{color:#fff;font-size:1.4rem;font-weight:700;}
    .header p{color:rgba(255,255,255,0.75);font-size:0.9rem;margin-top:4px;}
    .container{max-width:680px;margin:0 auto;padding:32px 20px;}
    .card{background:#fff;border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.07);}
    h2{font-size:1.15rem;font-weight:700;margin-bottom:6px;color:#111;}
    p.sub{font-size:0.9rem;color:#666;line-height:1.6;margin-bottom:16px;}
    .upload-area{border:2px dashed #c8d0d8;border-radius:12px;padding:36px 20px;text-align:center;cursor:pointer;transition:border-color .2s;}
    .upload-area:hover,.upload-area.drag{border-color:#0f6b6b;}
    .upload-area input{display:none;}
    .upload-area .upload-icon{font-size:2.5rem;margin-bottom:12px;}
    .upload-area .upload-text{font-size:0.95rem;color:#555;}
    .upload-area .upload-hint{font-size:0.8rem;color:#aaa;margin-top:6px;}
    #preview-wrap{display:none;margin-top:20px;text-align:center;}
    #preview-wrap img{max-width:200px;max-height:200px;border-radius:12px;border:1px solid #e5e5ea;padding:12px;background:#fff;}
    .preview-label{font-size:0.85rem;color:#888;margin-top:8px;}
    .options-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;}
    .opt-group{display:flex;flex-direction:column;gap:6px;}
    .opt-group label{font-size:0.85rem;font-weight:600;color:#555;}
    select,input[type=color]{border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:0.9rem;font-family:inherit;width:100%;}
    input[type=color]{height:44px;padding:4px 8px;cursor:pointer;}
    .approve-btn{display:block;width:100%;background:#f4752b;color:#fff;border:none;border-radius:12px;padding:18px;font-size:1.05rem;font-weight:700;cursor:pointer;margin-top:8px;transition:opacity .2s;}
    .approve-btn:hover{opacity:0.9;}
    .approve-btn:disabled{opacity:0.5;cursor:default;}
    .success-box{display:none;background:#eafaf3;border:1px solid #6dd4a8;border-radius:12px;padding:20px;text-align:center;margin-top:20px;}
    .success-box h3{color:#1a7a4e;margin-bottom:6px;}
    .success-box p{color:#3a6b55;font-size:0.9rem;}
    .step-badge{display:inline-block;background:#f0f4ff;color:#3b5bdb;border-radius:20px;font-size:0.75rem;font-weight:700;padding:4px 12px;margin-bottom:12px;}
    ${isCustom ? "" : ".custom-only{display:none!important;}"}
  </style>
</head>
<body>
  <div class="header">
    <h1>Design Your Branded QR</h1>
    <p>${esc(profile.business_name)} — ${isCustom ? "Custom Branding" : "Standard Branding"}</p>
  </div>

  <div class="container">

    <!-- STEP 1: Upload logo -->
    <div class="card">
      <div class="step-badge">Step 1</div>
      <h2>Upload your logo</h2>
      <p class="sub">PNG or JPG. We'll center it in your QR code with a clean white background pad so it reads clearly.</p>
      <div class="upload-area" id="uploadArea">
        <input type="file" id="logoInput" accept="image/png,image/jpeg,image/jpg,image/svg+xml"/>
        <div class="upload-icon">🖼️</div>
        <div class="upload-text">Click to upload or drag &amp; drop</div>
        <div class="upload-hint">PNG, JPG, or SVG — recommended 400×400 px or larger</div>
      </div>
      <div id="preview-wrap">
        <img id="logoPreview" src="" alt="Your logo preview"/>
        <div class="preview-label">Your logo — this is how it will look in the QR center</div>
      </div>
    </div>

    <!-- STEP 2: Style options (Custom tier only) -->
    <div class="card custom-only">
      <div class="step-badge">Step 2 — Custom Options</div>
      <h2>Customize your QR style</h2>
      <p class="sub">These settings apply to the QR pattern itself — your logo will always appear in the center.</p>
      <div class="options-grid">
        <div class="opt-group">
          <label for="dotStyle">Dot Style</label>
          <select id="dotStyle">
            <option value="square">■ Square (classic)</option>
            <option value="dots">● Dots (modern)</option>
            <option value="rounded">◉ Rounded (friendly)</option>
          </select>
        </div>
        <div class="opt-group">
          <label for="qrColor">QR Color</label>
          <input type="color" id="qrColor" value="#0a4d4d"/>
        </div>
      </div>
    </div>

    <!-- STEP 3: Approve -->
    <div class="card">
      <div class="step-badge">Final Step</div>
      <h2>Approve and generate</h2>
      <p class="sub">When you click below, your branded QR code is generated and emailed to you instantly — high-res PNG, print-ready.</p>
      <button class="approve-btn" id="approveBtn" disabled>
        Looks good — generate my QR →
      </button>
    </div>

    <div class="success-box" id="successBox">
      <h3>🎉 Your branded QR is on its way!</h3>
      <p>Check your inbox — we just sent your high-res branded QR code. It's yours forever.</p>
    </div>

  </div>

  <script>
    const uploadArea  = document.getElementById('uploadArea');
    const logoInput   = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const previewWrap = document.getElementById('preview-wrap');
    const approveBtn  = document.getElementById('approveBtn');
    const successBox  = document.getElementById('successBox');

    let logoBase64 = null;

    uploadArea.addEventListener('click', () => logoInput.click());

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault(); uploadArea.classList.remove('drag');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    logoInput.addEventListener('change', () => {
      if (logoInput.files[0]) handleFile(logoInput.files[0]);
    });

    function handleFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        logoBase64 = e.target.result;
        logoPreview.src = logoBase64;
        previewWrap.style.display = 'block';
        approveBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    approveBtn.addEventListener('click', async () => {
      if (!logoBase64) return;
      approveBtn.disabled = true;
      approveBtn.textContent = 'Generating your QR code…';

      const dotStyle = document.getElementById('dotStyle')?.value || 'square';
      const qrColor  = document.getElementById('qrColor')?.value  || '#0a4d4d';

      const res = await fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoBase64, dotStyle, qrColor }),
      });

      if (res.ok) {
        approveBtn.style.display = 'none';
        successBox.style.display = 'block';
      } else {
        approveBtn.disabled = false;
        approveBtn.textContent = 'Looks good — generate my QR →';
        alert('Something went wrong. Please try again or email orders@torrolink.com');
      }
    });
  </script>
</body>
</html>`;
}

function alreadyDoneHtml(profile) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Already Complete — Torrolink</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f4f8;} .box{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08);} h2{color:#0a4d4d;} p{color:#555;margin-top:12px;line-height:1.6;}</style>
</head>
<body>
  <div class="box">
    <h2>✓ Already approved!</h2>
    <p>Your branded QR code for <strong>${esc(profile.business_name)}</strong> was already generated and sent to your inbox.<br><br>If you didn't receive it, email us at <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a></p>
  </div>
</body>
</html>`;
}

function notFoundHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Not Found — Torrolink</title>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f4f8;} .box{background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,.08);} h2{color:#c0392b;}</style>
</head>
<body>
  <div class="box">
    <h2>Design link not found</h2>
    <p>This link may have already been used, or it may be invalid. Email <a href="mailto:orders@torrolink.com" style="color:#0f6b6b;">orders@torrolink.com</a> if you need help.</p>
  </div>
</body>
</html>`;
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
