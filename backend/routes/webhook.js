const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const Stripe      = require("stripe");
const stripe      = new Stripe(process.env.STRIPE_SECRET_KEY);
const Gutschein   = require("../models/Gutschein");

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("Stripe Event:", event.type);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      console.log("Zahlung erfolgreich:", pi.id);

      // Beispiel: markiere Gutschein als eingelöst, wenn Code im Metadata
      const code = pi.metadata?.gutscheincode;
      if (code) {
        await Gutschein.findOneAndUpdate(
          { code },
          { eingelöst: true }
        );
        console.log("Gutschein", code, "als eingelöst markiert");
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;