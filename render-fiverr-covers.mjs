import { chromium } from 'playwright';
import path from 'path';
import os from 'os';

const file = 'file://' + path.resolve('fiverr-covers.html');
const out = path.join(os.homedir(), 'Desktop', 'FoundLocal-Gallery') + '/';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1320, height: 820 }, deviceScaleFactor: 2 });
await p.goto(file, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);

const covers = [
  ['c1', 'gig-cover-1-business'],
  ['c2', 'gig-cover-2-landing'],
  ['c3', 'gig-cover-3-restaurant'],
  ['c4', 'gig-cover-4-google'],
];
for (const [id, name] of covers) {
  const el = await p.$('#' + id);
  await el.screenshot({ path: out + name + '.png' });
  console.log('saved', name + '.png');
}
await b.close();
console.log('DONE');
