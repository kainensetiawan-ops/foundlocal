import {chromium} from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1920,height:1080}})).newPage();
await p.goto('file:///Users/kynansetiawan/foundlocal-portfolio/promo.html#cap',{waitUntil:'load'});
console.log('loaded');
await p.evaluate(t=>window.__tl.time(t,true),3.5); console.log('timed');
const r=await Promise.race([p.screenshot({path:'/tmp/sc.png',timeout:6000}).then(()=>'SHOT-OK'),new Promise(res=>setTimeout(()=>res('SHOT-HANG'),6500))]);
console.log(r);
await b.close();
