// render-showcase.js — smooth top-to-bottom auto-scroll video of cinematic.html
// timecut (virtual-time, frame-perfect) + puppeteer 25 (native Apple Silicon Chrome) + ffmpeg.
// Verified on macOS arm64 / node 24.16 / puppeteer 25.2.1 / ffmpeg 7.
//
//   npm i puppeteer@latest timecut
//   node render-showcase.js
//
const timecut = require('timecut');
const puppeteer = require('puppeteer');
const path = require('path');

const SITE = 'file://' + path.resolve(__dirname, 'cinematic.html');

// --- timing knobs ---
const FPS      = 60;
const HOLD_TOP = 2.0;   // s: let the hero entrance tweens finish before scrolling
const SCROLL   = 22;    // s: actual top->bottom travel
const HOLD_END = 1.5;   // s: rest on the last scene
const DURATION = HOLD_TOP + SCROLL + HOLD_END;          // ~25.5s
const TOTAL    = Math.round(DURATION * FPS);

// easeInOut so the scroll starts/stops gently (no hard jerk at the ends)
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

timecut({
  url: SITE,
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  fps: FPS,
  duration: DURATION,
  output: path.resolve(__dirname, 'foundlocal-showcase.mp4'),
  pixFmt: 'yuv420p',                 // QuickTime / Upwork-safe
  // bring our own modern puppeteer so we are NOT stuck on timecut's pinned old one
  launcher: (opts) => puppeteer.launch({
    ...opts,
    args: [ ...(opts.args || []),
      '--no-sandbox',
      '--force-device-scale-factor=1',
      '--hide-scrollbars',
      '--disable-features=CalculateNativeWinOcclusion' ],
  }),
  preparePageForScreenshot: async (page, frameCount, totalFrames) => {
    const tSec = frameCount / FPS;
    let frac;
    if (tSec < HOLD_TOP)            frac = 0;
    else if (tSec < HOLD_TOP + SCROLL) frac = easeInOut((tSec - HOLD_TOP) / SCROLL);
    else                           frac = 1;
    await page.evaluate((f) => {
      const max = Math.max(document.body.scrollHeight,
                           document.documentElement.scrollHeight) - window.innerHeight;
      window.scrollTo(0, max * f);
      if (window.ScrollTrigger) window.ScrollTrigger.update();  // keep scrub anims in sync
    }, frac);
  },
})
  .then(() => console.log('Rendered foundlocal-showcase.mp4 (' + TOTAL + ' frames)'))
  .catch(e => { console.error(e); process.exit(1); });
