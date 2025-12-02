const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// In-memory parking slot data
let slots = {
  A1:"FREE", A2:"FREE", A3:"FREE", A4:"FREE", A5:"FREE",
  B1:"FREE", B2:"FREE", B3:"FREE", B4:"FREE", B5:"FREE",
  C1:"FREE", C2:"FREE", C3:"FREE", C4:"FREE", C5:"FREE",
  D1:"FREE", D2:"FREE", D3:"FREE", D4:"FREE", D5:"FREE"
};

// GET all slots
app.get("/api/parking", (req, res) => {
  res.json(slots);
});

// POST update a specific slot by ID
app.post("/api/parking/:slotId", (req, res) => {
  const { slotId } = req.params;
  const { status } = req.body;

  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: "Invalid slotId" });
  }
  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const validStatuses = ["FREE", "RESERVED", "OCCUPIED"];
  const newStatus = status.toUpperCase();
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  slots[slotId] = newStatus;
  console.log(`Updated ${slotId} → ${newStatus}`);
  res.json({ message: `Slot ${slotId} updated to ${newStatus}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
