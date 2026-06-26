// Capture a smooth scroll-through video + clean scene stills of cinematic.html
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(HERE, 'cinematic.html');
const OUT = '/tmp/gallery';      // stills
const VIDDIR = '/tmp/vidraw';    // raw webm
fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(VIDDIR, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(VIDDIR, { recursive: true });

const W = 1920, H = 1080;
const browser = await chromium.launch();

// ---------- VIDEO: smooth top-to-bottom scroll with live animations ----------
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: VIDDIR, size: { width: W, height: H } },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1900);                       // let the hero word play
await page.evaluate(async (dur) => {
  document.documentElement.style.scrollBehavior = 'auto';
  const maxY = document.body.scrollHeight - window.innerHeight;
  const start = performance.now();
  await new Promise((res) => {
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * t);     // easeInOutSine — gentle start/stop
      window.scrollTo(0, e * maxY);
      if (t < 1) requestAnimationFrame(frame); else res();
    }
    requestAnimationFrame(frame);
  });
}, 21000);
await page.waitForTimeout(1600);                       // hold on the CTA
await ctx.close();                                     // finalize the webm
const webm = fs.readdirSync(VIDDIR).find((f) => f.endsWith('.webm'));
console.log('VIDEO_WEBM=' + path.join(VIDDIR, webm));

// ---------- STILLS: clean scene shots (content forced visible, no blanks) ----------
const ctx2 = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const p2 = await ctx2.newPage();
await p2.goto(PAGE, { waitUntil: 'networkidle' });
await p2.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important}.do-line{color:var(--ivory)!important}' });
await p2.waitForTimeout(1200);
const shots = ['hero', 'shift', 'dowedo', 'work', 'packages', 'cta'];
for (const id of shots) {
  await p2.evaluate((id) => {
    document.documentElement.style.scrollBehavior = 'auto';
    if (id === 'hero') { window.scrollTo(0, 0); return; }
    const el = document.getElementById(id);
    el.scrollIntoView({ block: 'start' });
    if (id === 'dowedo') document.querySelectorAll('.do-line').forEach((l) => l.classList.add('on'));
  }, id);
  await p2.waitForTimeout(800);
  await p2.screenshot({ path: path.join(OUT, id + '.png') });
  console.log('STILL=' + id);
}
await browser.close();
console.log('DONE');
