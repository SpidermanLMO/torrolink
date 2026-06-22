// =====================
// TORROLINK — script.js
// =====================

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? '' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '68px';
    navLinks.style.left = '0';
    navLinks.style.right = '0';
    navLinks.style.background = '#fff';
    navLinks.style.padding = '16px 24px 24px';
    navLinks.style.borderBottom = '1px solid #e2e6ea';
    navLinks.style.zIndex = '99';
    if (open) navLinks.removeAttribute('style');
  });
}

// Close mobile nav when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) navLinks.removeAttribute('style');
  });
});

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Contact form submission
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    // Show loading state
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const safeEmail = payload.email.replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
    fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => { if (!r.ok) throw new Error('Server error ' + r.status); return r.json(); })
    .then(() => {
      form.innerHTML = `
        <div style="text-align:center;padding:48px 24px;">
          <div style="font-size:3rem;margin-bottom:16px;">✅</div>
          <h3 style="font-size:1.4rem;font-weight:800;margin-bottom:10px;color:#0f6b6b;">Message sent!</h3>
          <p style="color:#444457;font-size:1rem;">We'll get back to you at <strong>${safeEmail}</strong> within one business day.</p>
        </div>`;
    })
    .catch(() => {
      btn.textContent = 'Send Message →';
      btn.disabled = false;
      alert('Something went wrong. Please email us at orders@torrolink.com');
    });
  });
}

// Stripe Checkout — shows modal to collect business name first
const PLAN_LABELS = {
  'qr-code':                 'QR Code — $28.33',
  'qr-code-branding':        'QR Code + Standard Branding — $37.61',
  'qr-code-custom-branding': 'QR Code + Custom Branding — $46.61',
  // upgrade-only (from portal)
  'branding':                'Standard Branding — $9.28',
  'custom-branding':         'Custom Branding — $18.28',
  'metrics':                 'Metrics + Leads — $10.28/mo',
};

// Plans that include a QR purchase — show the metrics add-on toggle
const QR_PLANS = new Set(['qr-code', 'qr-code-branding', 'qr-code-custom-branding']);

let _pendingPlan = null;

function checkout(plan) {
  _pendingPlan = plan;
  const nameInput     = document.getElementById('modalBusinessName');
  const emailInput    = document.getElementById('modalEmail');
  const label         = document.getElementById('modalPlanLabel');
  const btn           = document.getElementById('modalSubmitBtn');
  const metricsToggle = document.getElementById('modalMetricsToggle');
  const metricsCheck  = document.getElementById('modalAddMetrics');

  nameInput.value  = '';
  emailInput.value = '';
  nameInput.classList.remove('error');
  btn.textContent  = 'Continue to Payment →';
  btn.disabled     = false;
  if (metricsCheck) metricsCheck.checked = false;

  // Only show add-on toggle when buying a QR plan
  if (metricsToggle) metricsToggle.style.display = QR_PLANS.has(plan) ? 'flex' : 'none';

  label.textContent = PLAN_LABELS[plan] || plan;
  document.getElementById('checkoutModal').style.display = 'flex';
  setTimeout(() => nameInput.focus(), 60);
}

function updateModalPrice() {
  const label      = document.getElementById('modalPlanLabel');
  const addMetrics = document.getElementById('modalAddMetrics')?.checked;
  let text = PLAN_LABELS[_pendingPlan] || _pendingPlan;
  if (addMetrics) text += ' + Metrics $10.28/mo';
  label.textContent = text;
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').style.display = 'none';
  _pendingPlan = null;
}

document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('checkoutModal');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCheckoutModal();
    });
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeCheckoutModal();
});

async function submitCheckoutModal() {
  const nameInput     = document.getElementById('modalBusinessName');
  const businessName  = nameInput.value.trim();
  const customerEmail = document.getElementById('modalEmail').value.trim();
  const addMetrics    = document.getElementById('modalAddMetrics')?.checked || false;
  const btn = document.getElementById('modalSubmitBtn');

  const agreeToS = document.getElementById('modalAgreeToS');
  if (agreeToS && !agreeToS.checked) {
    document.getElementById('modalAgreeError').style.display = 'block';
    return;
  }
  if (agreeToS) document.getElementById('modalAgreeError').style.display = 'none';

  if (!businessName) {
    nameInput.classList.add('error');
    nameInput.focus();
    return;
  }
  nameInput.classList.remove('error');

  btn.textContent = 'Redirecting to Stripe…';
  btn.disabled    = true;

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: _pendingPlan,
        businessName,
        customerEmail: customerEmail || undefined,
        addMetrics: addMetrics || undefined,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Something went wrong. Please try again or email orders@torrolink.com');
      btn.textContent = 'Continue to Payment →';
      btn.disabled    = false;
    }
  } catch (err) {
    alert('Something went wrong. Please try again or email orders@torrolink.com');
    btn.textContent = 'Continue to Payment →';
    btn.disabled    = false;
  }
}

// Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .plan, .case, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Sticky mobile CTA — hide when pricing section is visible
(function () {
  var cta = document.getElementById('stickyCta');
  var pricing = document.getElementById('pricing');
  if (!cta || !pricing) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // Only operate on mobile; CSS keeps it hidden on desktop anyway
      cta.style.display = entry.isIntersecting ? 'none' : '';
    });
  }, { threshold: 0.15 });
  obs.observe(pricing);
})();
