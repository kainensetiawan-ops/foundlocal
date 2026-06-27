import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import os from 'os';
const man = JSON.parse(fs.readFileSync('templates/manifest.json','utf8'));
const out = path.join(os.homedir(),'Desktop','FoundLocal-Gallery')+'/';
const b = await chromium.launch();
for (const m of man){
  const p = await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await p.goto('file://'+path.resolve('templates/'+m.slug+'.html'),{waitUntil:'networkidle'});
  await p.addStyleTag({content:'.reveal,[class*="reveal"],[class*="fade"],[data-animate]{opacity:1!important;transform:none!important;}'});
  await p.waitForTimeout(500);
  await p.screenshot({path: out+'template-'+m.slug+'.png', fullPage:true});
  await p.close(); console.log('rendered',m.slug);
}
await b.close(); console.log('DONE');
