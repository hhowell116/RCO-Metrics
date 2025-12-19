/* =========================================
   TRUE KIOSK MODE CONTROLLER (IFRAME BASED)
   PHASE 2 — VIEW ROTATION + HEADER HIDE
========================================= */

const dashboards = [
  'fulfillment.html',
  'orders.html',
  'shipping-leaderboard.html'
];

let kioskActive = false;
let index = 0;

const timings = {
  loadDelay: 4000,
  scrollDown: 9000,
  pauseBottom: 4000,
  scrollUp: 6000,
  pauseTop: 3000,
  viewPause: 8000
};

const frame = document.getElementById('kioskFrame');
const kioskBtn = document.getElementById('kioskBtn');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================
   HELPERS — DASHBOARD VIEW SWITCHING
========================================= */

function switchFulfillmentView(view) {
  const win = frame.contentWindow;
  const btn = win?.document?.querySelector(`[data-view="${view}"]`);
  if (btn) btn.click();
}

function switchOrdersView(view) {
  const win = frame.contentWindow;
  if (typeof win?.switchView === 'function') {
    win.switchView(view);
  }
}

/* =========================================
   MAIN KIOSK LOOP
========================================= */

async function runKiosk() {
  while (kioskActive) {
    const page = dashboards[index];
    frame.src = page;

    await sleep(timings.loadDelay);
    if (!kioskActive) return;

    /* ===============================
       FULFILLMENT DASHBOARD
    =============================== */
    if (page.includes('fulfillment')) {
      // Monthly view
      switchFulfillmentView('monthly');
      await sleep(timings.viewPause);

      // Scroll
      frame.contentWindow.scrollTo({
        top: frame.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });
      await sleep(timings.scrollDown);

      // Calendar view
      switchFulfillmentView('calendar');
      await sleep(timings.viewPause);
    }

    /* ===============================
       ORDERS DASHBOARD
    =============================== */
    else if (page.includes('orders')) {
      switchOrdersView('calendar');
      await sleep(timings.viewPause);

      frame.contentWindow.scrollTo({
        top: frame.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });
      await sleep(timings.scrollDown);

      switchOrdersView('chart');
      await sleep(timings.viewPause);
    }

    /* ===============================
       SHIPPING LEADERBOARD
    =============================== */
    else {
      frame.contentWindow.scrollTo({
        top: frame.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });
      await sleep(timings.scrollDown);

      await sleep(timings.pauseBottom);

      frame.contentWindow.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      await sleep(timings.scrollUp);
    }

    await sleep(timings.pauseTop);

    index = (index + 1) % dashboards.length;
  }
}

/* =========================================
   ENTER / EXIT KIOSK MODE
========================================= */

kioskBtn.addEventListener('click', async () => {
  // ENTER TV VIEW ONLY
  if (kioskActive) return;

  kioskActive = true;

  document.body.classList.add('kiosk-active');

  // Request fullscreen ONCE (parent only)
  if (document.fullscreenElement !== document.documentElement) {
    await document.documentElement.requestFullscreen();
  }

  runKiosk();
});

let kioskBtnTimeout;

document.addEventListener('mousemove', () => {
  if (!kioskActive) return;

  kioskBtn.style.opacity = '1';
  kioskBtn.style.pointerEvents = 'auto';

  clearTimeout(kioskBtnTimeout);
  kioskBtnTimeout = setTimeout(() => {
    kioskBtn.style.opacity = '0';
    kioskBtn.style.pointerEvents = 'none';
  }, 3000);
});

/* =========================================
   HANDLE ESC / FULLSCREEN EXIT
========================================= */

document.addEventListener('fullscreenchange', () => {
  if (!kioskActive) return;

  // If the parent document is no longer fullscreen,
  // exit TV View immediately
  if (document.fullscreenElement !== document.documentElement) {
    exitKiosk();
  }
});


function exitKiosk() {
  kioskActive = false;
  document.body.classList.remove('kiosk-active');
  // DO NOT call document.exitFullscreen()
}
/* =========================================
   EXIT TV VIEW FROM IFRAME (ONE-CLICK FIX)
========================================= */
window.addEventListener('message', (event) => {
  if (event.data === 'EXIT_TV_VIEW') {
    exitKiosk();
  }
});

