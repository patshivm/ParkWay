const canvas = document.getElementById('parking-map');
const ctx = canvas.getContext('2d');
const totalOccupiedSpan = document.getElementById('total-occupied');
const totalAvailableSpan = document.getElementById('total-available');
const tooltip = document.getElementById('tooltip');

const NUM_SPOTS = 10;
const spotWidth = 60;
const spotHeight = 100;
const startX = 20;
const startY = 50;
const gap = 15;

let spotsData = {};

// Initialize 10 spots
function initializeSpots() {
  for (let i = 1; i <= NUM_SPOTS; i++) {
    spotsData[i] = {
      id: i.toString(),
      distance: 0,
      status: i === 1 ? 'EMPTY' : 'FAILURE',
      occupied: false,
      location: { x: startX + (i-1)*(spotWidth+gap), y: startY },
      color: i === 1 ? 'green' : 'yellow'
    };
  }
}

function renderSpot(data) {
  const id = data.id || '1';
  if (!spotsData[id]) return;
  spotsData[id].distance = data.distance;
  spotsData[id].status = data.status;
  spotsData[id].occupied = data.status === 'OCCUPIED';
  spotsData[id].color = id === '1' ? (spotsData[id].occupied ? 'red' : 'green') : 'yellow';
  drawMap();
  updateTotals();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.values(spotsData).forEach(spot => {
    ctx.fillStyle = spot.color;
    ctx.fillRect(spot.location.x, spot.location.y, spotWidth, spotHeight);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(spot.location.x, spot.location.y, spotWidth, spotHeight);
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.fillText(`S${spot.id}`, spot.location.x + 10, spot.location.y + 20);
  });
}

function updateTotals() {
  const occupiedCount = Object.values(spotsData).filter(s => s.status === 'OCCUPIED').length;
  const availableCount = Object.values(spotsData).filter(s => s.status === 'EMPTY').length;
  totalOccupiedSpan.textContent = `Occupied: ${occupiedCount}`;
  totalAvailableSpan.textContent = `Available: ${availableCount}`;
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const spot = Object.values(spotsData).find(s => 
    x >= s.location.x && x <= s.location.x + spotWidth &&
    y >= s.location.y && y <= s.location.y + spotHeight
  );
  if (spot) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    tooltip.textContent = `Spot ${spot.id} - ${spot.status} (${spot.distance.toFixed(2)} cm)`;
  } else {
    tooltip.style.display = 'none';
  }
});

function startSSE() {
  const sse = new EventSource('https://parkway-8fji.onrender.com'); // replace with your Render URL
  sse.addEventListener('init', e => {
    const data = JSON.parse(e.data);
    data.forEach(renderSpot);
  });
  sse.addEventListener('update', e => {
    const data = JSON.parse(e.data);
    renderSpot(data);
  });
}

window.addEventListener('load', () => {
  initializeSpots();
  drawMap();
  updateTotals();
  startSSE();
});