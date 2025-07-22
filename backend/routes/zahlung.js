require("dotenv").config();
const Unternehmen = require("../models/Unternehmen");
const express = require("express");
const router  = express.Router();

// Debugging: Check if environment variables are loaded
console.log("MOLLIE_API_KEY exists:", !!process.env.MOLLIE_API_KEY);
console.log("DOMAIN:", process.env.DOMAIN);

const { createMollieClient } = require('@mollie/api-client');
const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

router.post("/create-payment", async (req, res) => {
  console.log("Received payment request:", req.body);
  
  const { amount, customerEmail, method } = req.body;
  
  if (amount == null || !customerEmail || !method) {
    console.log("Validation failed:", { amount, customerEmail, method });
    return res.status(400).json({ error: "amount, customerEmail und method sind erforderlich" });
  }
  
  try {
    console.log("Creating payment with:", {
      amount: (amount / 100).toFixed(2),
      customerEmail,
      method
    });

    const payment = await mollie.payments.create({
      amount: { value: (amount / 100).toFixed(2), currency: "EUR" },
      description: "Gutschein",
      redirectUrl: `${process.env.DOMAIN}/success`,
      method: method,
      metadata: { customerEmail }
    });
    
    console.log("Payment created successfully:", payment.id);
    res.json({ paymentUrl: payment._links.checkout.href });
  } catch (err) {
    console.error("Mollie-Fehler (Full Error):", err);
    console.error("Error message:", err.message);
    console.error("Error details:", err.details || 'No details');
    res.status(500).json({ error: err.message });
  }
});

// Express Connect: Konto anlegen
// Mollie Connect would require an OAuth flow which is not implemented here
router.post("/create-account", (req, res) => {
  res.status(501).json({ error: "Mollie Connect nicht implementiert" });
});

// Express Connect: Onboarding-Link generieren
router.get("/onboard/:accountId", (req, res) => {
  res.status(501).json({ error: "Mollie Connect nicht implementiert" });
});

module.exports = router;
