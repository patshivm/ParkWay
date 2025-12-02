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
   DEFAULT STATUS = FREE
===================================================== */
let slots = {
  A1:"FREE", A2:"FREE", A3:"FREE", A4:"FREE", A5:"FREE",
  B1:"FREE", B2:"FREE", B3:"FREE", B4:"FREE", B5:"FREE",
  C1:"FREE", C2:"FREE", C3:"FREE", C4:"FREE", C5:"FREE",
  D1:"FREE", D2:"FREE", D3:"FREE", D4:"FREE", D5:"FREE"
};

const VALID = ["FREE", "RESERVED", "OCCUPIED"];

/* =====================================================
   POST /api/parking/:slotId
===================================================== */
app.post("/api/parking/:slotId", (req, res) => {
  const slotId = req.params.slotId;
  let { status } = req.body;

  if (!slots[slotId]) {
    return res.status(400).json({ error: "Invalid slotId" });
  }

  status = String(status || "").trim().toUpperCase();
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  slots[slotId] = status;
  console.log(`Updated ${slotId} → ${status}`);

  res.json({ ok: true, slot: slotId, status });
});

/* =====================================================
   GET ALL
===================================================== */
app.get("/api/parking", (req, res) => {
  res.json(slots);
});

/* =====================================================
   RESET ALL
===================================================== */
app.get("/api/reset", (req, res) => {
  Object.keys(slots).forEach(k => slots[k] = "FREE");
  console.log("RESET → all slots set to FREE");
  res.json({ ok: true });
});

/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`🚗 Parkway Server running on http://localhost:${PORT}`);
});

