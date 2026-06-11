// ================================================
// TORROLINK — BILLING AGENT
// Manages Stripe subscriptions, flags churn,
// sends renewal reminders, alerts Laign
// ================================================

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "laigno@gmail.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return respond(405, { error: "Method not allowed" });

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return respond(400, { error: `Webhook Error: ${err.message}` });
  }

  try {
    const data = stripeEvent.data.object;

    switch (stripeEvent.type) {

      // ── NEW SUBSCRIPTION ─────────────────────────────
      case "customer.subscription.created": {
        const customer = await stripe.customers.retrieve(data.customer);
        await resend.emails.send({
          from: "Torrolink Billing <billing@torrolink.com>",
          to: OWNER_EMAIL,
          subject: `💰 New Subscriber: ${customer.email}`,
          html: `<p><strong>${customer.name || customer.email}</strong> just subscribed to <strong>${data.items.data[0]?.price?.nickname || "a plan"}</strong>.</p><p>Amount: $${(data.items.data[0]?.price?.unit_amount / 100).toFixed(2)}/mo</p>`,
        });
        break;
      }

      // ── PAYMENT SUCCESS ──────────────────────────────
      case "invoice.payment_succeeded": {
        const customer = await stripe.customers.retrieve(data.customer);
        await resend.emails.send({
          from: "Torrolink <billing@torrolink.com>",
          to: customer.email,
          subject: "Your Torrolink payment was received ✅",
          html: `
            <div style="font-family:sans-serif;max-width:500px;">
              <h2 style="color:#0f6b6b;">Payment Confirmed</h2>
              <p>Hi ${customer.name?.split(" ")[0] || "there"}, your payment of <strong>$${(data.amount_paid / 100).toFixed(2)}</strong> has been received.</p>
              <p>Your QR code and services will continue uninterrupted.</p>
              <p style="color:#888;font-size:0.85rem;">Torrolink — A PTorro Holdings Company</p>
            </div>
          `,
        });
        break;
      }

      // ── PAYMENT FAILED ───────────────────────────────
      case "invoice.payment_failed": {
        const customer = await stripe.customers.retrieve(data.customer);

        // Alert Laign
        await resend.emails.send({
          from: "Torrolink Billing <billing@torrolink.com>",
          to: OWNER_EMAIL,
          subject: `⚠️ Payment Failed: ${customer.email}`,
          html: `<p>Payment failed for <strong>${customer.email}</strong>. Amount: $${(data.amount_due / 100).toFixed(2)}. Stripe will retry automatically.</p>`,
        });

        // Alert customer
        await resend.emails.send({
          from: "Torrolink Billing <billing@torrolink.com>",
          to: customer.email,
          subject: "Action needed: Your Torrolink payment failed",
          html: `
            <div style="font-family:sans-serif;max-width:500px;">
              <h2 style="color:#e06420;">Payment Issue</h2>
              <p>Hi ${customer.name?.split(" ")[0] || "there"}, we were unable to process your payment of <strong>$${(data.amount_due / 100).toFixed(2)}</strong>.</p>
              <p>Please update your payment method to keep your QR code and services active.</p>
              <a href="https://torrolink.com/billing" style="background:#f4752b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Update Payment Method</a>
              <p style="color:#888;font-size:0.85rem;margin-top:24px;">Torrolink — A PTorro Holdings Company</p>
            </div>
          `,
        });
        break;
      }

      // ── SUBSCRIPTION CANCELLED ───────────────────────
      case "customer.subscription.deleted": {
        const customer = await stripe.customers.retrieve(data.customer);
        await resend.emails.send({
          from: "Torrolink Billing <billing@torrolink.com>",
          to: OWNER_EMAIL,
          subject: `📉 Cancellation: ${customer.email}`,
          html: `<p><strong>${customer.email}</strong> has cancelled their subscription. Consider a win-back email.</p>`,
        });
        break;
      }
    }

    return respond(200, { received: true });

  } catch (err) {
    console.error("Billing agent error:", err);
    await fetch(`${process.env.URL}/.netlify/functions/supervisor-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_failed",
        agentName: "billing-agent",
        agentError: err.message,
      }),
    }).catch(() => {});
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
