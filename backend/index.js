const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Gutschein API läuft'));
app.listen(5000, () => console.log('Server läuft auf Port 5000'));
