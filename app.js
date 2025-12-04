// ------------------------------------
//  GLOBAL CONFIG
// ------------------------------------
const serverURL = "https://parkway-8fji.onrender.com/api/parking";

// Save + Load booking
function setMyBooking(slotId) {
    if (slotId) localStorage.setItem("mySlot", slotId);
    else localStorage.removeItem("mySlot");
}
function getMyBooking() {
    return localStorage.getItem("mySlot") || "";
}

// Normalize
function normalizeState(raw) {
    if (!raw) return "free";
    raw = raw.toString().trim().toUpperCase();
    if (raw === "EMPTY" || raw === "FREE") return "free";
    if (raw === "RESERVED") return "reserved";
    if (raw === "OCCUPIED") return "occupied";
    return "free";
}

// ------------------------------------
//  MAP PAGE
// ------------------------------------
async function renderMap() {
    try {
        const res = await fetch(serverURL, { cache: "no-store" });
        const slots = await res.json();

        Object.keys(slots).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            let ui = normalizeState(slots[id]);
            el.className = `slot ${ui}`;
            el.onclick = () => openReserveModal(id, ui);
        });

    } catch (e) {
        console.error("Map fetch error", e);
    }
}

// Reserve / Release modal
let selectedSlot = "";
let selectedAction = "";

function openReserveModal(id, ui) {
    selectedSlot = id;
    selectedAction = ui === "free" ? "reserve" : "release";

    document.getElementById("modalSlot").textContent = id;
    document.getElementById("modalTitle").textContent =
        selectedAction === "reserve" ? "Reserve Slot" : "Release Slot";

    document.getElementById("modalText").innerHTML =
        selectedAction === "reserve"
            ? `Do you want to reserve <strong>${id}</strong>?`
            : `Do you want to release <strong>${id}</strong>?`;

    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

// Confirm
async function confirmAction() {
    if (!selectedSlot) return;

    let newStatus =
        selectedAction === "reserve" ? "RESERVED" : "FREE";

    await fetch(`${serverURL}/${selectedSlot}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });

    // SAVE booking locally
    if (selectedAction === "reserve") {
        setMyBooking(selectedSlot);
    } else {
        setMyBooking("");
    }

    closeModal();
    renderMap();
}

// Hook modal buttons
document.addEventListener("DOMContentLoaded", () => {
    let c = document.getElementById("confirmBtn");
    if (c) c.onclick = confirmAction;

    let x = document.getElementById("cancelBtn");
    if (x) x.onclick = closeModal;
});

// ------------------------------------
//  BOOKING PAGE
// ------------------------------------
async function renderBookingPage() {
    const el = document.getElementById("bookingInfo");
    const btn = document.getElementById("releaseBtn");

    let my = getMyBooking();

    if (!my) {
        el.textContent = "No active booking.";
        btn.style.display = "none";
        return;
    }

    // Fetch live state
    const res = await fetch(`${serverURL}/${my}`);
    const data = await res.json();
    const state = normalizeState(data.status);

    el.textContent = `Active booking: ${my} (${state.toUpperCase()})`;
    btn.style.display = "block";

    btn.onclick = async () => {
        await fetch(`${serverURL}/${my}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "FREE" })
        });

        setMyBooking("");
        renderBookingPage();
    };
}

// ------------------------------------
//  INIT
// ------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    if (window.PAGE === "MAP") {
        renderMap();
        setInterval(renderMap, 2000);
    }
    if (window.PAGE === "BOOKING") {
        renderBookingPage();
        setInterval(renderBookingPage, 3000);
    }
});

