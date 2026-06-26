// Frame-perfect HD scroll video: deterministic per-frame scroll + screenshot, then ffmpeg.
// Fixes the realtime "lag" (no dropped frames) AND keeps the live aurora + GSAP reveals
// (real-time CSS, unlike timecut's frozen virtual clock).
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(HERE, 'cinematic.html');
const FRAMES = '/tmp/vframes';
fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const W = 1920, H = 1080, FPS = 30;
const HOLD_TOP = 2.0, SCROLL = 20, HOLD_END = 1.6;
const DUR = HOLD_TOP + SCROLL + HOLD_END;
const TOTAL = Math.round(DUR * FPS);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await page.waitForTimeout(300);

for (let f = 0; f < TOTAL; f++) {
  const t = f / FPS;
  const frac = t < HOLD_TOP ? 0 : (t < HOLD_TOP + SCROLL ? ease((t - HOLD_TOP) / SCROLL) : 1);
  await page.evaluate((fr) => {
    const m = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    window.scrollTo(0, m * fr);
    if (window.ScrollTrigger) window.ScrollTrigger.update();
  }, frac);
  await page.waitForTimeout(15);
  await page.screenshot({ path: path.join(FRAMES, String(f).padStart(4, '0') + '.png') });
}
await browser.close();

execSync(
  `ffmpeg -y -framerate ${FPS} -i ${FRAMES}/%04d.png -vf "format=yuv420p" -c:v libx264 -preset slow -crf 18 -movflags +faststart /tmp/foundlocal_showcase.mp4`,
  { stdio: 'inherit' }
);
console.log('DONE');
