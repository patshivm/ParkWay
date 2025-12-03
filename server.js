// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// -----------------------------
// 20-SLOT REAL PARKING LOT
// -----------------------------
let slots = {
  A1:"EMPTY", A2:"EMPTY", A3:"EMPTY", A4:"EMPTY", A5:"EMPTY",
  B1:"EMPTY", B2:"EMPTY", B3:"EMPTY", B4:"EMPTY", B5:"EMPTY",
  C1:"EMPTY", C2:"EMPTY", C3:"EMPTY", C4:"EMPTY", C5:"EMPTY",
  D1:"EMPTY", D2:"EMPTY", D3:"EMPTY", D4:"EMPTY", D5:"EMPTY"
};

// Reservation expiry table
const reservations = {};

const VALID_STATES = ["EMPTY", "OCCUPIED", "RESERVED"];

// Convert FREE → EMPTY
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (s === "FREE") return "EMPTY";
  if (VALID_STATES.includes(s)) return s;
  return "EMPTY";
}

function expireReservations() {
  const now = Date.now();
  for (const id in reservations) {
    if (reservations[id] <= now) {
      if (slots[id] === "RESERVED") {
        slots[id] = "EMPTY";
        console.log(`⏰ Reservation expired for ${id}`);
      }
      delete reservations[id];
    }
  }
}

// Apply slot change (sensor or website)
function setSlotStatus(slotId, status, durationMinutes) {
  const normalized = normalizeStatus(status);

  // website setting RESERVED
  if (normalized === "RESERVED") {
    const mins = durationMinutes ? Number(durationMinutes) : 20;
    const expiry = Date.now() + mins * 60000;
    reservations[slotId] = expiry;
    slots[slotId] = "RESERVED";
    console.log(`🔒 Slot ${slotId} RESERVED for ${mins} minutes`);
    return;
  }

  // Sensor sending EMPTY but reservation still active → ignore
  if (normalized === "EMPTY" && reservations[slotId]) {
    console.log(`Ignoring EMPTY for ${slotId} (reserved)`);
    return;
  }

  // Otherwise normal update
  slots[slotId] = normalized;

  // If not RESERVED, clear timer
  if (normalized !== "RESERVED") {
    delete reservations[slotId];
  }

  console.log(`Slot ${slotId} → ${normalized}`);
}

// ESP32 & Website POST
app.post("/api/parking", (req, res) => {
  const { slotId, status, durationMinutes } = req.body;
  if (!slotId || !status) return res.status(400).json({ error:"slotId & status required" });
  if (!slots[slotId]) return res.status(400).json({ error:"Invalid slotId" });

  setSlotStatus(slotId, status, durationMinutes);
  res.json({ ok:true, slotId, status:slots[slotId] });
});

// Website POST /api/parking/D3
app.post("/api/parking/:slotId", (req, res) => {
  const slotId = req.params.slotId;
  const { status, durationMinutes } = req.body;
  if (!slots[slotId]) return res.status(400).json({ error:"Invalid slotId" });

  setSlotStatus(slotId, status, durationMinutes);
  res.json({ ok:true, slotId, status:slots[slotId] });
});

// GET all slots
app.get("/api/parking", (req,res)=>{
  expireReservations();
  res.json(slots);
});

// GET one slot
app.get("/api/parking/:slotId", (req,res)=>{
  expireReservations();
  const id = req.params.slotId;
  if (!slots[id]) return res.status(400).json({ error:"Invalid slotId" });
  res.json({ slotId:id, status:slots[id], reservedUntil:reservations[id] || null });
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
