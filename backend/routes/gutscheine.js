const express    = require("express");
const router     = express.Router();
const Gutschein  = require("../models/Gutschein");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { code, betrag, empfaengerEmail } = req.body;

  // 1) Basic Input Validation
  if (!code || typeof betrag !== "number" || !empfaengerEmail) {
    return res.status(400).json({ error: "code, betrag und empfaengerEmail sind erforderlich" });
  }

  try {
    // 2) Speichern
    const neuerGutschein = new Gutschein({ code, betrag, empfaengerEmail });
    await neuerGutschein.save();
    console.log("Gutschein gespeichert");

    // 3) Mail versenden
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: empfaengerEmail,
        subject: "Dein Gutschein",
        text: `Hallo! Dein Gutschein-Code lautet: ${code}. Wert: ${betrag} €`,
      });
      console.log("E-Mail versandt");
      return res.status(201).json({ message: "Gutschein erstellt & E-Mail gesendet" });
    } catch (mailErr) {
      console.error("Fehler beim Senden der E-Mail:", mailErr);
      return res.status(502).json({ error: "Gutschein gespeichert, aber E-Mail fehlgeschlagen" });
    }

  } catch (err) {
    console.error("Fehler im POST /api/gutscheine:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Gutschein-Code existiert bereits" });
    }
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;