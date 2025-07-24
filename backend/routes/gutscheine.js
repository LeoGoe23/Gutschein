const express    = require("express");
const router     = express.Router();
const Gutschein  = require("../models/Gutschein");
const nodemailer = require("nodemailer");
const path       = require("path");
const fs         = require("fs");

// Erweiterte Transporter-Konfiguration mit Debug
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true
});

// Transporter-Verbindung testen beim Start
transporter.verify((error, success) => {
  if (error) {
    console.error("=== TRANSPORTER VERBINDUNG FEHLGESCHLAGEN ===");
    console.error(error);
  } else {
    console.log("=== TRANSPORTER VERBINDUNG ERFOLGREICH ===");
    console.log("E-Mail User:", process.env.EMAIL_USER ? "✓ Gesetzt" : "✗ Nicht gesetzt");
    console.log("E-Mail Pass:", process.env.EMAIL_PASS ? "✓ Gesetzt" : "✗ Nicht gesetzt");
  }
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

// Verbesserte Route für Gutschein-E-Mail mit PDF-Anhang und Stripe-Session-Absicherung
router.post("/send-gutschein", async (req, res) => {
  console.log("=== DEBUG: /send-gutschein Route aufgerufen ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request headers:", req.headers);
  console.log("Request body keys:", Object.keys(req.body));
  
  const { empfaengerEmail, unternehmensname, pdfBuffer, gutscheinCode, betrag, dienstleistung, stripeSessionId } = req.body;

  console.log("=== EINGABE-PARAMETER ===");
  console.log("Empfänger E-Mail:", empfaengerEmail);
  console.log("Empfänger E-Mail Type:", typeof empfaengerEmail);
  console.log("Unternehmensname:", unternehmensname);
  console.log("Gutschein-Code:", gutscheinCode);
  console.log("Betrag:", betrag, "(Type:", typeof betrag, ")");
  console.log("PDF Buffer vorhanden:", !!pdfBuffer);
  console.log("PDF Buffer type:", typeof pdfBuffer);
  console.log("PDF Buffer length:", pdfBuffer ? pdfBuffer.length : 'undefined');
  console.log("Dienstleistung:", dienstleistung);
  console.log("Stripe-Session-ID:", stripeSessionId);

  // Erweiterte Validierung
  if (!empfaengerEmail || !unternehmensname || !pdfBuffer || !gutscheinCode) {
    console.log("=== VALIDIERUNG FEHLGESCHLAGEN ===");
    console.log("empfaengerEmail:", !!empfaengerEmail);
    console.log("unternehmensname:", !!unternehmensname);
    console.log("pdfBuffer:", !!pdfBuffer);
    console.log("gutscheinCode:", !!gutscheinCode);
    return res.status(400).json({ error: "Alle Felder sind erforderlich" });
  }

  // E-Mail-Format validieren
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(empfaengerEmail)) {
    console.log("=== UNGÜLTIGE E-MAIL-ADRESSE ===");
    return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
  }

  // Stripe-Session-Absicherung: Prüfe, ob für diese Session schon ein Gutschein existiert
  if (stripeSessionId) {
    const existing = await Gutschein.findOne({ stripeSessionId });
    if (existing) {
      console.log("=== Gutschein für diese Stripe-Session existiert bereits ===");
      return res.status(409).json({ error: "Für diese Zahlung wurde bereits ein Gutschein verschickt." });
    }
  }

  try {
    console.log("=== PDF BUFFER VERARBEITUNG ===");
    
    // PDF Buffer validieren und konvertieren
    let pdfData;
    try {
      pdfData = Buffer.from(pdfBuffer, 'base64');
      console.log("PDF Data Buffer erfolgreich erstellt, Größe:", pdfData.length);
      
      // Prüfen ob es wirklich ein PDF ist (einfache Signatur-Prüfung)
      const pdfSignature = pdfData.slice(0, 4).toString();
      console.log("PDF Signature:", pdfSignature);
      if (!pdfSignature.includes('%PDF')) {
        console.warn("⚠️ PDF Signatur nicht erkannt - könnte kein valides PDF sein");
      }
    } catch (bufferError) {
      console.error("=== FEHLER bei PDF Buffer Konvertierung ===");
      console.error(bufferError);
      return res.status(400).json({ error: "Ungültiger PDF Buffer" });
    }

    // Gutschein speichern inkl. stripeSessionId
    const neuerGutschein = new Gutschein({
      code: gutscheinCode,
      betrag,
      empfaengerEmail,
      stripeSessionId
    });
    await neuerGutschein.save();

    // E-Mail-Text basierend auf Gutschein-Typ
    const emailText = dienstleistung 
      ? `Hallo!\n\nVielen Dank für Ihren Einkauf bei ${unternehmensname}!\n\nIm Anhang finden Sie Ihren Gutschein für: ${dienstleistung.shortDesc}\n\nGutschein-Code: ${gutscheinCode}\n\nWir freuen uns auf Ihren Besuch!\n\nViele Grüße\nIhr Team von ${unternehmensname}`
      : `Hallo!\n\nVielen Dank für Ihren Einkauf bei ${unternehmensname}!\n\nIm Anhang finden Sie Ihren Wertgutschein über ${betrag}€.\n\nGutschein-Code: ${gutscheinCode}\n\nWir freuen uns auf Ihren Besuch!\n\nViele Grüße\nIhr Team von ${unternehmensname}`;

    console.log("=== E-MAIL KONFIGURATION ===");
    console.log("Von:", process.env.EMAIL_USER);
    console.log("An:", empfaengerEmail);
    console.log("Betreff: Ihr Gutschein von", unternehmensname);
    console.log("Anhang Dateiname:", `Gutschein_${unternehmensname}_${gutscheinCode}.pdf`);
    console.log("Anhang Größe:", pdfData.length, "bytes");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: empfaengerEmail,
      subject: `Ihr Gutschein von ${unternehmensname}`,
      text: emailText,
      html: `
        <h2>Vielen Dank für Ihren Einkauf!</h2>
        <p>Hallo!</p>
        <p>Vielen Dank für Ihren Einkauf bei <strong>${unternehmensname}</strong>!</p>
        <p>Im Anhang finden Sie Ihren ${dienstleistung ? `Gutschein für: <strong>${dienstleistung.shortDesc}</strong>` : `Wertgutschein über <strong>${betrag}€</strong>`}.</p>
        <p><strong>Gutschein-Code:</strong> ${gutscheinCode}</p>
        <p>Wir freuen uns auf Ihren Besuch!</p>
        <p>Viele Grüße<br>Ihr Team von ${unternehmensname}</p>
      `,
      attachments: [{
        filename: `Gutschein_${unternehmensname}_${gutscheinCode}.pdf`,
        content: pdfData,
        contentType: 'application/pdf'
      }]
    };

    console.log("=== E-MAIL WIRD VERSENDET ===");
    console.log("Transporter ready:", transporter ? "✓" : "✗");
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log("=== E-MAIL ERFOLGREICH VERSANDT ===");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("Envelope:", info.envelope);
    
    res.status(200).json({ 
      message: "Gutschein-E-Mail erfolgreich versandt",
      messageId: info.messageId 
    });

  } catch (err) {
    console.error("=== DETAILLIERTER FEHLER beim Senden der E-Mail ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error command:", err.command);
    console.error("Error response:", err.response);
    console.error("Error responseCode:", err.responseCode);
    console.error("Full error object:", err);
    
    res.status(500).json({ 
      error: "Fehler beim Senden der E-Mail",
      details: err.message,
      code: err.code 
    });
  }
});

