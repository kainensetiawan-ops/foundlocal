// scrollshot.mjs — smooth top-to-bottom scroll capture of a GSAP/ScrollTrigger page.
// Drives system Chrome via puppeteer-core (NO bundled-browser download → no Node24 hang),
// steps scroll in tiny increments, grabs a PNG per step, then ffmpeg encodes 1080p mp4.
//
// Usage: node scrollshot.mjs cinematic.html out.mp4 [seconds] [fps]
import puppeteer from 'puppeteer-core';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE    = process.argv[2] || 'cinematic.html';
const OUT     = process.argv[3] || 'showcase.mp4';
const SECONDS = Number(process.argv[4] || 26);   // total video length
const FPS     = Number(process.argv[5] || 60);   // 60fps = silky
const W = 1920, H = 1080;                         // capture at 1080p
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRAMES = SECONDS * FPS;
const TOPHOLD = Math.round(FPS * 1.2);            // hold at top so hero anim plays
const ENDHOLD = Math.round(FPS * 1.0);           // hold at bottom on CTA
const DIR = '/tmp/scrollshot_frames';

rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

// ease so the scroll glides (slow-in / slow-out) instead of a robotic constant crawl
const easeInOut = t => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1',
         '--disable-gpu', '--no-sandbox', '--font-render-hinting=none'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.goto('file://' + resolve(FILE), { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));  // let fonts + GSAP settle

const maxScroll = await page.evaluate(() =>
  document.documentElement.scrollHeight - window.innerHeight);

const scrollFrames = FRAMES - TOPHOLD - ENDHOLD;
let n = 0;
const shot = async () => {
  await page.screenshot({ path: `${DIR}/f_${String(n).padStart(5,'0')}.png` });
  n++;
};

// 1) hold at the very top (hero word rises in)
for (let i = 0; i < TOPHOLD; i++) await shot();
// 2) eased glide top → bottom, one frame per tiny scroll step
for (let i = 0; i < scrollFrames; i++) {
  const y = Math.round(easeInOut(i / (scrollFrames - 1)) * maxScroll);
  await page.evaluate(py => window.scrollTo(0, py), y);
  await new Promise(r => setTimeout(r, 16)); // let scrub anim + repaint catch up
  await shot();
}
// 3) hold on the CTA
for (let i = 0; i < ENDHOLD; i++) await shot();

await browser.close();
console.log(`captured ${n} frames → encoding…`);

// ffmpeg: H.264 high, yuv420p (universal/Upwork-safe), faststart for web preview
const r = spawnSync('ffmpeg', ['-y', '-framerate', String(FPS),
  '-i', `${DIR}/f_%05d.png`,
  '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-preset', 'slow',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-vf', `scale=${W}:${H}:flags=lanczos`, OUT], { stdio: 'inherit' });
process.exit(r.status ?? 0);
