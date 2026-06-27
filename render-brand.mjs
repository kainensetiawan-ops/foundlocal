import { chromium } from 'playwright';
import path from 'path'; import os from 'os';
const file='file://'+path.resolve('brand-ember.html');
const out=path.join(os.homedir(),'Desktop','FoundLocal-Gallery','brand-ember-board.png');
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:2});
await p.goto(file,{waitUntil:'networkidle'}); await p.waitForTimeout(1000);
await p.screenshot({path:out,fullPage:true});
await b.close(); console.log('SAVED',out);
