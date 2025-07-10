const Unternehmen = require("../models/Unternehmen");
const express = require("express");
const router  = express.Router();
const Stripe  = require("stripe");
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-payment-intent", async (req, res) => {
  const { amount, firebaseUid } = req.body;
  if (amount == null || !firebaseUid) {
    return res.status(400).json({ error: "amount und firebaseUid sind erforderlich" });
  }
  try {
    const firma = await Unternehmen.findOne({ firebaseUid });
    if (!firma || !firma.stripeAccountId) {
      return res.status(404).json({ error: "Unternehmen oder Stripe-Account nicht gefunden" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "eur",
      payment_method_types: ["card"],
      transfer_data: {
        destination: firma.stripeAccountId
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;