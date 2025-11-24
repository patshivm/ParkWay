const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // serve index.html, map.html, booking.html, dashboard.html, app.js, style.css

// Data structure for parking slots
let slots = {
  A1: { status: 'free', distance: 0 },
  A2: { status: 'free', distance: 0 },
  A3: { status: 'free', distance: 0 },
  A4: { status: 'free', distance: 0 },
  B1: { status: 'free', distance: 0 },
  B2: { status: 'free', distance: 0 },
  B3: { status: 'free', distance: 0 },
  B4: { status: 'free', distance: 0 },
  C1: { status: 'free', distance: 0 },
  C2: { status: 'free', distance: 0 },
  C3: { status: 'free', distance: 0 },
  C4: { status: 'free', distance: 0 },
  D1: { status: 'free', distance: 0 },
  D2: { status: 'free', distance: 0 },
  D3: { status: 'free', distance: 0 },
  D4: { status: 'free', distance: 0 }
};

// API endpoint to get all slot statuses
app.get('/api/parking', (req, res) => {
  res.json(Object.fromEntries(Object.entries(slots).map(([k,v]) => [k, v.status])));
});

// API endpoint to update a single slot
app.post('/api/parking/:id', (req, res) => {
  const id = req.params.id;
  const { status, distance } = req.body;
  if (!slots[id]) return res.status(400).json({ error: 'Invalid slot id' });

  slots[id].status = status || slots[id].status;
  slots[id].distance = distance !== undefined ? distance : slots[id].distance;

  res.json({ ok: true, slot: { id, status: slots[id].status, distance: slots[id].distance } });
});

// Start server
app.listen(PORT, () => {
  console.log(`ParkWay server running on port ${PORT}`);
});