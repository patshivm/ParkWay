const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // serve index.html, app.js, style.css from root

// Data structures
let spots = {};
const NUM_SPOTS = 10;
let clients = [];

// Initialize 10 spots
for (let i = 1; i <= NUM_SPOTS; i++) {
  spots[i] = {
    id: i.toString(),
    distance: 0,
    status: i === 1 ? 'EMPTY' : 'FAILURE', // Spot 1 is sensor active
    occupied: false
  };
}

// SSE endpoint for dashboard
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  // Send initial state
  Object.values(spots).forEach(s => {
    res.write(`event: update\ndata: ${JSON.stringify(s)}\n\n`);
  });

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Broadcast helper
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.res.write(payload));
}

// API endpoint for ESP32
app.post('/api/parking', (req, res) => {
  const { spot_id, distance, status } = req.body;
  const id = spot_id || '1';
  if (!spots[id]) return res.status(400).json({ error: 'Invalid spot id' });

  spots[id] = {
    id,
    distance: distance || 0,
    status: status || 'EMPTY',
    occupied: status === 'OCCUPIED'
  };

  broadcast('update', spots[id]);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`ParkWay server running on port ${PORT}`);
});