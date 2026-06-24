"""
LUCIUS — Add Refer & Earn tab to portal.js
Adds:
  1. CSS for referral tab
  2. Tab button in nav
  3. Tab panel HTML
  4. 'referral' added to switchTab array + loadReferral() call
  5. loadReferral() JS function
"""

path = r"/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/portal.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# ── 1. Add CSS for referral tab (after partner-modal CSS block) ──────────────
OLD_CSS_END = """    /* ── Theme picker ─────────────────────────────── */"""

NEW_CSS_END = """    /* ── Refer & Earn tab ───────────────────────────── */
    .referral-hero {
      background: linear-gradient(135deg, #0f6b6b, #0a4d4d);
      border-radius: 14px; padding: 28px 24px; color: #fff; margin-bottom: 20px; text-align: center;
    }
    .referral-hero h2 { margin: 0 0 6px; font-size: 1.3rem; }
    .referral-hero p  { margin: 0; font-size: 0.9rem; opacity: 0.85; }
    .referral-link-box {
      background: #fff; border: 1.5px solid #c0d8d8; border-radius: 10px;
      display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin: 16px 0 8px;
    }
    .referral-link-box input {
      flex: 1; border: none; outline: none; font-size: 0.88rem; color: #333;
      background: transparent; font-family: inherit;
    }
    .referral-link-copy {
      padding: 6px 14px; background: #0f6b6b; color: #fff; border: none;
      border-radius: 7px; font-size: 0.82rem; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: background 0.15s; white-space: nowrap;
    }
    .referral-link-copy:hover { background: #0a5050; }
    .referral-progress {
      background: #f4f6f8; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;
    }
    .referral-progress-bar-wrap {
      background: #e2e6ea; border-radius: 99px; height: 10px; margin: 10px 0 6px; overflow: hidden;
    }
    .referral-progress-bar {
      background: linear-gradient(90deg, #0f6b6b, #16a085);
      height: 100%; border-radius: 99px; transition: width 0.5s ease;
    }
    .referral-tier-label {
      font-size: 1.5rem; font-weight: 800; color: #0f6b6b; text-align: center; margin: 10px 0 4px;
    }
    .referral-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 8px; }
    .referral-table th {
      text-align: left; color: #888; font-weight: 600; padding: 6px 8px;
      border-bottom: 1.5px solid #e2e6ea;
    }
    .referral-table td { padding: 8px 8px; border-bottom: 1px solid #f0f0f0; color: #444; }
    .referral-badge-active   { color: #0f6b6b; font-weight: 700; }
    .referral-badge-inactive { color: #aaa; }
    .tier-row { display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 0.85rem; }
    .tier-row:last-child { border-bottom: none; }
    .tier-row.current { font-weight: 700; color: #0f6b6b; }

    /* ── Theme picker ─────────────────────────────── */"""

src = src.replace(OLD_CSS_END, NEW_CSS_END, 1)

# ── 2. Add tab button after gallery, before upgrade ─────────────────────────
OLD_TAB_BTNS = """        <button class="tab-btn" onclick="switchTab(\'upgrade\')" style="color:#f4752b;border-color:#f4752b;">&#8679; Upgrade</button>"""

NEW_TAB_BTNS = """        <button class="tab-btn" onclick="switchTab(\'referral\')" style="color:#0f6b6b;border-color:#c0d8d8;">&#127873; Refer &amp; Earn</button>
        <button class="tab-btn" onclick="switchTab(\'upgrade\')" style="color:#f4752b;border-color:#f4752b;">&#8679; Upgrade</button>"""

src = src.replace(OLD_TAB_BTNS, NEW_TAB_BTNS, 1)

# ── 3. Add tab panel before upgrade tab ─────────────────────────────────────
OLD_UPGRADE_TAB = """      <!-- UPGRADE TAB -->
      <div id="tab-upgrade" class="tab-panel">"""

NEW_UPGRADE_TAB = """      <!-- REFER & EARN TAB -->
      <div id="tab-referral" class="tab-panel">
        <div style="max-width:560px;">
          <div class="referral-hero">
            <h2>&#127873; Refer &amp; Earn</h2>
            <p>Share your referral link. Every business that joins Metrics &amp; Leads through you earns you a discount — up to 100% free.</p>
          </div>

          <div id="referralContent">
            <p style="color:#999;font-size:0.88rem;text-align:center;padding:24px 0;">Loading your referral info...</p>
          </div>
        </div>
      </div>

      <!-- UPGRADE TAB -->
      <div id="tab-upgrade" class="tab-panel">"""

