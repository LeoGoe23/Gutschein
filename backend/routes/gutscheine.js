const express = require("express");
const router = express.Router();
const Gutschein = require("../models/Gutschein");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  try {
    const { code, betrag, empfängerEmail } = req.body;

    const neuerGutschein = new Gutschein({ code, betrag, empfängerEmail });
    await neuerGutschein.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: empfängerEmail,
      subject: "Dein Gutschein",
      text: `Hallo! Dein Gutschein-Code lautet: ${code}. Wert: ${betrag} €`,
    });

    res.status(201).json({ message: "Gutschein erstellt und E-Mail gesendet" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Erstellen oder Senden" });
  }
});

module.exports = router;
