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
// In-memory parking slot data
// -----------------------------
let slots = {
  A1:"EMPTY", A2:"EMPTY", A3:"EMPTY", A4:"EMPTY", A5:"EMPTY", A6:"EMPTY", A7:"EMPTY", A8:"EMPTY", A9:"EMPTY", A10:"EMPTY", A11:"EMPTY", A12:"EMPTY", A13:"EMPTY", A14:"EMPTY",
  B1:"EMPTY", B2:"EMPTY", B3:"EMPTY", B4:"EMPTY", B5:"EMPTY", B6:"EMPTY", B7:"EMPTY", B8:"EMPTY", B9:"EMPTY", B10:"EMPTY", B11:"EMPTY", B12:"EMPTY", B13:"EMPTY", B14:"EMPTY",
  C1:"EMPTY", C2:"EMPTY", C3:"EMPTY", C4:"EMPTY", C5:"EMPTY", C6:"EMPTY", C7:"EMPTY", C8:"EMPTY", C9:"EMPTY", C10:"EMPTY", C11:"EMPTY", C12:"EMPTY", C13:"EMPTY", C14:"EMPTY",
  D1:"EMPTY", D2:"EMPTY", D3:"EMPTY", D4:"EMPTY", D5:"EMPTY", D6:"EMPTY", D7:"EMPTY", D8:"EMPTY", D9:"EMPTY", D10:"EMPTY", D11:"EMPTY", D12:"EMPTY", D13:"EMPTY", D14:"EMPTY"
};

// Track reservation expiry timestamps (ms since epoch)
const reservations = {}; // { slotId: expiryTimeMs }

const VALID_STATES = ["EMPTY", "OCCUPIED", "RESERVED"];

// Normalize incoming status strings
function normalizeStatus(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === "FREE") return "EMPTY";  // treat FREE as EMPTY
  if (VALID_STATES.includes(s)) return s;
  return null;
}

// Clear expired reservations before answering any GET
function expireReservations() {
  const now = Date.now();
  for (const id of Object.keys(reservations)) {
    if (reservations[id] <= now) {
      // Only clear if slot is still RESERVED
      if (slots[id] === "RESERVED") {
        slots[id] = "EMPTY";
        console.log(`⏰ Reservation expired for ${id} → EMPTY`);
      }
      delete reservations[id];
    }
  }
}

// Helper to apply a new status with optional reservation
function setSlotStatus(slotId, status, durationMinutes) {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    throw new Error("Invalid status value");
  }

  // If RESERVED: set reservation timer (default 20 min)
  if (normalized === "RESERVED") {
    const mins = durationMinutes && Number(durationMinutes) > 0
      ? Number(durationMinutes)
      : 20;
    const expiry = Date.now() + mins * 60 * 1000;
    reservations[slotId] = expiry;
    slots[slotId] = "RESERVED";
    console.log(`🔒 Slot ${slotId} RESERVED for ${mins} min (until ${new Date(expiry).toLocaleTimeString()})`);
    return;
  }

  // If sensor says EMPTY but we still have active reservation → ignore
  if (normalized === "EMPTY" && reservations[slotId]) {
    console.log(`ℹ Ignoring EMPTY from sensor for ${slotId} (still reserved)`);
    return;
  }

  // For OCCUPIED or explicit EMPTY (and no reservation)
  slots[slotId] = normalized;

  // If status is not RESERVED, clear any reservation entry
  if (normalized !== "RESERVED" && reservations[slotId]) {
    delete reservations[slotId];
  }

  console.log(`✅ Slot ${slotId} → ${normalized}`);
}

// -----------------------------
// ESP32 + generic update endpoint
// POST /api/parking   with { slotId, status, durationMinutes? }
// -----------------------------
app.post("/api/parking", (req, res) => {
  const { slotId, status, durationMinutes } = req.body;

  if (!slotId || !status) {
    return res.status(400).json({ error: "slotId and status are required" });
  }
  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: "Invalid slotId" });
  }

  try {
    setSlotStatus(slotId, status, durationMinutes);
    return res.json({ ok: true, slotId, status: slots[slotId] });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// Website-friendly endpoint
// POST /api/parking/:slotId  with { status, durationMinutes? }
// Use this from your frontend when user reserves/cancels
// -----------------------------
app.post("/api/parking/:slotId", (req, res) => {
  const slotId = req.params.slotId;
  const { status, durationMinutes } = req.body;

  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: "Invalid slotId" });
  }
  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    setSlotStatus(slotId, status, durationMinutes);
    return res.json({ ok: true, slotId, status: slots[slotId] });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// GET all slot statuses
// ESP32 + website both can use this
// -----------------------------
app.get("/api/parking", (req, res) => {
  expireReservations();
  res.json(slots);
});

// Optional: GET one slot
app.get("/api/parking/:slotId", (req, res) => {
  expireReservations();
  const id = req.params.slotId;
  if (!slots.hasOwnProperty(id)) {
    return res.status(400).json({ error: "Invalid slotId" });
  }
  res.json({ slotId: id, status: slots[id], reservedUntil: reservations[id] || null });
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
