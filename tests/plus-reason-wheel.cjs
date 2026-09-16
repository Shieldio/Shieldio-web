const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
  constructor() { this.events={};this.children=[];this.hidden=false;this.disabled=false;this.style={setProperty(){}};this.classList={add(){},remove(){}}; }
  addEventListener(name,fn) { this.events[name]=fn; }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children=[]; }
  setAttribute() {} removeAttribute() {}
  showModal() { this.open=true; } close() { this.open=false;this.events.close?.(); }
  focus() { this.focused=true; }
  dispatchEvent(event) { this.events[event.type]?.(event); }
}
const selectors=['data-wheel-rotor','data-wheel-spin','data-wheel-result','data-wheel-apply','data-wheel-badge','data-wheel-mode','data-wheel-sound','data-wheel-count','data-wheel-close','data-wheel-list'];
const nodes=Object.fromEntries(selectors.map(k=>[k,new Node()]));
const box=new Node(),opener=new Node(),disconnect=new Node(),reason=new Node();reason.value='Původní pravdivý důvod';
box.querySelector=s=>nodes[s.slice(1,-1)];
nodes['data-wheel-mode'].value='mix';nodes['data-wheel-sound'].checked=true;
let notesChanged=0,tones=0,suspends=0;
reason.addEventListener('input',()=>notesChanged++);
class Audio {
  constructor(){this.state='running';this.currentTime=0;}
  resume(){this.state='running';return Promise.resolve();} suspend(){suspends++;this.state='suspended';return Promise.resolve();}
  createOscillator(){return {frequency:{},connect(){},start(){tones++;},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
}
const ctx=vm.createContext({document:{querySelector:s=>s==='[data-reason-wheel]'?box:s==='[data-note-form]'?{elements:{reason}}:s==='[data-wheel-open]'?opener:disconnect,createElement:()=>new Node()},window:{AudioContext:Audio},performance:{now:()=>0},requestAnimationFrame:fn=>{fn(5000);return 1;},cancelAnimationFrame(){},matchMedia:()=>({matches:true}),Math:Object.assign(Object.create(Math),{random:()=>0}),Event:class{constructor(type){this.type=type;}},fetch(){throw new Error('Wheel must not use network');}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/plus-reason-wheel.js'),'utf8'),ctx);
assert.equal(nodes['data-wheel-list'].children.length,40);
opener.events.click();assert.equal(box.open,true);
nodes['data-wheel-mode'].value='funny';nodes['data-wheel-mode'].events.change();
assert.equal(nodes['data-wheel-list'].children.length,20);
nodes['data-wheel-spin'].events.click();assert.ok(tones>0);assert.equal(nodes['data-wheel-apply'].hidden,true);
nodes['data-wheel-apply'].events.click();assert.equal(reason.value,'Původní pravdivý důvod');assert.equal(notesChanged,0);
const first=nodes['data-wheel-result'].textContent;nodes['data-wheel-spin'].events.click();assert.notEqual(nodes['data-wheel-result'].textContent,first);
nodes['data-wheel-mode'].value='serious';nodes['data-wheel-mode'].events.change();
nodes['data-wheel-sound'].checked=false;nodes['data-wheel-sound'].events.change();
const before=tones;nodes['data-wheel-spin'].events.click();assert.equal(tones,before);assert.equal(nodes['data-wheel-apply'].hidden,false);
assert.equal(reason.value,'Původní pravdivý důvod');
nodes['data-wheel-apply'].events.click();assert.equal(reason.value,'Návštěva lékaře');assert.equal(notesChanged,1);assert.equal(box.open,false);assert.ok(suspends>0);
opener.events.click();disconnect.events.click();assert.equal(box.open,false);
console.log('Kolo: 40 návrhů, filtry, humor nikdy nevložen, ruční vložení, bez opakování, audio/mute, zavření a odpojení OK; bez sítě.');
