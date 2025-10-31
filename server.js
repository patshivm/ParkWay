const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

const spots = {};
let clients = [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// SSE endpoint
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const clientId = Date.now();
  clients.push({ id: clientId, res });

  // Send existing spots
  const flatSpots = Object.values(spots).map(s => ({
    ...s,
    location: s.location || { x: 50, y: 50 } // default location
  }));

  res.write(`event: init\ndata: ${JSON.stringify(flatSpots)}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => c.res.write(payload));
}

// ESP32 POST endpoint
app.post('/api/parking', (req, res) => {
  const { spot_id, distance, status, ts, location } = req.body;
  const id = spot_id || '1';
  spots[id] = { distance, status, ts: ts || Date.now(), location, occupied: status === 'OCCUPIED', id };
  broadcast('update', spots[id]);
  res.json({ ok:true, spot_id:id });
});

app.listen(PORT, () => console.log(`ParkWay server running at http://localhost:${PORT}`));