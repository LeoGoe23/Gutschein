const express     = require("express");
const router      = express.Router();
const { createMollieClient } = require('@mollie/api-client'); // <- HIER: { } hinzufügen
const mollie      = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
const Gutschein   = require("../models/Gutschein");

router.post(
  "/",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const paymentId = req.body.id;
      if (!paymentId) {
        console.warn("Webhook ohne payment id", req.body);
        return res.status(400).send("Missing payment id");
      }

      const payment = await mollie.payments.get(paymentId);
      console.log("Mollie Event:", payment.status, payment.id);

      if (payment.status === "paid") {
        const code = payment.metadata && payment.metadata.gutscheincode;
        if (code) {
          await Gutschein.findOneAndUpdate(
            { code },
            { eingelöst: true }
          );
          console.log(`Gutschein ${code} als eingelöst markiert.`);
        }
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Webhook Error:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;