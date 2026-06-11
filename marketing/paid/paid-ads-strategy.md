# Torrolink — Paid Advertising Strategy

Start paid ads ONLY after organic validates your messaging. Running ads before you know what converts is burning money. Use this playbook after your first 10 paying customers.

---

## Platform Priority

### 1. Meta (Facebook + Instagram) — Start Here
**Why first:** Local small business owners are on Facebook. You can target by job title, industry, and location. Cheapest CPM of any paid channel for this audience.

**Budget to start:** $10/day ($300/month)

**Campaign structure:**

- **Campaign:** Torrolink QR — Local Businesses
- **Objective:** Conversions (purchase event on Stripe thank-you page)
- **Ad sets (3 audiences to test):**
  1. Restaurant owners within 25 miles of your city (interests: restaurant management, food service)
  2. Trades & contractors (interests: plumbing, electrician, HVAC, home improvement)
  3. Lookalike 1% based on existing customers (once you have 100+ pixel events)
- **Creative:** Short video (15-30 sec) — phone scanning a QR code, profile page loads beautifully, text overlay: "$28. One-time. Yours for life."

**Targeting tips:**
- Job title: "Restaurant Owner", "General Contractor", "Licensed Electrician", "Shop Owner"
- Exclude: employees (salary range under $40k), students
- Placement: Instagram Feed + Facebook Feed only (no Audience Network)

---

### 2. Google Search Ads — Phase 2 (Month 2+)
**Why second:** Higher intent — people searching "QR code for small business" are already in buy mode. But CPCs are $2-5, so budget matters.

**Budget:** $15/day after Meta is profitable

**Campaign: Branded + Category**

Keywords to bid on:
- "qr code for small business" (exact match)
- "qr code for restaurant" (exact match)
- "qr code for business card" (exact match)
- "dynamic qr code small business" (phrase match)
- "torrolink" (branded — protect from competitors)

Negative keywords: "free qr code", "qr code generator free", "qr code scanner", "what is a qr code"

**Ad copy (Headline/Description):**
> One QR Code. Your Whole Business. | Torrolink
> $28.33. One-time. No subscription. Works on cards, signs, menus. Set up in 5 min.

---

### 3. TikTok Ads — Phase 3 (Optional)
Works if your organic TikToks are getting views. Boost your best organic post as a Spark Ad — no need to create separate ad creative.

**Budget:** $5/day to boost any video over 10k organic views

---

## Tracking Setup (Before Spending a Dollar)

These must be in place before running paid ads:

1. **Meta Pixel** on torrolink.com — install via Netlify (add pixel script to index.html head)
2. **Conversion event** — fire `Purchase` event on success.html with value = 28.33
3. **Google Tag** + **Google Ads conversion** on success.html
4. **UTM parameters** on every ad URL (e.g. `?utm_source=meta&utm_campaign=launch`)

Without tracking, you're flying blind. Don't skip this.

---

## Creative Angles to Test

Test these as ad concepts — run each for 7 days at $5/day, kill what doesn't convert:

| Angle | Hook | Format |
|-------|------|--------|
| Demo | "Scan this QR code" → beautiful profile loads | 15s video |
| Price anchor | "$28 one-time vs $10/month forever" | Static image |
| Pain point | "Business cards that do nothing" | Video text |
| Social proof | "3 days in — [customer] got 5 new bookings" | Screenshot/quote |
| Niche | "Every contractor needs this on their invoice" | Video |

---

## Budget Ramp-Up Plan

| Month | Daily Budget | Focus | Target ROAS |
|-------|-------------|-------|-------------|
| 1 | $10 | Meta only — test 3 audiences | Break even (1x) |
| 2 | $20 | Scale winning Meta audience + start Google | 2x |
| 3 | $40 | Scale both, add retargeting | 3x+ |

**Rule:** Never increase a campaign budget more than 20% in one day. Meta's algorithm needs time to learn.

---

## Retargeting (High ROI — Don't Skip)

Once you have 100+ website visitors:

- **Audience:** Everyone who visited torrolink.com in last 30 days but didn't purchase
- **Ad:** Reminder with mild urgency — "Still thinking about it? Here's a look at what you'd get"
- **Budget:** $3/day — will convert at 3-5x the rate of cold traffic

---

## Attribution Note

Meta's pixel is blocked by iOS privacy settings for ~40% of users. Your actual conversion rate is likely higher than what Meta reports. Rule of thumb: if Meta shows 0.5x ROAS, your real ROAS is probably closer to 1x. Don't kill campaigns too early.

---

## When to Pause Ads

Pause if:
- CPL (cost per lead) exceeds $15 after 7 days of data
- CTR drops below 0.8% (creative fatigue)
- You run out of budget to fulfill orders (great problem to have)

Resume with fresh creative or new audience.
