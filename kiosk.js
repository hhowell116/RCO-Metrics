/* =========================================
   TV VIEW / KIOSK MODE CONTROLLER (UPDATED)
========================================= */

const iframes = {
  fulfillment: document.querySelector('#fulfillment-frame iframe'),
  orders: document.querySelector('#orders-frame iframe'),
  shipping: document.querySelector('#shipping-frame iframe')
};

const dashboardSequence = ['fulfillment', 'orders', 'shipping'];

let kioskActive = false;
let currentIndex = 0;

const timings = {
  loadDelay: 4000,
  viewPause: 8000,
  scrollDown: 9000,
  pauseBottom: 4000,
  scrollUp: 6000,
  pauseTop: 3000
};

const kioskBtn = document.getElementById('kioskBtn');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================
   DASHBOARD STATE MESSAGING
========================================= */

function setTVViewState(active) {
  // Notify all iframes of TV view state
  Object.values(iframes).forEach(iframe => {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'TV_VIEW_STATE', active },
        '*'
      );
    }
  });
}

/* =========================================
   EXIT TV VIEW (ONE SOURCE OF TRUTH)
========================================= */

function exitKiosk() {
  kioskActive = false;

  document.body.classList.remove('kiosk-active', 'tv-view-active');
  
  // Show header again
  const nav = document.getElementById('nav');
  if (nav) {
    nav.classList.remove('collapsed');
    nav.classList.add('expanded');
  }

  setTVViewState(false);

  // Exit fullscreen completely
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

/* =========================================
   SWITCH TO DASHBOARD
========================================= */

function switchToDashboard(name) {
  // Hide all iframes
  document.querySelectorAll('.iframe-wrapper').forEach(wrapper => {
    wrapper.classList.remove('active');
  });
  
  // Show the requested one
  const targetFrame = document.getElementById(`${name}-frame`);
  if (targetFrame) {
    targetFrame.classList.add('active');
  }
  
  // Update nav tabs if not in kiosk mode
  if (!kioskActive) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === name);
    });
  }
}

/* =========================================
   GET CURRENT IFRAME
========================================= */

function getCurrentIframe() {
  const dashboardName = dashboardSequence[currentIndex];
  return iframes[dashboardName];
}

/* =========================================
   MAIN KIOSK LOOP
========================================= */

async function runKiosk() {
  while (kioskActive) {
    const dashboardName = dashboardSequence[currentIndex];
    const iframe = iframes[dashboardName];
    
    // Switch to this dashboard
    switchToDashboard(dashboardName);
    
    await sleep(timings.loadDelay);
    if (!kioskActive) return;

    /* Fulfillment behavior */
    if (dashboardName === 'fulfillment') {
      iframe.contentWindow?.document
        ?.querySelector('[data-view="monthly"]')
        ?.click();

      await sleep(timings.viewPause);
      if (!kioskActive) return;

      iframe.contentWindow?.scrollTo({
        top: iframe.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });

      await sleep(timings.scrollDown);
      if (!kioskActive) return;

      iframe.contentWindow?.document
        ?.querySelector('[data-view="calendar"]')
        ?.click();

      await sleep(timings.viewPause);
      if (!kioskActive) return;
    }

    /* Orders behavior */
    else if (dashboardName === 'orders') {
      // Switch to calendar view
      if (iframe.contentWindow?.switchView) {
        iframe.contentWindow.switchView('calendar');
      }
      await sleep(timings.viewPause);
      if (!kioskActive) return;

      iframe.contentWindow?.scrollTo({
        top: iframe.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });

      await sleep(timings.scrollDown);
      if (!kioskActive) return;

      // Switch to chart view
      if (iframe.contentWindow?.switchView) {
        iframe.contentWindow.switchView('chart');
      }
      await sleep(timings.viewPause);
      if (!kioskActive) return;
    }

    /* Shipping behavior (scroll only) */
    else {
      iframe.contentWindow?.scrollTo({
        top: iframe.contentDocument.body.scrollHeight,
        behavior: 'smooth'
      });

      await sleep(timings.scrollDown);
      if (!kioskActive) return;

      await sleep(timings.pauseBottom);
      if (!kioskActive) return;

      iframe.contentWindow?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      await sleep(timings.scrollUp);
      if (!kioskActive) return;
    }

    await sleep(timings.pauseTop);
    if (!kioskActive) return;
    
    currentIndex = (currentIndex + 1) % dashboardSequence.length;
  }
}

/* =========================================
   ENTER TV VIEW
========================================= */

kioskBtn.addEventListener('click', async () => {
  if (kioskActive) return;

  kioskActive = true;
  currentIndex = 0;

  document.body.classList.add('kiosk-active', 'tv-view-active');
  
  // Collapse header
  const nav = document.getElementById('nav');
  if (nav) {
    nav.classList.add('collapsed');
    nav.classList.remove('expanded');
  }

  setTVViewState(true);

  // Enter fullscreen
  if (document.fullscreenElement !== document.documentElement) {
    await document.documentElement.requestFullscreen();
  }

  runKiosk();
});

/* =========================================
   LISTEN FOR FULLSCREEN BUTTON CLICKS FROM IFRAMES
========================================= */

window.addEventListener('message', (event) => {
  // If a dashboard requests to exit TV view via its fullscreen button
  if (event.data?.type === 'EXIT_TV_VIEW') {
    exitKiosk();
  }
});

/* =========================================
   EXIT ON FULLSCREEN CHANGE (ESC KEY)
========================================= */

document.addEventListener('fullscreenchange', () => {
  // Only auto-exit if we're in kiosk mode and fullscreen was exited
  if (kioskActive && !document.fullscreenElement) {
    exitKiosk();
  }
});
