/* =========================================
   GLOBAL TV MODE CONTROLLER — PHASE 1
========================================= */

const TV_MODE = {
  enabled: false,
  dashboards: [
    'fulfillment.html',
    'orders.html',
    'shipping-leaderboard.html'
  ],
  currentIndex: 0,
  scrollDuration: 12000, // ms to scroll down
  pauseAtTop: 3000,
  pauseAtBottom: 4000,
  pageDuration: 30000 // total time per dashboard
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTVLoop() {
  while (TV_MODE.enabled) {
    const page = TV_MODE.dashboards[TV_MODE.currentIndex];

    // Navigate to dashboard
    window.location.href = page;
    await sleep(4000); // wait for page load

    if (!TV_MODE.enabled) break;

    // Scroll down
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await sleep(TV_MODE.scrollDuration);

    // Pause at bottom
    await sleep(TV_MODE.pauseAtBottom);

    // Scroll back up
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await sleep(TV_MODE.scrollDuration / 2);

    // Pause at top
    await sleep(TV_MODE.pauseAtTop);

    // Advance dashboard
    TV_MODE.currentIndex =
      (TV_MODE.currentIndex + 1) % TV_MODE.dashboards.length;
  }
}

/* =========================================
   BUTTON HANDLER
========================================= */

const tvBtn = document.getElementById('tvModeBtn');

if (tvBtn) {
  tvBtn.addEventListener('click', async () => {
    TV_MODE.enabled = !TV_MODE.enabled;

    if (TV_MODE.enabled) {
      tvBtn.textContent = '⏹ Exit TV View';

      // Enter fullscreen
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      runTVLoop();
    } else {
      tvBtn.textContent = '📺 TV View';
      document.exitFullscreen?.();
    }
  });
}
