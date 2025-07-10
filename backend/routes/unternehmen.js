const express = require("express");
const router = express.Router();
const Unternehmen = require("../models/Unternehmen");

router.post("/", async (req, res) => {
  const { uid, email, name } = req.body;
  if (!uid || !email || !name) {
    return res.status(400).json({ error: "uid, email und name sind erforderlich" });
  }

  try {
    const neuesUnternehmen = new Unternehmen({
      firebaseUid: uid,
      email,
      name,
      letzterCode: 0
    });

    const gespeichert = await neuesUnternehmen.save();
    return res.status(201).json(gespeichert);
  } catch (err) {
    console.error("Fehler beim Anlegen des Unternehmens:", err);
    res.status(500).json({ error: "Fehler beim Speichern des Unternehmens" });
  }
});

module.exports = router;
