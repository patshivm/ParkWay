// app.js - unified frontend logic for MAP, BOOKING, DASHBOARD
/* ===== CONFIG ===== */
const API_URL = "https://parkway-8fji.onrender.com/api/parking"; // change if needed
const AUTH_TOKEN = ""; // optional: set if your server requires a token
const POLL_INTERVAL = 2000; // ms

/* ===== LOCAL BOOKING SAVE/LOAD ===== */
function setMyBooking(slotId) { localStorage.setItem('mySlot', slotId || ''); }
function getMyBooking() { return localStorage.getItem('mySlot') || ''; }

/* ===== UI HELPERS ===== */
function setSlotUI(slotEl, status) {
  if (!slotEl) return;
  slotEl.classList.remove("free", "reserved", "occupied");
  const s = String(status || "").toUpperCase();
  if (s === "FREE") slotEl.classList.add("free");
  else if (s === "RESERVED") slotEl.classList.add("reserved");
  else if (s === "OCCUPIED") slotEl.classList.add("occupied");

  // status label inside slot
  let statusEl = slotEl.querySelector(".slot-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.className = "slot-status";
    statusEl.style.position = "absolute";
    statusEl.style.left = "6px";
    statusEl.style.top = "6px";
    statusEl.style.fontSize = "11px";
    statusEl.style.fontWeight = "700";
    statusEl.style.padding = "2px 6px";
    statusEl.style.borderRadius = "6px";
    statusEl.style.pointerEvents = "none";
    slotEl.appendChild(statusEl);
  }

  if (s === "FREE") {
    statusEl.textContent = "";
    statusEl.style.background = "transparent";
    statusEl.style.color = "#fff";
  } else if (s === "RESERVED") {
    statusEl.textContent = "RESERVED";
    statusEl.style.background = "var(--reserved, #ffd056)";
    statusEl.style.color = "#07121a";
  } else if (s === "OCCUPIED") {
    statusEl.textContent = "OCCUPIED";
    statusEl.style.background = "var(--occupied, #ff5252)";
    statusEl.style.color = "#07121a";
  } else {
    statusEl.textContent = "";
    statusEl.style.background = "transparent";
  }
}

/* ===== NORMALIZE ===== */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (s === "EMPTY") return "FREE";
  if (s === "FREE" || s === "RESERVED" || s === "OCCUPIED") return s;
  return "FREE";
}

/* ===== MAP: fetch & render ===== */
async function renderMap() {
  try {
    console.log("[renderMap] fetching", API_URL);
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) {
      console.warn("[renderMap] GET failed", res.status, res.statusText);
      return;
    }
    const slots = await res.json();
    console.log("[renderMap] received", slots);

    const myLocal = getMyBooking();

    Object.keys(slots).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const normalized = normalizeStatus(slots[id]);
      // If user has locally reserved this slot, keep it reserved until server shows otherwise
      if (myLocal && myLocal === id && normalized !== "RESERVED") {
        // keep optimistic reserved look
        setSlotUI(el, "RESERVED");
      } else {
        setSlotUI(el, normalized);
      }

      // attach click handler for immediate reservation (optimistic)
      if (!el._clickAttached) {
        el._clickAttached = true;
        el.addEventListener("click", () => onSlotClickImmediate(id));
      }
    });

    // highlight user's reserved slot on map (if any)
    if (myLocal) {
      const myEl = document.getElementById(myLocal);
      if (myEl) {
        myEl.style.outline = "3px solid rgba(99,197,255,0.18)";
        myEl.style.outlineOffset = "4px";
      }
    }
  } catch (e) {
    console.error("[renderMap] error:", e);
  }
}

