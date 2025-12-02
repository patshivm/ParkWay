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
  A1:"EMPTY", A2:"EMPTY", A3:"EMPTY", A4:"EMPTY", A5:"EMPTY", A6:"EMPTY", A7:"EMPTY", A8:"EMPTY", A9:"EMPTY", A10:"EMPTY", A11:"EMPTY", A12:"EMPTY", A13:"EMPTY", A14:"EMPTY",
  B1:"EMPTY", B2:"EMPTY", B3:"EMPTY", B4:"EMPTY", B5:"EMPTY", B6:"EMPTY", B7:"EMPTY", B8:"EMPTY", B9:"EMPTY", B10:"EMPTY", B11:"EMPTY", B12:"EMPTY", B13:"EMPTY", B14:"EMPTY",
  C1:"EMPTY", C2:"EMPTY", C3:"EMPTY", C4:"EMPTY", C5:"EMPTY", C6:"EMPTY", C7:"EMPTY", C8:"EMPTY", C9:"EMPTY", C10:"EMPTY", C11:"EMPTY", C12:"EMPTY", C13:"EMPTY", C14:"EMPTY",
  D1:"EMPTY", D2:"EMPTY", D3:"EMPTY", D4:"EMPTY", D5:"EMPTY", D6:"EMPTY", D7:"EMPTY", D8:"EMPTY", D9:"EMPTY", D10:"EMPTY", D11:"EMPTY", D12:"EMPTY", D13:"EMPTY", D14:"EMPTY"
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
