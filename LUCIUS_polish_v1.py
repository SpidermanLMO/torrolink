"""
LUCIUS — Homepage & CSS Design Polish v1
Goal: add visual "weight" — trust, depth, quality — to torrolink.com

Changes to styles.css:
  1. Deeper card shadow (--shadow variable)
  2. h2 letter-spacing for tighter, more premium heading feel
  3. btn-primary hover: translateY -2px + orange glow box-shadow
  4. step-num opacity: 0.25 → 0.4 (more visible step numbers)
  5. step-arrow: opacity 0.3 → 0.55, font-size 1.8rem → 2rem
  6. plan card: transition covers transform; hover lifts with shadow
  7. case card hover: deeper shadow (was using flat --shadow)

Changes to index.html:
  8. Hero subtitle: remove premature $10.28 mention, tighten copy
  9. Proof bar: remove fake self-testimonial (PTorro Roofing LLC)
 10. Plan badge: "Most Branded" → "Full Control" (premium, not just descriptive)
"""

import re

CSS_PATH  = "/sessions/nice-vigilant-sagan/mnt/Torrolink/styles.css"
HTML_PATH = "/sessions/nice-vigilant-sagan/mnt/Torrolink/index.html"

# ── helpers ─────────────────────────────────────────────────────────────────
def replace_once(src, old, new, label):
    count = src.count(old)
    if count == 0:
        print(f"  MISS  [{label}] — pattern not found")
        return src
    if count > 1:
        print(f"  WARN  [{label}] — {count} occurrences, replacing first only")
    result = src.replace(old, new, 1)
    print(f"  OK    [{label}]")
    return result

# ── styles.css ───────────────────────────────────────────────────────────────
with open(CSS_PATH, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Deeper shadow
css = replace_once(css,
    "--shadow:  0 4px 24px rgba(15,107,107,0.10);",
    "--shadow:  0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(15,107,107,0.13);",
    "shadow depth"
)

# 2. h2 letter-spacing
css = replace_once(css,
    """h2 {
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--charcoal);
  margin-bottom: 16px;
}""",
    """h2 {
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--charcoal);
  margin-bottom: 16px;
}""",
    "h2 letter-spacing"
)

# 3. btn-primary hover — more lift + glow
css = replace_once(css,
    ".btn-primary:hover { background: var(--orange-hover); border-color: var(--orange-hover); transform: translateY(-1px); }",
    ".btn-primary:hover { background: var(--orange-hover); border-color: var(--orange-hover); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,117,43,0.30); }",
    "btn-primary hover"
)

# 4. step-num opacity
css = replace_once(css,
    """.step-num {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--teal);
  opacity: 0.25;
  margin-bottom: 12px;
  line-height: 1;
}""",
    """.step-num {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--teal);
  opacity: 0.4;
  margin-bottom: 12px;
  line-height: 1;
}""",
    "step-num opacity"
)

# 5. step-arrow size + opacity
css = replace_once(css,
    """.step-arrow {
  font-size: 1.8rem;
  color: var(--teal);
  opacity: 0.3;
  padding: 0 12px;
  align-self: center;
  flex-shrink: 0;
}""",
    """.step-arrow {
  font-size: 2rem;
  color: var(--teal);
  opacity: 0.55;
  padding: 0 12px;
  align-self: center;
  flex-shrink: 0;
}""",
    "step-arrow"
)

# 6. plan card: add transform to transition
css = replace_once(css,
    "  transition: box-shadow 0.2s;\n}",
    "  transition: box-shadow 0.25s ease, transform 0.25s ease;\n}",
    "plan transition"
)

# 7. plan hover: lift + richer shadow
css = replace_once(css,
    ".plan:hover { box-shadow: var(--shadow); }",
    ".plan:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07), 0 16px 48px rgba(15,107,107,0.16); transform: translateY(-3px); }",
    "plan hover"
)

with open(CSS_PATH, "w", encoding="utf-8") as f:
    f.write(css)

print(f"\nstyles.css written ({len(css)} bytes)")

# ── index.html ───────────────────────────────────────────────────────────────
with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

# 8. Hero subtitle — cleaner, remove premature price mention
html = replace_once(html,
    "Buy your QR code once and own it permanently. It comes with a free profile page your customers land on — your logo, your links, your video, all editable anytime. Add our $10.28/mo plan to see who's scanning and capture leads automatically.",
    "A permanent QR code and a free profile page — your logo, your links, your story, all editable anytime. Put it on your truck, your cards, your window. Every scan lands exactly where you want them. No monthly fees. No games.",
    "hero subtitle"
)

# 9. Proof bar — remove fake self-testimonial
html = replace_once(html,
    '<div class="proof-item"><span class="proof-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span> "Worth every penny" &mdash; PTorro Roofing LLC</div>',
    '<div class="proof-item">&#9889; Set up in under 10 minutes</div>',
    "proof bar self-testimonial"
)

# 10. Plan badge "Most Branded" → "Full Control"
html = replace_once(html,
    '<div class="plan-badge">Most Branded</div>',
    '<div class="plan-badge">Full Control</div>',
    "plan badge label"
)

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print(f"index.html written ({len(html)} bytes)")
print("\nAll done.")
