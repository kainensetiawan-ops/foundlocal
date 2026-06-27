import {chromium} from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1920,height:1080}})).newPage();
await p.goto('file:///Users/kynansetiawan/foundlocal-portfolio/promo.html#cap',{waitUntil:'load'});
console.log('loaded');
await p.evaluate(t=>window.__tl.seek(t),4); console.log('seeked');
await p.screenshot({path:'/tmp/t3.png'}); console.log('shot1');
await p.screenshot({path:'/tmp/t3b.png',animations:'disabled'}); console.log('shot2');
await b.close(); console.log('done');
