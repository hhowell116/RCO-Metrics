/* =========================================
   GLOBAL KIOSK MODE CONTROLLER — FIXED
========================================= */

const KIOSK_KEY = 'KIOSK_MODE_ACTIVE';

const KIOSK = {
  dashboards: [
    'fulfillment.html',
    'orders.html',
    'shipping-leaderboard.html'
  ],
  scrollDuration: 12000,
  pauseAtTop: 3000,
  pauseAtBottom: 4000
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================
   START KIOSK MODE (USER GESTURE SAFE)
========================================= */

async function startKioskMode() {
  localStorage.setItem(KIOSK_KEY, 'true');

  // Fullscreen MUST happen here
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  }

  // Start on first dashboard
  localStorage.setItem('KIOSK_INDEX', '0');
  window.location.href = KIOSK.dashboards[0];
}

/* =========================================
   RUN LOOP ON DASHBOARD PAGES
========================================= */

async function runKioskLoop() {
  if (localStorage.getItem(KIOSK_KEY) !== 'true') return;

  let index = parseInt(localStorage.getItem('KIOSK_INDEX') || '0', 10);

  // Scroll down
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  await sleep(KIOSK.scrollDuration);

  await sleep(KIOSK.pauseAtBottom);

  // Scroll up
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await sleep(KIOSK.scrollDuration / 2);

  await sleep(KIOSK.pauseAtTop);

  // Advance page
  index = (index + 1) % KIOSK.dashboards.length;
  localStorage.setItem('KIOSK_INDEX', index.toString());

  window.location.href = KIOSK.dashboards[index];
}

/* =========================================
   EXIT KIOSK MODE
========================================= */

function exitKioskMode() {
  localStorage.removeItem(KIOSK_KEY);
  localStorage.removeItem('KIOSK_INDEX');
  document.exitFullscreen?.();
}

/* =========================================
   BUTTON HANDLER (INDEX PAGE)
========================================= */

const kioskBtn = document.getElementById('tvModeBtn');

if (kioskBtn) {
  kioskBtn.addEventListener('click', async () => {
    const active = localStorage.getItem(KIOSK_KEY) === 'true';

    if (!active) {
      kioskBtn.textContent = '⏹ Exit Kiosk';
      startKioskMode();
    } else {
      kioskBtn.textContent = '📺 Kiosk Mode';
      exitKioskMode();
    }
  });
}

/* =========================================
   AUTO-RUN ON DASHBOARD PAGES
========================================= */

window.addEventListener('load', () => {
  if (localStorage.getItem(KIOSK_KEY) === 'true') {
    runKioskLoop();
  }
});
