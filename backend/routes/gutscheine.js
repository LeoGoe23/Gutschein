const express = require("express");
const router = express.Router();
const Gutschein = require("../models/Gutschein");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  try {
    const { code, betrag, empfängerEmail } = req.body;

    console.log("Neue Anfrage empfangen:", { code, betrag, empfängerEmail });

    const neuerGutschein = new Gutschein({ code, betrag, empfängerEmail });
    await neuerGutschein.save();
    console.log("Gutschein erfolgreich gespeichert.");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("SMTP-Transporter erstellt. Sende E-Mail...");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: empfängerEmail,
      subject: "Dein Gutschein",
      text: `Hallo! Dein Gutschein-Code lautet: ${code}. Wert: ${betrag} €`,
    }, (error, info) => {
      if (error) {
        console.error("Fehler beim Senden:", error);
        return res.status(403).json({ error: "E-Mail konnte nicht gesendet werden", details: error.message });
      } else {
        console.log("E-Mail gesendet:", info.response);
        return res.status(201).json({ message: "Gutschein erstellt und E-Mail gesendet" });
      }
    });

  } catch (err) {
    console.error("Fehler im catch-Block:", err);
    res.status(500).json({ error: "Fehler beim Erstellen oder Senden" });
  }
});

module.exports = router;
