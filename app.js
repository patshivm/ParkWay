/* ========== FIREBASE CONFIG ========== */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ========== DEFAULT SLOTS (ONLY SET IF EMPTY) ========== */
const defaultSlots = {
  A1:'free',A2:'free',A3:'free',A4:'free',
  B1:'free',B2:'free',B3:'free',B4:'free',
  C1:'free',C2:'free',C3:'free',C4:'free'
};

db.ref('slots').once('value').then(s=>{
  if(!s.exists()) db.ref('slots').set(defaultSlots);
});

/* ========== LOCAL BOOKING SAVE/LOAD ========== */
function setMyBooking(slotId){
  localStorage.setItem('mySlot', slotId || '');
}

function getMyBooking(){
  return localStorage.getItem('mySlot') || '';
}

/* ========== MAP PAGE RENDERING ========== */
function renderMap(slots){
  const ids = Object.keys(defaultSlots);

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;

    const status = (slots && slots[id]) || 'free';

    el.innerHTML = `
      <span class="badge ${status}">${status.toUpperCase()}</span>
      <div class="slot-id">${id}</div>
      <div class="slot-meta">${status==='free'?'Click to reserve':(status==='reserved'?'Click to release':'Occupied')}</div>
    `;

    el.onclick = () => onSlotClick(id, status);
  });
}

/* ========== MODAL LOGIC (MAP PAGE) ========== */
let selectedSlot = null;
let action = null;

function showModal(){
  document.getElementById('modal').classList.remove('hidden');
}

function hideModal(){
  document.getElementById('modal').classList.add('hidden');
}

function onSlotClick(id, status){
  if(status === 'occupied') return;

  selectedSlot = id;
  action = (status === 'free') ? 'reserve' : 'release';

  document.getElementById('modalSlot').textContent = id;
  document.getElementById('modalTitle').textContent =
    (action === 'reserve' ? 'Reserve Slot' : 'Release Slot');

  document.getElementById('modalText').innerHTML =
    (action === 'reserve')
      ? `Confirm reservation for <strong>${id}</strong>?`
      : `Release reservation for <strong>${id}</strong>?`;

  showModal();
}

function attachModalHandlers(){
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const modal = document.getElementById('modal');

  if(cancelBtn) cancelBtn.onclick = hideModal;

  if(confirmBtn) confirmBtn.onclick = () => {
    if(!selectedSlot) return;

    const newStatus = (action === 'reserve') ? 'reserved' : 'free';
    db.ref('slots/' + selectedSlot).set(newStatus);
    setMyBooking(newStatus === 'reserved' ? selectedSlot : '');
    hideModal();
  };

  if(modal){
    modal.addEventListener('click', e=>{
      if(e.target.id === 'modal') hideModal();
    });
  }
}

/* ========== BOOKING PAGE ========== */
function renderBooking(){
  const info = document.getElementById('bookingInfo');
  const my = getMyBooking();

  if(info){
    info.textContent =
      my ? `Active booking: ${my} (Reserved)` : 'No active booking.';
  }

  const releaseBtn = document.getElementById('releaseBtn');

  if(releaseBtn){
    releaseBtn.onclick = () => {
      const id = getMyBooking();
      if(id) db.ref('slots/' + id).set('free');
      setMyBooking('');
      if(info) info.textContent = 'No active booking.';
    };
  }
}

/* ========== DASHBOARD PAGE ========== */
function renderStats(slots){
  const vals = Object.values(slots || {});
  const total = vals.length;
  const free = vals.filter(s => s === 'free').length;
  const reserved = vals.filter(s => s === 'reserved').length;
  const occupied = vals.filter(s => s === 'occupied').length;

  const el = id => document.getElementById(id);

  if(el('statTotal')) el('statTotal').textContent = total;
  if(el('statFree')) el('statFree').textContent = free;
  if(el('statReserved')) el('statReserved').textContent = reserved;
  if(el('statOccupied')) el('statOccupied').textContent = occupied;

  drawChart(free, reserved, occupied);
}

function drawChart(free, reserved, occupied){
  const c = document.getElementById('usageChart');
  if(!c) return;

  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);

  const data = [free, reserved, occupied];
  const labels = ['Free','Reserved','Occupied'];
  const colors = ['#24ff6d','#ffd056','#ff5252'];
  const max = Math.max(1, ...data);

  const barW = 120;
  const gap = 80;
  let x = 120;
  const yBase = c.height - 40;

  ctx.font = '16px Poppins';
  ctx.fillStyle = '#9fb0c3';

  labels.forEach((lab, i) => {
    const h = (data[i] / max) * (c.height - 100);

    ctx.fillStyle = colors[i];
    ctx.shadowColor = colors[i];
    ctx.shadowBlur = 18;

    ctx.fillRect(x, yBase - h, barW, h);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eef6ff';
    ctx.textAlign = 'center';

    ctx.fillText(String(data[i]), x + barW/2, yBase - h - 8);

    ctx.fillStyle = '#9fb0c3';
    ctx.fillText(lab, x + barW/2, yBase + 24);

    x += barW + gap;
  });
}

/* ========== PAGE ROUTER ========== */
(function init(){
  const page = window.PAGE || 'HOME';

  db.ref('slots').on('value', snap => {
    const slots = snap.val() || {};

    if(page === 'MAP'){ renderMap(slots); attachModalHandlers(); }
    if(page === 'BOOKING'){ renderBooking(); }
    if(page === 'DASHBOARD'){ renderStats(slots); }
  });
})();