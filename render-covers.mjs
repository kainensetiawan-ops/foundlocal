// Render each designed gallery cover slide to a crisp PNG
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = 'file://' + path.join(HERE, 'gallery-covers.html');
const OUT = '/tmp/covers';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800); // fonts + embedded images settle
for (const id of ['s1', 's2', 's3', 's4', 's5']) {
  await page.locator('#' + id).screenshot({ path: path.join(OUT, id + '.png') });
  console.log('COVER=' + id);
}
await browser.close();
console.log('DONE');