src = src.replace(OLD_UPGRADE_TAB, NEW_UPGRADE_TAB, 1)

# ── 4. Add 'referral' to switchTab tabs array and loadReferral call ──────────
OLD_SWITCH = """    function switchTab(name) {
      const tabs = ['profile', 'links', 'themes', 'qr', 'reviews', 'partners', 'gallery', 'upgrade'];
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', tabs[i] === name);
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      // Hide save button on upgrade tab
      const saveRow = document.getElementById('saveRow');
      if (name === 'reviews') loadReviews();
      if (name === 'partners') loadPartners();
      if (saveRow) saveRow.style.display = name === 'upgrade' ? 'none' : 'block';
      // Build upgrade tab content on first open
      if (name === 'upgrade' && _profile) buildUpgradeTab(_profile);
    }"""

NEW_SWITCH = """    function switchTab(name) {
      const tabs = ['profile', 'links', 'themes', 'qr', 'reviews', 'partners', 'gallery', 'referral', 'upgrade'];
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', tabs[i] === name);
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      // Hide save button on upgrade and referral tabs
      const saveRow = document.getElementById('saveRow');
      if (name === 'reviews')  loadReviews();
      if (name === 'partners') loadPartners();
      if (name === 'referral') loadReferral();
      if (saveRow) saveRow.style.display = (name === 'upgrade' || name === 'referral') ? 'none' : 'block';
      // Build upgrade tab content on first open
      if (name === 'upgrade' && _profile) buildUpgradeTab(_profile);
    }"""

src = src.replace(OLD_SWITCH, NEW_SWITCH, 1)

# ── 5. Add loadReferral() function before buildUpgradeTab ───────────────────
OLD_UPGRADE_FN = """    // ── Upgrade tab ────────────────────────────────────────────────
    function buildUpgradeTab(profile) {"""

