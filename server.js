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

/* =====================================================
   EXACT 20 SLOTS (A1–A5, B1–B5, C1–C5, D1–D5)
   DEFAULT STATUS = "free"
===================================================== */
let slots = {
  A1:"free", A2:"free", A3:"free", A4:"free", A5:"free",
  B1:"free", B2:"free", B3:"free", B4:"free", B5:"free",
  C1:"free", C2:"free", C3:"free", C4:"free", C5:"free",
  D1:"free", D2:"free", D3:"free", D4:"free", D5:"free"
};

// Allowed status values
const allowedStatuses = ["free", "reserved", "occupied"];


/* =====================================================
   UPDATE SLOT STATUS VIA POST  
   BODY: { slotId: "A3", status: "reserved" }
===================================================== */
app.post("/api/parking", (req, res) => {
  const { slotId, status } = req.body;

  if (!slotId || !status) {
    return res.status(400).json({ error: "slotId and status required" });
  }

  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: `Invalid slotId: ${slotId}` });
  }

  const norm = status.toLowerCase();
  if (!allowedStatuses.includes(norm)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  slots[slotId] = norm;
  console.log(`Updated → ${slotId} = ${norm}`);
  res.json({ ok: true, slot: slotId, status: norm });
});


/* =====================================================
   UPDATE INDIVIDUAL SLOT (EX: /api/parking/A4)
===================================================== */
app.post("/api/parking/:slotId", (req, res) => {
  const { slotId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "status required" });
  if (!slots.hasOwnProperty(slotId)) {
    return res.status(400).json({ error: `Invalid slotId: ${slotId}` });
  }

  const norm = status.toLowerCase();
  if (!allowedStatuses.includes(norm)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  slots[slotId] = norm;

  console.log(`Updated → ${slotId} = ${norm}`);
  res.json({ ok: true, slot: slotId, status: norm });
});


/* =====================================================
   GET ALL SLOT STATUS
===================================================== */
app.get("/api/parking", (req, res) => {
  res.json(slots);
});


/* =====================================================
   RESET ALL SLOTS TO FREE
===================================================== */
app.get("/api/reset", (req, res) => {
  Object.keys(slots).forEach(k => slots[k] = "free");
  console.log("RESET → All 20 slots set to FREE");
  res.json({ ok: true, message: "All slots reset to free" });
});


/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`🚗 Parkway Server Running on http://localhost:${PORT}`);
});
