const mongoose = require("mongoose");

const GutscheinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  betrag: { type: Number, required: true },
  empfaengerEmail: { type: String, required: true },
  erstelltAm:      { type: Date,   default: Date.now },
  eingelöst:       { type: Boolean, default: false     },
  stripeSessionId: { type: String, required: false, unique: true } // NEU!
});

module.exports = mongoose.model("Gutschein", GutscheinSchema);