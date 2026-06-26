// Render the edited promo: seek the GSAP master timeline per frame (frame-perfect), then ffmpeg.
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(HERE, 'promo.html') + '#cap';
const FR = '/tmp/pframes';
fs.rmSync(FR, { recursive: true, force: true });
fs.mkdirSync(FR, { recursive: true });

const W = 1920, H = 1080, FPS = 30, DUR = 21, TOTAL = DUR * FPS;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
await page.goto(PAGE, { waitUntil: 'load' });
await page.evaluate(() => window.gsap && window.gsap.ticker.lagSmoothing(0));
await page.waitForTimeout(1200); // let fonts + images paint

for (let f = 0; f < TOTAL; f++) {
  await page.evaluate((t) => window.__tl && window.__tl.time(t, true), f / FPS);
  await page.waitForTimeout(10);
  await page.screenshot({ path: path.join(FR, String(f).padStart(4, '0') + '.png') });
  if (f % 90 === 0) console.log('frame', f);
}
console.log('LOOP DONE');
await browser.close();

execSync(
  `ffmpeg -y -framerate ${FPS} -i ${FR}/%04d.png -vf "format=yuv420p" -c:v libx264 -preset slow -crf 18 -movflags +faststart /tmp/foundlocal_promo.mp4`,
  { stdio: 'inherit' }
);
console.log('DONE');
