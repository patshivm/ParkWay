/* ===== CONFIG ===== */
const API_URL = "https://parkway-8fji.onrender.com/api/parking";
const POLL_INTERVAL = 2000;

/* ===== LOCAL BOOKING SAVE/LOAD ===== */
function setMyBooking(s) { localStorage.setItem("mySlot", s || ""); }
function getMyBooking() { return localStorage.getItem("mySlot") || ""; }

/* ===== NORMALIZE ===== */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (["FREE", "RESERVED", "OCCUPIED"].includes(s)) return s;
  return "FREE";
}

/* ===== SET UI COLORS ===== */
function setSlotUI(slotEl, status) {
  if (!slotEl) return;

  slotEl.classList.remove("free", "reserved", "occupied");

  const s = normalizeStatus(status);

  if (s === "FREE") slotEl.classList.add("free");
  if (s === "RESERVED") slotEl.classList.add("reserved");
  if (s === "OCCUPIED") slotEl.classList.add("occupied");

  // Add label top-left
  let label = slotEl.querySelector(".slot-status");
  if (!label) {
    label = document.createElement("div");
    label.className = "slot-status";
    label.style.position = "absolute";
    label.style.left = "6px";
    label.style.top = "6px";
    label.style.fontWeight = "700";
    slotEl.appendChild(label);
  }

  label.textContent = (s === "FREE") ? "" : s;
}

/* ===== MAP PAGE ===== */
async function renderMap() {
  try {
    const res = await fetch(API_URL, { cache:"no-store" });
    if (!res.ok) return;

    const slots = await res.json();
    const my = getMyBooking();

    Object.keys(slots).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      let status = normalizeStatus(slots[id]);

      if (my === id && status !== "RESERVED")
        status = "RESERVED";

      setSlotUI(el, status);

      if (!el._attached) {
        el._attached = true;
        el.addEventListener("click", () => onSlotClick(id));
      }
    });
  } catch (e) { console.error(e); }
}

/* ===== RESERVE IMMEDIATELY ===== */
async function onSlotClick(slotId) {
  const el = document.getElementById(slotId);
  if (!el) return;

  if (el.classList.contains("occupied") || el.classList.contains("reserved"))
    return;

  setSlotUI(el, "RESERVED");
  setMyBooking(slotId);

  const res = await fetch(`${API_URL}/${slotId}`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ status:"RESERVED" })
  });

  if (!res.ok) {
    setSlotUI(el, "FREE");
    setMyBooking("");
    alert("Reservation failed");
  }
}

/* ===== BOOKING PAGE ===== */
async function renderBooking() {
  const info = document.getElementById("bookingInfo");
  const btn = document.getElementById("releaseBtn");
  const my = getMyBooking();

  if (!my) {
    info.textContent = "No active booking.";
    btn.style.display = "none";
    return;
  }

  btn.style.display = "inline-block";
  info.textContent = `Active booking: ${my} (checking...)`;

  const res = await fetch(API_URL, { cache:"no-store" });
  const slots = await res.json();

  const s = normalizeStatus(slots[my]);

  if (s === "RESERVED") {
    info.textContent = `Active booking: ${my} (RESERVED)`;
  } else {
    setMyBooking("");
    info.textContent = "No active booking.";
    btn.style.display = "none";
  }

  btn.onclick = async () => {
    await fetch(`${API_URL}/${my}`, {
      method: "POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ status:"FREE" })
    });
    setMyBooking("");
    info.textContent = "No active booking.";
    btn.style.display = "none";
    renderMap();
  };
}

/* ===== DASHBOARD ===== */
async function renderStats() {
  const res = await fetch(API_URL, { cache:"no-store" });
  if (!res.ok) return;

  const slots = await res.json();
  const vals = Object.values(slots).map(normalizeStatus);

  const total = vals.length;
  const free = vals.filter(s => s === "FREE").length;
  const reserved = vals.filter(s => s === "RESERVED").length;
  const occupied = vals.filter(s => s === "OCCUPIED").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statFree").textContent = free;
  document.getElementById("statReserved").textContent = reserved;
  document.getElementById("statOccupied").textContent = occupied;
}

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  const p = window.PAGE;

  if (p === "MAP") {
    renderMap();
    setInterval(renderMap, POLL_INTERVAL);
  }

  if (p === "BOOKING") {
    renderBooking();
    setInterval(renderBooking, POLL_INTERVAL);
  }

  if (p === "DASHBOARD") {
    renderStats();
    setInterval(renderStats, POLL_INTERVAL);
  }
});



