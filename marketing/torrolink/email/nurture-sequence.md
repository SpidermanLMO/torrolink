# TorroLink — New Signup Nurture Sequence
**BRAND: TorroLink**
FROM: hello@torrolink.com
FROM NAME: TorroLink
TARGET: Anyone who just signed up for a free TorroLink account
STATUS: Draft — awaiting Laign approval

---

## EMAIL 1 — Immediately after signup
**SUBJECT:** Welcome to TorroLink — let's get your profile live
**PREVIEW TEXT:** You're 5 minutes away from your first QR code.

---

Hi [First Name],

Welcome — you just made a smart move.

Here's what to do right now:

1. Log in at torrolink.com/portal
2. Add your business info — name, hours, phone, address
3. Upload a few photos (your space, your work, your team)
4. Add your social links and Google review link
5. Download your QR code — print it, stick it somewhere visible

That's it. You're live.

If you get stuck on anything, reply to this email. I check it.

— Laign
Founder, TorroLink

---

## EMAIL 2 — Day 3 (if profile incomplete)
**SUBJECT:** Quick check-in on your TorroLink profile
**PREVIEW TEXT:** You're almost there.

---

Hi [First Name],

Just checking in — did you get a chance to finish your profile?

The businesses that get the most scans are the ones with:
- A clear profile photo or logo
- At least 3–5 photos of their space or work
- A Google review link (this one's huge — it makes it effortless for customers to leave reviews)

If you haven't added those yet, it takes less than 5 minutes and makes a real difference.

Log in here → torrolink.com/portal

Any questions, just reply.

— Laign

---

## EMAIL 3 — Day 7
**SUBJECT:** Where to put your QR code (this matters)
**PREVIEW TEXT:** Placement = scans. Here's what works.

---

Hi [First Name],

Now that your profile is set up, the question is: where do you put the QR code?

Best spots by business type:

**Restaurant / café:** Table cards, menus, receipt, front window
**Salon / barbershop:** Checkout counter, mirror card, appointment reminder card
**Contractor / trades:** Side of truck, job site sign, business card, invoice footer
**Retail:** Cash register counter, fitting room, shopping bag insert
**Gym / studio:** Front desk, locker room, sign-in sheet

The more places people can scan it, the more it works. It's not a one-time thing — it compounds.

If you want to talk through what makes sense for your specific business, reply to this and we'll figure it out.

— Laign

---

## EMAIL 4 — Day 14
**SUBJECT:** How many scans have you gotten?
**PREVIEW TEXT:** Log in to see your analytics.

---

Hi [First Name],

Two weeks in — how's it going?

You can see exactly how many times your QR code has been scanned by logging into your dashboard at torrolink.com/portal. Check which links people are clicking, how often they're viewing your photos, and where they're coming from.

If your scan count is low, usually it's one of two things:
1. The QR code isn't in a high-visibility spot yet
2. The profile still needs a few more photos or links

Both easy fixes. Reply if you want a second set of eyes on your profile.

And if things are going well — leave us a review. It helps more than you know.

— Laign

---

## DEPLOYMENT NOTES
- Email 1: send immediately on signup (trigger via Resend webhook on new account creation)
- Email 2: Day 3, only if profile completion < 80% (check Supabase)
- Email 3: Day 7, send to all active signups
- Email 4: Day 14, send to all active signups
- Stop all emails if they upgrade to a paid plan (they're already converted)
