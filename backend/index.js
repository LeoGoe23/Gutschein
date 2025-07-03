require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const gutscheineRoute = require("./routes/gutscheine");

console.log("Router geladen:", typeof gutscheineRoute);

const app = express();
app.use(express.json());

app.use("/api/gutscheine", gutscheineRoute);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB verbunden");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server läuft auf Port", process.env.PORT || 5000);
    });
  })
  .catch((err) => console.error("MongoDB Fehler:", err));
