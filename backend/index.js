require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const gutscheineRoute = require("./routes/gutscheine");
const zahlungRoute = require("./routes/zahlung");
const webhookRoute = require("./routes/webhook");
const bodyParser = require("body-parser");

console.log("Router geladen:", typeof gutscheineRoute);

const app = express();

app.use("/api/webhook", webhookRoute);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API läuft");
});

app.use("/api/gutscheine", gutscheineRoute);
app.use("/api/zahlung", zahlungRoute);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB verbunden");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server läuft auf Port", process.env.PORT || 5000);
    });
  })
  .catch((err) => console.error("MongoDB Fehler:", err));
