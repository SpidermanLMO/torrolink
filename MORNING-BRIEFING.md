# Torrolink — Morning Briefing
**Updated:** June 12, 2026 — overnight session

---

## ✅ EVERYTHING THAT'S NOW WORKING

### 1. Portal — Create Account & Forgot Password (FIXED)
- **Create Account** works — customers enter email, password, confirm password. Account is created immediately, no email confirmation loop.
- Password requirements enforced: 8+ chars, 1 capital letter, 1 symbol
- **Forgot Password** works — sends a real reset link via Resend email (bypasses Supabase's broken SMTP)
- Both are confirmed live and working at https://torrolink.com/portal

### 2. Your Roofing Profile is Live
- **URL:** https://torrolink.com/p/ptorro-holdings-llc
- **QR Code URL:** https://torrolink.com/q/qpdc8hhb
- Tagline: "Professional Roofing — Licensed & Insured"
- Bio: residential, commercial, storm damage, free estimates, veteran-owned
- Lead form ON with 6 checkboxes: Free estimate, Roof repair, Full replacement, Storm/hail damage, Insurance claim help, Commercial roofing
- When a homeowner scans your QR and fills out the form → **you get an email immediately at laigno@gmail.com** with their name, number, and what they want

### 3. Homepage Updated
- New **Roofer / Contractor** phone card preview shows your profile style
- New **"Roofers & Contractors"** use case section
- Contact form dropdown fixed to "I'm interested in..."
- Live at: https://torrolink.com

### 4. Lead Notification Emails Fixed
- Lead emails now show **which checkboxes the customer selected** (storm damage, repair, etc.) — was missing before
- CTA in lead email now links to `/portal` correctly

### 5. Purchase Email Fixed
- After checkout, customers now see: "Click **Create Account** with this email"
- Previously said "sign in with the password you set" which confused new customers

### 6. Print Materials Created
- **ptorro-flyer.html** — open it, add your phone number, and print at Staples/FedEx Office
- Includes a door hanger and 6 business card copies, all with your QR code embedded

---

## 🚨 DO THIS FIRST WHEN YOU WAKE UP

### Step 1 — Complete your portal profile (5 minutes)
1. Go to **https://torrolink.com/portal**
2. Click **Create Account** → use **laigno@gmail.com**, set a password
3. Once logged in, go to the Profile tab and add:
   - **Phone number** ← makes a tap-to-call button appear on your profile
   - **Owner name** (your name)
   - Your **Google Reviews** link (paste the URL in Links)
4. Upload your logo if you have one

### Step 2 — Print your door hangers and business cards
- Open **ptorro-flyer.html** in your TorroLink folder in Chrome
- Fill in your phone number where it says `(___) ___-____`
- Ctrl+P → Save as PDF (or print directly)
- Take to FedEx Office / Staples to print on cardstock

### Step 3 — Delete the "fascinating-spark" Stripe webhook (2 minutes)
- Go to https://dashboard.stripe.com → Webhooks
- Delete "fascinating-spark" (the sandbox one)
- Keep "vibrant-wonder" — that's the live one that processes payments

---

## 💡 HOW TO CLOSE ROOFING DEALS WITH YOUR QR CODE

### QR Code: `https://torrolink.com/q/qpdc8hhb`
### Profile: `https://torrolink.com/p/ptorro-holdings-llc`

**Put your QR code here:**
1. **Truck** — magnetic sign: "Free Roofing Estimate — Scan Me"
2. **Yard signs** — at every active job: "ROOFING IN PROGRESS — Free Estimates"
3. **Business cards** — leave one with every customer after finishing a job
4. **Door hangers** — hit the 10 nearest homes to every job site
5. **Storm neighborhoods** — drive impacted areas after storms, leave door hangers

**Your pitch when talking to homeowners:**
> "I'm working on a roof just down the street — scan this code if you ever want a free estimate. I'll call you back the same day. No pressure."

Every scan lands on your lead form. When they submit it, you get an email at laigno@gmail.com within seconds with their name and contact info.

---

## 🔧 TECHNICAL STATUS

| System | Status |
|---|---|
| Portal Create Account | ✅ Working |
| Portal Sign In | ✅ Working |
| Portal Forgot Password | ✅ Working |
| Stripe Checkout | ✅ Working |
| QR Generation & Email | ✅ Working |
| PTorro Profile + Lead Form | ✅ Live |
| Lead Notification Emails | ✅ Working (goes to laigno@gmail.com) |
| Homepage (with Roofer content) | ✅ Live |
| Contact Form | ✅ Working |
| Print Materials (ptorro-flyer.html) | ✅ Ready to print |

---

## 📌 OPTIONAL UPGRADES (when you're ready)
- Upload a logo to your profile — makes it look professional
- Add your Google Reviews link to your profile links
- Record a quick 30-second phone video of a finished job and add it to your profile
- Activate Metrics & Leads ($10.28/mo) from the portal Upgrade tab — lets you see scan analytics

---

God bless. Go get those roofs.