NEW_UPGRADE_FN = """    // ── Refer & Earn tab ───────────────────────────────────────────
    var _referralData = null;

    async function loadReferral() {
      if (!_session || !_profile) return;
      const el = document.getElementById('referralContent');
      if (!el) return;
      if (_referralData) { renderReferral(_referralData); return; } // already loaded
      el.innerHTML = '<p style="color:#999;font-size:0.88rem;text-align:center;padding:24px 0;">Loading...</p>';

      try {
        var res = await fetch('/.netlify/functions/refer-earn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _session.access_token },
          body: JSON.stringify({ action: 'get' }),
        });
        var data = await res.json();
        if (data.error) throw new Error(data.error);
        _referralData = data;
        renderReferral(data);
      } catch(e) {
        el.innerHTML = '<p style="color:#c0392b;font-size:0.88rem;">Could not load referral info. Try refreshing.</p>';
      }
    }

    function renderReferral(d) {
      var el = document.getElementById('referralContent');
      if (!el) return;

      var hasMetrics = d.hasMetrics;
      var credits    = d.credits || 0;
      var pct        = d.discount ? d.discount.pct : 0;
      var nextAt     = d.discount ? d.discount.nextAt : 1;
      var nextLabel  = d.discount ? d.discount.nextLabel : '';
      var link       = d.referralLink || '';
      var code       = d.referralCode || '';
      var referred   = d.referred || [];

      // Progress bar: cap at 5 referrals = 100%
      var barPct = Math.min((credits / 5) * 100, 100);

      // Tier table
      var tiers = [
        { refs: 1, label: '20% off',  price: '$8.22/mo' },
        { refs: 2, label: '40% off',  price: '$6.17/mo' },
        { refs: 3, label: '60% off',  price: '$4.11/mo' },
        { refs: 4, label: '80% off',  price: '$2.06/mo' },
        { refs: 5, label: 'FREE',     price: '$0/mo &#127881;' },
      ];
      var tiersHtml = tiers.map(function(t) {
        var isCurrent = (credits >= t.refs && (t.refs === 5 || credits < t.refs + 1));
        if (t.refs === 5) isCurrent = credits >= 5;
        return '<div class="tier-row' + (isCurrent ? ' current' : '') + '">' +
          '<span>' + t.refs + ' referral' + (t.refs > 1 ? 's' : '') + (isCurrent ? ' &#10003;' : '') + '</span>' +
          '<span>' + t.label + '</span>' +
          '<span style="color:#888;">' + t.price + '</span>' +
          '</div>';
      }).join('');

      // Referred table
      var referredHtml = '';
      if (referred.length > 0) {
        referredHtml = '<h3 style="font-size:0.95rem;margin:20px 0 8px;">People You\'ve Referred</h3>' +
          '<table class="referral-table"><thead><tr>' +
          '<th>Name</th><th>Status</th><th>Joined</th>' +
          '</tr></thead><tbody>' +
          referred.map(function(r) {
            var date = new Date(r.joinedAt).toLocaleDateString();
            var status = r.active
              ? '<span class="referral-badge-active">&#9679; Active</span>'
              : '<span class="referral-badge-inactive">Inactive</span>';
            return '<tr><td>' + escP(r.name) + '</td><td>' + status + '</td><td>' + date + '</td></tr>';
          }).join('') +
          '</tbody></table>';
      }

      // Metrics gate notice
      var metricsNotice = !hasMetrics
        ? '<div style="margin-bottom:16px;padding:12px 14px;background:#fff8f0;border:1px solid rgba(244,117,43,0.25);border-radius:8px;font-size:0.85rem;color:#7c4000;">&#128274; Referral discounts apply to your <strong>Metrics &amp; Leads</strong> subscription. <a href="#" onclick="switchTab(\'upgrade\');return false;" style="color:#f4752b;font-weight:700;text-decoration:none;">Subscribe to Metrics &rarr;</a></div>'
        : '';

      el.innerHTML =
        metricsNotice +
        '<div class="tl-card">' +
          '<h3 style="margin:0 0 4px;font-size:0.95rem;">Your Referral Link</h3>' +
          '<p style="font-size:0.82rem;color:#666;margin:0 0 8px;">Share this link. When someone buys Metrics &amp; Leads through it, you earn a discount.</p>' +
          '<div class="referral-link-box">' +
            '<input type="text" id="refLinkInput" value="' + escP(link) + '" readonly onclick="this.select()" />' +
            '<button class="referral-link-copy" onclick="copyReferralLink()">Copy</button>' +
          '</div>' +
          '<p style="font-size:0.78rem;color:#aaa;margin:0;">Your code: <strong>' + escP(code) + '</strong></p>' +
        '</div>' +

        '<div class="referral-progress">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">' +
            '<span style="font-size:0.88rem;font-weight:600;color:#333;">Your Progress</span>' +
            '<span style="font-size:0.82rem;color:#888;">' + credits + ' active referral' + (credits !== 1 ? 's' : '') + '</span>' +
          '</div>' +
          '<div class="referral-progress-bar-wrap"><div class="referral-progress-bar" style="width:' + barPct + '%"></div></div>' +
          (pct > 0
            ? '<div class="referral-tier-label">' + (pct === 100 ? 'FREE &#127881;' : pct + '% off') + '</div>'
            : '') +
          (nextAt
            ? '<p style="font-size:0.82rem;color:#666;text-align:center;margin:4px 0 0;">Next: ' + escP(nextLabel) + ' at ' + nextAt + ' referral' + (nextAt !== 1 ? 's' : '') + '</p>'
            : '') +
        '</div>' +

        '<div class="tl-card">' +
          '<h3 style="font-size:0.9rem;margin:0 0 10px;">Discount Tiers</h3>' +
          tiersHtml +
        '</div>' +

        referredHtml;
    }

    function copyReferralLink() {
      var input = document.getElementById('refLinkInput');
      if (!input) return;
      try {
        input.select();
        document.execCommand('copy');
        // Brief visual feedback
        var btn = input.parentNode.querySelector('.referral-link-copy');
        if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy'; }, 1800); }
      } catch(e) {}
    }

    // ── Upgrade tab ────────────────────────────────────────────────
    function buildUpgradeTab(profile) {"""

src = src.replace(OLD_UPGRADE_FN, NEW_UPGRADE_FN, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("Done. portal.js updated successfully.")
