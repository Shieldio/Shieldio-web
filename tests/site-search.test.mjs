// Exercise the actual search modal with the shipped index, without network access.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const script=await fs.readFile(new URL('../assets/js/search.js',import.meta.url),'utf8');
const index=JSON.parse(await fs.readFile(new URL('../assets/data/search-index.json',import.meta.url),'utf8'));
function element(){
 const classes=new Set(),listeners={};
 return {listeners,innerHTML:'',value:'',className:'',classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},addEventListener(n,fn){(listeners[n]||=[]).push(fn);},emit(n,e={}){for(const fn of listeners[n]||[])fn(e);},focus(){}};
}
function fixture({failFirst=false}={}){
 const input=element(),results=element(),close=element(),overlay=element(),document=element(),requests=[];
 overlay.querySelector=selector=>({'.search-input':input,'.search-results':results,'.modal-close':close})[selector];
 document.querySelectorAll=()=>[];document.createElement=()=>overlay;document.body={appendChild(){}};
 vm.runInNewContext(script,{document,window:{location:{}},setTimeout:fn=>fn(),fetch:async(url,options)=>{requests.push({url,options});return {ok:!(failFirst&&requests.length===1),json:async()=>index};}});
 document.emit('DOMContentLoaded');
 const open=()=>document.emit('keydown',{key:'k',ctrlKey:true,preventDefault(){}});
 const search=query=>{input.value=query;input.emit('input');return [...results.innerHTML.matchAll(/class="search-result" href="([^"]+)"/g)].map(m=>m[1]);};
 return {open,search,requests,results};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const f=fixture();f.open();f.open();await flush();assert.equal(f.requests.length,1,'Repeated opening shares the pending index request');
assert.equal(f.requests[0].options.cache,'no-cache','A deployment revalidates the search index');
const barrier='/instructions/baseline/red/zavora/index.html',radar='/instructions/baseline/red/radar/index.html';
for(const query of ['závora','zavora','ZÁVORA','za\u0301vora','  závora  '])assert.equal(f.search(query)[0],barrier,query+' finds the project first');
assert.deepEqual(f.search('servo závora'),[barrier],'Multiple terms can match the title and components');
const servo=f.search('servo');assert.ok(servo.includes(barrier)&&servo.includes(radar),'Servo finds both documented servo projects');
assert.ok(servo.indexOf(barrier)<servo.indexOf('/products/RED.html'),'Projects rank before a general product description');
for(const query of ['HC-SR04','hc sr04','OLED','bzučák','bzučak','ultrazvuk'])assert.ok(f.search(query).some(url=>url.startsWith('/instructions/baseline/red/')),query+' finds a practical guide');
assert.deepEqual(f.search('něco zcela neexistujícího'),[]);assert.match(f.results.innerHTML,/Nic jsem nenašel/);
f.search('   ');assert.match(f.results.innerHTML,/Začni psát/);
const retry=fixture({failFirst:true});retry.open();await flush();assert.match(retry.results.innerHTML,/nepodařilo načíst/);
retry.open();await flush();assert.equal(retry.search('zavora')[0],barrier,'Failed index loading can be retried');
console.log('Site search: accent variants, component queries, project ranking, multiword queries, cache revalidation and retry passed.');
