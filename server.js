const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve HTML, JS, CSS

// Initialize slot statuses
let slots = {
  A1: "EMPTY",
  A2: "EMPTY",
  A3: "EMPTY",
  A4: "EMPTY",
  B1: "EMPTY",
  B2: "EMPTY",
  B3: "EMPTY",
  B4: "EMPTY"
  // Add more slots if needed
};

// Endpoint for ESP32 POST updates
app.post('/api/parking', (req, res) => {
  const { slotId, status } = req.body;
  if (!slotId || !slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: 'Invalid or missing slotId' });
  }
  slots[slotId] = status.toUpperCase();
  res.json({ ok: true });
});

// Endpoint for frontend GET request
app.get('/api/parking', (req, res) => {
  res.json(slots);
});

// Start server
app.listen(PORT, () => console.log(`ParkWay server running on port ${PORT}`));