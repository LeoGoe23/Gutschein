require("dotenv").config();
const Unternehmen = require("../models/Unternehmen");
const express = require("express");
const router  = express.Router();
const createMollieClient = require('@mollie/api-client');
const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

// Express Connect: Konto anlegen
// Mollie Connect would require an OAuth flow which is not implemented here
router.post("/create-account", (req, res) => {
  res.status(501).json({ error: "Mollie Connect nicht implementiert" });
});

// Express Connect: Onboarding-Link generieren
router.get("/onboard/:accountId", (req, res) => {
  res.status(501).json({ error: "Mollie Connect nicht implementiert" });
});

router.post("/create-payment", async (req, res) => {
  const { amount, customerEmail, method } = req.body;
  if (amount == null || !customerEmail || !method) {
    return res.status(400).json({ error: "amount, customerEmail und method sind erforderlich" });
  }
  try {
    const payment = await mollie.payments.create({
      amount: { value: (amount / 100).toFixed(2), currency: "EUR" },
      description: "Gutschein",
      redirectUrl: `${process.env.DOMAIN}/success`,
      webhookUrl: `${process.env.DOMAIN}/api/webhook`,
      method,
      metadata: { customerEmail }
    });
    res.json({ paymentUrl: payment._links.checkout.href });
  } catch (err) {
    console.error("Mollie-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
  });

module.exports = router;
