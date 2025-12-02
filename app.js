const serverURL = "https://parkway-8fji.onrender.com/api/parking";

/* ===== LOCAL BOOKING SAVE/LOAD ===== */
function setMyBooking(slotId) { localStorage.setItem('mySlot', slotId || ''); }
function getMyBooking() { return localStorage.getItem('mySlot') || ''; }

/* ===== MAP PAGE RENDERING ===== */
async function renderMap() {
  try {
    const res = await fetch(serverURL);
    if (!res.ok) throw new Error("Failed to fetch slot data");
    const slots = await res.json(); // expects {A1:"FREE",B2:"OCCUPIED",...}

    Object.keys(slots).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const status = slots[id].toUpperCase(); // normalize to uppercase
      el.className = `slot ${status.toLowerCase()}`;
      el.innerHTML = `<span>${id}</span><span class="slot-id">${status}</span>`;
      el.onclick = () => onSlotClick(id, status);
    });
  } catch (e) {
    console.error("Error fetching slot data:", e);
  }
}

let selectedSlot = null;
let action = null;

function onSlotClick(id, status) {
  if (status === 'OCCUPIED') return; // cannot click occupied
  selectedSlot = id;
  action = status === 'FREE' ? 'reserve' : 'release';

  const modalSlot = document.getElementById('modalSlot');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');

  if (modalSlot) modalSlot.textContent = id;
  if (modalTitle) modalTitle.textContent = action === 'reserve' ? 'Reserve Slot' : 'Release Slot';
  if (modalText) modalText.innerHTML = action === 'reserve'
    ? `Confirm reservation for <strong>${id}</strong>?`
    : `Release reservation for <strong>${id}</strong>?`;

  showModal();
}

function showModal() { const m = document.getElementById('modal'); if (m) m.classList.remove('hidden'); }
function hideModal() { const m = document.getElementById('modal'); if (m) m.classList.add('hidden'); }
function attachModalHandlers() {
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const modal = document.getElementById('modal');

  if (cancelBtn) cancelBtn.onclick = hideModal;
  if (confirmBtn) confirmBtn.onclick = async () => {
    if (!selectedSlot) return;
    const newStatus = action === 'reserve' ? 'RESERVED' : 'FREE';
    try {
      await fetch(`${serverURL}/${selectedSlot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setMyBooking(newStatus === 'RESERVED' ? selectedSlot : '');
      hideModal();
      renderMap(); // refresh immediately
    } catch (e) {
      console.error("Failed to update slot status:", e);
    }
  };
  if (modal) modal.addEventListener('click', e => { if (e.target.id === 'modal') hideModal(); });
}

/* ===== BOOKING PAGE ===== */
async function renderBooking() {
  const info = document.getElementById('bookingInfo');
  const my = getMyBooking();
  if (info) info.textContent = my ? `Active booking: ${my} (RESERVED)` : 'No active booking.';

  const releaseBtn = document.getElementById('releaseBtn');
  if (releaseBtn) releaseBtn.onclick = async () => {
    const id = getMyBooking();
    if (!id) return;
    try {
      await fetch(`${serverURL}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FREE' })
      });
      setMyBooking('');
      if (info) info.textContent = 'No active booking.';
      renderMap(); // refresh map if visible
    } catch (e) {
      console.error("Failed to release booking:", e);
    }
  };
}

/* ===== DASHBOARD PAGE ===== */
async function renderStats() {
  try {
    const res = await fetch(serverURL);
    if (!res.ok) throw new Error("Failed to fetch slot data");
    const slots = await res.json();
    const vals = Object.values(slots || {}).map(s => s.toUpperCase());
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
    console.error("Error fetching stats:", e);
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

/* ===== INIT ===== */
(function init() {
  const page = window.PAGE || 'HOME';
  if (page === 'MAP') {
    renderMap();
    attachModalHandlers();
    setInterval(renderMap, 2000); // live update every 2 sec
  }
  if (page === 'BOOKING') {
    renderBooking();
  }
  if (page === 'DASHBOARD') {
    renderStats();
    setInterval(renderStats, 2000); // live update
  }
})();
