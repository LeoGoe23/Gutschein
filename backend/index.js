require("dotenv").config();
const express           = require("express");
const mongoose          = require("mongoose");
const gutscheineRoute   = require("./routes/gutscheine");
const zahlungRoute      = require("./routes/zahlung");
const webhookRoute      = require("./routes/webhook");

const app = express();

app.use(express.json());

app.use("/api/gutscheine", gutscheineRoute);
app.use("/api/zahlung",      zahlungRoute);
app.use("/api/webhook",      webhookRoute);

app.get("/", (req, res) => {
  res.send("API läuft 🚀");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB verbunden");
    const port = process.env.PORT || 5001;
    app.listen(port, () =>
      console.log("Server läuft auf Port", port)
    );
  })
  .catch(err => console.error("MongoDB Fehler:", err));