/* ===== IMMEDIATE RESERVE CLICK HANDLER ===== */
async function onSlotClickImmediate(slotId) {
  const slotEl = document.getElementById(slotId);
  if (!slotEl) return;

  // ignore if occupied or already reserved in UI
  if (slotEl.classList.contains("occupied") || slotEl.classList.contains("reserved")) {
    console.log("[onSlotClickImmediate] ignored click, already occupied/reserved:", slotId);
    return;
  }

  // optimistic UI: mark reserved immediately
  console.log("[onSlotClickImmediate] optimistic reserve", slotId);
  setSlotUI(slotEl, "RESERVED");
  setMyBooking(slotId);

  // prepare payload
  const body = { status: "RESERVED" };
  if (AUTH_TOKEN) body.token = AUTH_TOKEN;

  try {
    console.log("[onSlotClickImmediate] POST", `${API_URL}/${slotId}`, body);
    const res = await fetch(`${API_URL}/${slotId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log("[onSlotClickImmediate] POST response", res.status, text);

    if (!res.ok) {
      // revert UI on failure
      console.error("[onSlotClickImmediate] Reserve failed:", res.status, text);
      setSlotUI(slotEl, "FREE");
      setMyBooking('');
      alert("Failed to reserve slot. Please try again.");
      return;
    }

    // success: re-fetch to sync authoritative state
    setTimeout(() => {
      renderMap();
    }, 300);
  } catch (err) {
    console.error("[onSlotClickImmediate] Network error while reserving:", err);
    setSlotUI(slotEl, "FREE");
    setMyBooking('');
    alert("Network error. Try again.");
  }
}

/* ===== BOOKING PAGE ===== */
async function renderBooking() {
  const info = document.getElementById('bookingInfo');
  const releaseBtn = document.getElementById('releaseBtn');
  const mySlot = getMyBooking();

  if (releaseBtn) {
    releaseBtn.disabled = false;
    releaseBtn.style.display = 'none';
  }

  if (!mySlot) {
    if (info) info.textContent = 'No active booking.';
    return;
  }

  if (info) info.textContent = `Active booking: ${mySlot} (checking...)`;
  if (releaseBtn) releaseBtn.style.display = 'inline-block';

  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch slot data');
    const slots = await res.json();
    const serverStatus = String(slots[mySlot] || '').toUpperCase();

    if (serverStatus === 'RESERVED') {
      if (info) info.textContent = `Active booking: ${mySlot} (RESERVED)`;
    } else {
      // server no longer reserved -> clear local booking
      setMyBooking('');
      if (info) info.textContent = 'No active booking.';
      if (releaseBtn) releaseBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('[renderBooking] error:', err);
    if (info) info.textContent = `Active booking: ${mySlot} (offline)`;
  }

  // attach release handler once
  if (releaseBtn && !releaseBtn._attached) {
    releaseBtn._attached = true;
    releaseBtn.addEventListener('click', async () => {
      const id = getMyBooking();
      if (!id) return;
      releaseBtn.disabled = true;
      releaseBtn.textContent = 'Releasing...';
      try {
        const body = { status: 'FREE' };
        if (AUTH_TOKEN) body.token = AUTH_TOKEN;
        console.log('[renderBooking] releasing', id);
        const resp = await fetch(`${API_URL}/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const txt = await resp.text();
        console.log('[renderBooking] release response', resp.status, txt);
        if (!resp.ok) throw new Error('Release failed');
        setMyBooking('');
        if (info) info.textContent = 'No active booking.';
        releaseBtn.style.display = 'none';
        // refresh map to reflect change
        renderMap();
      } catch (e) {
        console.error('[renderBooking] Failed to release booking:', e);
        alert('Failed to release booking. Try again.');
      } finally {
        releaseBtn.disabled = false;
        releaseBtn.textContent = 'Release My Slot';
      }
    });
  }
}

/* ===== DASHBOARD ===== */
async function renderStats() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch slot data");
    const slots = await res.json();
    const vals = Object.values(slots || {}).map(s => String(s || "").toUpperCase().replace("EMPTY", "FREE"));
    const total = vals.length;
    const free = vals.filter(s => s === 'FREE').length;
    const reserved = vals.filter(s => s === 'RESERVED').length;
    const occupied = vals.filter(s => s === 'OCCUPIED').length;

    const el = id => document.getElementById(id);
    if (el('statTotal')) el('statTotal').textContent = total;
    if (el('statFree')) el('statFree').textContent = free;
    if (el('statReserved')) el('statReserved').textContent = reserved;
    if (el('statOccupied')) el('statOccupied').textContent = occupied;

    drawChart(free, reserved, occupied);
  } catch (e) {
    console.error("[renderStats] error:", e);
  }
}

function drawChart(free, reserved, occupied) {
  const c = document.getElementById('usageChart');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  const data = [free, reserved, occupied];
  const labels = ['Free', 'Reserved', 'Occupied'];
  const colors = ['#24ff6d', '#ffd056', '#ff5252'];
  const max = Math.max(1, ...data);
  let x = 120, yBase = c.height - 40;
  const barW = 120, gap = 80;
  ctx.font = '16px Poppins';

  labels.forEach((lab, i) => {
    const h = (data[i] / max) * (c.height - 100);
    ctx.fillStyle = colors[i];
    ctx.shadowColor = colors[i];
    ctx.shadowBlur = 18;
    ctx.fillRect(x, yBase - h, barW, h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eef6ff';
    ctx.textAlign = 'center';
    ctx.fillText(String(data[i]), x + barW / 2, yBase - h - 8);
    ctx.fillStyle = '#9fb0c3';
    ctx.fillText(lab, x + barW / 2, yBase + 24);
    x += barW + gap;
  });
}

/* ===== INIT (wait for DOM so window.PAGE is set in HTML) ===== */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.PAGE || 'HOME';

  if (page === 'MAP') {
    renderMap();
    // poll map
    setInterval(renderMap, POLL_INTERVAL);
  }

  if (page === 'BOOKING') {
    renderBooking();
    setInterval(renderBooking, POLL_INTERVAL);
  }

  if (page === 'DASHBOARD') {
    renderStats();
    setInterval(renderStats, POLL_INTERVAL);
  }
});


