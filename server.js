// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for testing from different origins
app.use(cors());
app.use(bodyParser.json());

// Serve static website pages
app.use(express.static(path.join(__dirname)));

// In-memory parking slot data
// Initialize all slots to EMPTY
let slots = {
  A1:"free", A2:"free", A3:"free", A4:"free", A5:"free",
  B1:"free", B2:"free", B3:"free", B4:"free", B5:"free",
  C1:"free", C2:"free", C3:"free", C4:"free", C5:"free",
  D1:"free", D2:"free", D3:"free", D4:"free", D5:"free"
};

// API endpoint for ESP32 devices to update a slot
app.post("/api/parking", (req, res) => {
  const { slotId, status } = req.body;

  if (!slotId || !status) {
    return res.status(400).json({ error: "slotId and status are required" });
  }

  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: "Invalid slotId" });
  }

  slots[slotId] = status.toUpperCase(); // store as "EMPTY" or "OCCUPIED"
  console.log(`Updated ${slotId} → ${slots[slotId]}`);
  res.json({ message: `Slot ${slotId} updated to ${status}` });
});

// API endpoint to get all slot statuses
app.get("/api/parking", (req, res) => {
  res.json(slots);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