// NEUE TEST-ROUTE: Einfache E-Mail ohne PDF
router.post("/send-simple-gutschein", async (req, res) => {
  console.log("=== DEBUG: /send-simple-gutschein Route aufgerufen ===");
  console.log("Timestamp:", new Date().toISOString());
  
  const { empfaengerEmail, unternehmensname, gutscheinCode, betrag, dienstleistung } = req.body;

  console.log("=== EINGABE-PARAMETER (ohne PDF) ===");
  console.log("Empfänger E-Mail:", empfaengerEmail);
  console.log("Unternehmensname:", unternehmensname);
  console.log("Gutschein-Code:", gutscheinCode);
  console.log("Betrag:", betrag);
  console.log("Dienstleistung:", dienstleistung);

  // Validierung
  if (!empfaengerEmail || !unternehmensname || !gutscheinCode) {
    console.log("=== VALIDIERUNG FEHLGESCHLAGEN ===");
    return res.status(400).json({ error: "E-Mail, Unternehmensname und Gutschein-Code sind erforderlich" });
  }

  // E-Mail-Format validieren
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(empfaengerEmail)) {
    console.log("=== UNGÜLTIGE E-MAIL-ADRESSE ===");
    return res.status(400).json({ error: "Ungültige E-Mail-Adresse" });
  }

  try {
    // E-Mail-Text erstellen
    const emailText = dienstleistung 
      ? `Hallo!\n\nVielen Dank für Ihren Einkauf bei ${unternehmensname}!\n\nIhr Gutschein für: ${dienstleistung.shortDesc}\n\nGutschein-Code: ${gutscheinCode}\n\nWir freuen uns auf Ihren Besuch!\n\nViele Grüße\nIhr Team von ${unternehmensname}`
      : `Hallo!\n\nVielen Dank für Ihren Einkauf bei ${unternehmensname}!\n\nIhr Wertgutschein über ${betrag}€\n\nGutschein-Code: ${gutscheinCode}\n\nWir freuen uns auf Ihren Besuch!\n\nViele Grüße\nIhr Team von ${unternehmensname}`;

    console.log("=== E-MAIL WIRD VERSENDET (ohne PDF) ===");
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: empfaengerEmail,
      subject: `Ihr Gutschein von ${unternehmensname}`,
      text: emailText,
      html: `
        <h2>Vielen Dank für Ihren Einkauf!</h2>
        <p>Hallo!</p>
        <p>Vielen Dank für Ihren Einkauf bei <strong>${unternehmensname}</strong>!</p>
        <p>${dienstleistung ? `Ihr Gutschein für: <strong>${dienstleistung.shortDesc}</strong>` : `Ihr Wertgutschein über <strong>${betrag}€</strong>`}</p>
        <p><strong>Gutschein-Code:</strong> ${gutscheinCode}</p>
        <p>Wir freuen uns auf Ihren Besuch!</p>
        <p>Viele Grüße<br>Ihr Team von ${unternehmensname}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log("=== E-MAIL ERFOLGREICH VERSANDT (ohne PDF) ===");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    
    res.status(200).json({ 
      message: "Gutschein-E-Mail erfolgreich versandt (ohne PDF)",
      messageId: info.messageId 
    });

  } catch (err) {
    console.error("=== DETAILLIERTER FEHLER beim Senden der E-Mail ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error response:", err.response);
    console.error("Full error object:", err);
    
    res.status(500).json({ 
      error: "Fehler beim Senden der E-Mail",
      details: err.message,
      code: err.code 
    });
  }
});

module.exports = router;