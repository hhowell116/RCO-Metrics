/* =========================================
   TV VIEW / KIOSK MODE CONTROLLER (FINAL)
========================================= */

const dashboards = [
  'fulfillment.html',
  'orders.html',
  'shipping.html'
];

let kioskActive = false;
let index = 0;

const timings = {
  loadDelay: 4000,
  viewPause: 8000,
  scrollDown: 9000,
  pauseBottom: 4000,
  scrollUp: 6000,
  pauseTop: 3000
};

const frame = document.getElementById('kioskFrame');
const kioskBtn = document.getElementById('kioskBtn');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================
   DASHBOARD STATE MESSAGING
========================================= */

function setTVViewState(active) {
  if (!frame || !frame.contentWindow) return;

  frame.contentWindow.postMessage(
    { type: 'TV_VIEW_STATE', active },
    '*'
  );
}

/* =========================================
   EXIT TV VIEW (ONE SOURCE OF TRUTH)
========================================= */

function exitKiosk() {
  kioskActive = false;

  document.body.classList.remove(
    'kiosk-active',
    'tv-view-active',
    'show-exit'
  );

  setTVViewState(false);

  // Always exit browser fullscreen completely
  if (document.fullscreenElement) {
    document.exitFullscreen();
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

    /* Fulfillment behavior */
    if (page.includes('fulfillment')) {
      frame.contentWindow?.document
        ?.querySelector('[data-view="monthly"]')
        ?.click();

      await sleep(timings.viewPause);

      frame.contentWindow.scrollTo({
        top: frame.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });

      await sleep(timings.scrollDown);

      frame.contentWindow?.document
        ?.querySelector('[data-view="calendar"]')
        ?.click();

      await sleep(timings.viewPause);
    }

    /* Orders behavior */
    else if (page.includes('orders')) {
      frame.contentWindow?.switchView?.('calendar');
      await sleep(timings.viewPause);

      frame.contentWindow.scrollTo({
        top: frame.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });

      await sleep(timings.scrollDown);

      frame.contentWindow?.switchView?.('chart');
      await sleep(timings.viewPause);
    }

    /* Shipping behavior (scroll only) */
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
   ENTER TV VIEW
========================================= */

kioskBtn.addEventListener('click', async () => {
  if (kioskActive) return;

  kioskActive = true;

  document.body.classList.add(
    'kiosk-active',
    'tv-view-active'
  );

  setTVViewState(true);

  if (document.fullscreenElement !== document.documentElement) {
    await document.documentElement.requestFullscreen();
  }

  runKiosk();
});

/* =========================================
   EXIT ON ESC OR FULLSCREEN CHANGE
========================================= */

document.addEventListener('fullscreenchange', () => {
  if (!kioskActive) return;

  if (!document.fullscreenElement) {
    exitKiosk();
  }
});

/* =========================================
   EXIT BUTTON VISIBILITY (MOUSE MOVE)
========================================= */

let exitTimeout;

document.addEventListener('mousemove', () => {
  if (!kioskActive) return;

  document.body.classList.add('show-exit');

  clearTimeout(exitTimeout);
  exitTimeout = setTimeout(() => {
    document.body.classList.remove('show-exit');
  }, 3000);
});

/* =========================================
   EXIT FROM DASHBOARD MESSAGE
========================================= */

window.addEventListener('message', (event) => {
  if (event.data?.type === 'EXIT_TV_VIEW') {
    exitKiosk();
  }
});
