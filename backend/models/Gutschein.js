const mongoose = require("mongoose");

const GutscheinSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  betrag: { type: Number, required: true },
  empfängerEmail: { type: String, required: true },
  erstelltAm: { type: Date, default: Date.now },
  eingelöst: { type: Boolean, default: false },
});

module.exports = mongoose.model("Gutschein", GutscheinSchema);
