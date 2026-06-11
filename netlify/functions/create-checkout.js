// ================================================
// TORROLINK — CREATE CHECKOUT
// Creates a Stripe Checkout session for one-time
// purchases and subscription plans
// ================================================

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  try {
    const { plan, businessName, customerEmail, addMetrics } = JSON.parse(event.body || "{}");

    // ── PRICE MAP ─────────────────────────────────────
    const prices = {
      "qr-code":                 { amount: 2833, mode: "payment",      name: "Torrolink QR Code",                       desc: "Permanent QR code + free profile page — yours forever" },
      "branding":                { amount:  928, mode: "payment",      name: "Torrolink Standard Branding",             desc: "Your logo embedded in the QR center — preview before we finalize" },
      "custom-branding":         { amount: 1828, mode: "payment",      name: "Torrolink Custom Branding",               desc: "Logo + custom dot style, QR color & frame — you approve the design first" },
      "qr-code-branding":        { amount: 3761, mode: "payment",      name: "Torrolink QR Code + Standard Branding",   desc: "Permanent QR code with your logo embedded, print-ready" },
      "qr-code-custom-branding": { amount: 4661, mode: "payment",      name: "Torrolink QR Code + Custom Branding",     desc: "Permanent QR code — fully custom colors, dot style, frame & logo" },
      "metrics":                 { amount: 1028, mode: "subscription", name: "Torrolink Metrics + Leads",               desc: "Real-time scan analytics and lead capture — cancel anytime" },
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
      metadata: { plan, businessName: businessName || "", addMetrics: addMetrics ? "true" : "false" },
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
