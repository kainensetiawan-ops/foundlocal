import { chromium } from 'playwright';
import path from 'path'; import os from 'os';
const out=path.join(os.homedir(),'Desktop','FoundLocal-Gallery')+'/';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1300,height:860},deviceScaleFactor:2});
await p.goto('file://'+path.resolve('template-covers.html'),{waitUntil:'networkidle'});
await p.waitForTimeout(900);
for(const id of ['c0','c1','c2','c3','c4']){const el=await p.$('#'+id);await el.screenshot({path:out+'tcover-'+id+'.png'});console.log('saved',id);}
await b.close();console.log('DONE');
