/* =========================================
   TRUE KIOSK MODE CONTROLLER (IFRAME BASED)
========================================= */

const dashboards = [
  'fulfillment.html',
  'orders.html',
  'shipping-leaderboard.html'
];

let kioskActive = false;
let index = 0;

const timings = {
  pageDuration: 30000,   // total time per dashboard
  scrollDown: 12000,
  pauseBottom: 4000,
  scrollUp: 6000,
  pauseTop: 3000
};

const frame = document.getElementById('kioskFrame');
const kioskBtn = document.getElementById('kioskBtn');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runKiosk() {
  while (kioskActive) {
    frame.src = dashboards[index];

    await sleep(4000); // allow dashboard to render

    // Scroll down inside iframe
    frame.contentWindow.scrollTo({
      top: frame.contentDocument.body.scrollHeight,
      behavior: 'smooth'
    });

    await sleep(timings.scrollDown);
    await sleep(timings.pauseBottom);

    // Scroll back up
    frame.contentWindow.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    await sleep(timings.scrollUp);
    await sleep(timings.pauseTop);

    index = (index + 1) % dashboards.length;
  }
}

kioskBtn.addEventListener('click', async () => {
  kioskActive = !kioskActive;

  if (kioskActive) {
    kioskBtn.textContent = '⏹ Exit Kiosk';

    // TRUE fullscreen — this now works
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }

    runKiosk();
  } else {
    kioskBtn.textContent = '📺 Kiosk Mode';
    document.exitFullscreen?.();
  }
});
