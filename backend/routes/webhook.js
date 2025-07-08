const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const Gutschein = require("../models/Gutschein");
require("dotenv").config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    // 🔍 Debugging
    console.log("📩 Raw Body:", req.body.toString());
    console.log("🔐 Webhook Secret geladen:", process.env.STRIPE_WEBHOOK_SECRET);

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ Kein Webhook-Secret gesetzt!");
      return res.status(500).send("Webhook secret fehlt.");
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook Fehler:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`🔔 Event empfangen: ${event.type}`);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("✅ Zahlung erfolgreich:", paymentIntent.id);

      const code = paymentIntent.metadata?.gutscheincode;
      if (!code) {
        console.warn("⚠️ Kein Gutscheincode enthalten.");
        return res.status(200).send();
      }

      try {
        const gutschein = await Gutschein.findOneAndUpdate(
          { code },
          { eingelöst: true },
          { new: true }
        );

        if (gutschein) {
          console.log(`🎉 Gutschein ${code} eingelöst.`);
        } else {
          console.warn(`🔎 Gutschein ${code} nicht gefunden.`);
        }
      } catch (err) {
        console.error("❌ Fehler beim Gutschein-Update:", err.message);
      }
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;
