import { chromium } from 'playwright';
import path from 'path'; import os from 'os';
const out=path.join(os.homedir(),'Desktop','FoundLocal-Gallery')+'/';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1120,height:1120},deviceScaleFactor:2});
await p.goto('file://'+path.resolve('template-covers.html'),{waitUntil:'networkidle'}); await p.waitForTimeout(900);
for(const id of ['c0','c1','c2','c3','c4']){const el=await p.$('#'+id);await el.screenshot({path:out+'tcover-'+id+'.png'});}
const p2=await b.newPage({viewport:{width:1120,height:1120},deviceScaleFactor:2});
await p2.goto('file://'+path.resolve('bundle-cover.html'),{waitUntil:'networkidle'}); await p2.waitForTimeout(900);
const eb=await p2.$('#bundle'); await eb.screenshot({path:out+'tcover-bundle.png'});
await b.close(); console.log('square covers done');
