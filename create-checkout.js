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
      "one-time":        { amount: 2833, mode: "payment",      name: "Torrolink QR Code — One-Time",          desc: "Permanent QR code, yours forever" },
      "one-time-design": { amount: 5261, mode: "payment",      name: "Torrolink QR Code + Custom Design",     desc: "Permanent QR code with logo & brand colors embedded" },
      "subscription":    { amount: 1828, mode: "subscription", name: "Torrolink Subscription",                desc: "Dynamic QR, editable landing page, analytics & leads" },
      "managed":         { amount: 4028, mode: "subscription", name: "Torrolink Fully Managed",               desc: "Everything in Subscription plus we manage it for you" },
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
