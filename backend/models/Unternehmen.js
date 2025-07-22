const mongoose = require("mongoose");

const unternehmenSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true },
  email: String,
  name: String,
  letzterCode: { type: Number, default: 0 },
  mollieAccountId: String,
  mollieAccessToken: String,
  mollieRefreshToken: String
});

module.exports = mongoose.model("Unternehmen", unternehmenSchema);
