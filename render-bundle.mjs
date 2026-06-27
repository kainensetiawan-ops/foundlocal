import { chromium } from 'playwright';
import path from 'path'; import os from 'os';
const out=path.join(os.homedir(),'Desktop','FoundLocal-Gallery','tcover-bundle.png');
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1300,height:860},deviceScaleFactor:2});
await p.goto('file://'+path.resolve('bundle-cover.html'),{waitUntil:'networkidle'});
await p.waitForTimeout(900);
const el=await p.$('#bundle'); await el.screenshot({path:out});
await b.close(); console.log('SAVED',out);
