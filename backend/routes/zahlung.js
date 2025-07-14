require("dotenv").config();
const Unternehmen = require("../models/Unternehmen");
const express = require("express");
const router  = express.Router();
const Stripe  = require("stripe");
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);

// Express Connect: Konto anlegen
router.post("/create-account", async (req, res) => {
  try {
    const account = await stripe.accounts.create({ type: "express" });
    res.json({ accountId: account.id });
  } catch (err) {
    console.error("Connect-Fehler beim Erstellen des Accounts:", err);
    res.status(500).json({ error: err.message });
  }
});

// Express Connect: Onboarding-Link generieren
router.get("/onboard/:accountId", async (req, res) => {
  try {
    const link = await stripe.accountLinks.create({
      account: req.params.accountId,
      refresh_url: `${process.env.DOMAIN}/reauth`,
      return_url: `${process.env.DOMAIN}/success`,
      type: "account_onboarding",
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error("Connect-Fehler beim Erzeugen des Onboarding-Links:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/create-payment-intent", async (req, res) => {
  const { amount, customerEmail } = req.body;
  if (amount == null || !customerEmail) {
    return res.status(400).json({ error: "amount und customerEmail sind erforderlich" });
  }
  try {
    // Für jetzt erstellen wir einfach einen Payment Intent ohne Connect
    // Sie können später die Unternehmen-Logik hinzufügen
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        customerEmail: customerEmail
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;