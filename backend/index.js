require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const gutscheineRoute  = require("./routes/gutscheine");
const zahlungRoute     = require("./routes/zahlung");
const webhookRoute     = require("./routes/webhook");
const unternehmenRoute = require("./routes/unternehmen");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/gutscheine", gutscheineRoute);
app.use("/api/zahlung", zahlungRoute);
app.use("/api/webhook", webhookRoute);
app.use("/api/unternehmen", unternehmenRoute);

app.get("/", (req, res) => res.send("API läuft"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB verbunden");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server läuft auf Port", process.env.PORT || 5000);
    });
  })
  .catch(err => console.error("MongoDB Fehler:", err));