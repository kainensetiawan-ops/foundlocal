const timecut = require('timecut');
const puppeteer = require('puppeteer');
const path = require('path');
const SITE = 'file://' + path.resolve(__dirname, 'promo.html'); // autoplay ON (no #cap)
timecut({
  url: SITE,
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  fps: 30,
  duration: 21,
  output: path.resolve(__dirname, 'foundlocal_promo.mp4'),
  pixFmt: 'yuv420p',
  launcher: (o) => puppeteer.launch({ ...o, args: [...(o.args||[]), '--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'] }),
}).then(() => console.log('TC_DONE')).catch((e) => { console.error('TC_ERR', e && e.message); process.exit(1); });
