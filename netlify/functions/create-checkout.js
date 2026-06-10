// ================================================
// TORROLINK — CREATE CHECKOUT
// Creates a Stripe Checkout session for one-time
// purchases and subscription plans
// ================================================

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  try {
    const { plan, businessName, customerEmail } = JSON.parse(event.body || "{}");

    // ── PRICE MAP ─────────────────────────────────────
    const prices = {
      "qr-code":          { amount: 2833, mode: "payment",      name: "Torrolink QR Code",                    desc: "Permanent QR code + free profile page — yours forever" },
      "branding":         { amount:  928, mode: "payment",      name: "Torrolink Personal Branding Add-On",   desc: "Logo embedded in QR code, brand colors, print-ready files" },
      "qr-code-branding": { amount: 3761, mode: "payment",      name: "Torrolink QR Code + Personal Branding",desc: "QR code with your logo and brand colors embedded, print-ready" },
      "metrics":          { amount: 1028, mode: "subscription", name: "Torrolink Metrics + Leads",            desc: "Real-time scan analytics and lead capture — cancel anytime" },
    };

    const selected = prices[plan];
    if (!selected) return respond(400, { error: "Invalid plan." });

    const sessionConfig = {
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: selected.name,
            description: selected.desc,
          },
          unit_amount: selected.amount,
          ...(selected.mode === "subscription" && { recurring: { interval: "month" } }),
        },
        quantity: 1,
      }],
      mode: selected.mode,
      success_url: `${process.env.DEPLOY_URL || "https://torrolink.com"}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.DEPLOY_URL || "https://torrolink.com"}/#pricing`,
      customer_email: customerEmail || undefined,
      metadata: { plan, businessName: businessName || "" },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return respond(200, { url: session.url });

  } catch (err) {
    console.error("Checkout error:", err);
    return respond(500, { error: err.message });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
