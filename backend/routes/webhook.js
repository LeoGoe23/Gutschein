const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const { createMollieClient } = require('@mollie/api-client'); // <- HIER: { } hinzufügen
const mollie      = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
const Gutschein   = require("../models/Gutschein");

router.post(
  "/",
  bodyParser.json(),
  async (req, res) => {
    const paymentId = req.body.id;
    try {
      const payment = await mollie.payments.get(paymentId);
      console.log("Mollie Event:", payment.status);

      if (payment.status === "paid") {
        const code = payment.metadata?.gutscheincode;
        if (code) {
          await Gutschein.findOneAndUpdate(
            { code },
            { eingelöst: true }
          );
          console.log("Gutschein", code, "als eingelöst markiert");
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;