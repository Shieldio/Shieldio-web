// Behavior tests using a minimal DOM model; no browser, hardware or network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { Blob } from 'node:buffer';
const html=await fs.readFile(new URL('../instructions/blokovy-editor.html',import.meta.url),'utf8');
const source=(await fs.readFile(new URL('../assets/js/arduino-programming.mjs',import.meta.url),'utf8')).replace(/^import .+;\n/gm,'').replaceAll('import.meta.url','"https://shieldio.cz/assets/js/arduino-programming.mjs"');
const dictionary=JSON.parse(await fs.readFile(new URL('../assets/data/i18n.json',import.meta.url),'utf8'));
for(const key of [...html.matchAll(/data-i18n(?:-title|-aria-label)?="([^"]+)"/g)].map(m=>m[1])) assert.ok(dictionary[key],key);
function model({serial=false,unavailable=false,technical=''}={}){
  const elements=new Map();
  class Element{
    constructor(id){this.id=id;this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.attributes={};this.listeners={};this.options=[];}
    addEventListener(name,fn){this.listeners[name]=fn;}
    getAttribute(name){return this.attributes[name]??null;}
    setAttribute(name,value){this.attributes[name]=value;}
    removeAttribute(name){delete this.attributes[name];}
    replaceChildren(...options){this.options=options;this.value='';}
    add(option){this.options.push(option);}
    focus(){}
    click(){}
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element(match[1]));
  const get=id=>{assert.ok(elements.has(id),'Missing HTML element '+id);return elements.get(id);};
  get('blocksTab').attributes['aria-selected']='true';get('codeTab').attributes['aria-selected']='false';
  let lists=0,portRequests=0,created=0,compilations=0;
  const downloads=[];
  let blockSource="void setup(){} void loop(){}";
  const bridge={socket:{connected:true},async listPorts(){lists++;return [{path:'/dev/cu.RED',manufacturer:'USB'}];},createPort(path){created++;return {path};},close(){this.socket.connected=false;}};
  const navigator=serial?{serial:{async requestPort(){portRequests++;return {direct:true};},addEventListener(){}}}:{};
  const window={isSecureContext:true,SHIELDIO_EDITOR:{getCode:()=>blockSource,getError:()=>null,resize(){}},addEventListener(){}};
  const context=vm.createContext({
    window,navigator,document:{documentElement:{lang:'cs'},getElementById:get,createElement:()=>new Element('generated')},
    MutationObserver:class{observe(){}},Option:class{constructor(text,value){this.text=text;this.value=value;}},
    AbortController,Blob,console,setTimeout,clearTimeout,NANO_FLASH_BYTES:30720,
    URL:class extends URL {static createObjectURL(blob){downloads.push(blob);return 'blob:test';}static revokeObjectURL(){}},
    Worker:class {
      postMessage(){compilations++;Promise.resolve().then(()=>this.onmessage({data:{result:{fitsTarget:true,flashBytes:2,ramBytes:0,hex:':test',stderr:[]}}}));}
      terminate(){}
    },
    parseHex(){},flashNano(){throw Error('Discovery must not flash hardware');},
    async connectMlink(){if(unavailable){const error=Error('MLINK_UNAVAILABLE');if(technical)error.details=technical;throw error;}bridge.socket.connected=true;return bridge;}
  });
  vm.runInContext(source,context,{filename:'arduino-programming.mjs'});
  return {get,downloads,setBlockSource(value){blockSource=value;},counts:()=>({lists,portRequests,created,compilations})};
}
function enableBridge(m){
  m.get('transportSelect').value='mlink';m.get('transportSelect').listeners.change();
}
{
  const m=model();
  assert.equal(m.get('transportSelect').value,'direct');
  assert.equal(m.get('uploadBtn').disabled,true);
  assert.equal(m.get('connectBoardBtn').disabled,true);
  assert.equal(m.get('compileBtn').disabled,false);
  assert.equal(m.get('usbCompatibility').hidden,false);
  assert.equal(m.get('mlinkHelp').hidden,true);
  assert.equal(m.counts().lists,0,'Do not contact a helper by default');
  await m.get('uploadBtn').listeners.click();
  assert.equal(m.counts().lists,0,'Unsupported upload does not contact a helper');
  await m.get('compileBtn').listeners.click();
  assert.equal(m.counts().compilations,1,'Compilation is available without Web Serial');
  assert.equal(m.get('downloadHexBtn').disabled,false,'HEX export is available in blocks mode');
  assert.equal(m.get('uploadBtn').disabled,true,'Completion must not re-enable unsupported upload');
  m.get('downloadHexBtn').listeners.click();assert.equal(await m.downloads.at(-1).text(),':test');
  m.get('downloadSourceBtn').listeners.click();assert.equal(await m.downloads.at(-1).text(),'void setup(){} void loop(){}');
  m.setBlockSource('changed');m.get('arduinoSource').listeners.input();
  assert.equal(m.get('downloadHexBtn').disabled,true,'Stale HEX must not be downloadable');
}
{
  const m=model();enableBridge(m);
  assert.equal(m.get('uploadBtn').disabled,false);
  assert.equal(m.get('usbCompatibility').hidden,true);
  assert.equal(m.get('mlinkHelp').hidden,false);
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.counts().lists,1);assert.equal(m.counts().created,0);
  assert.equal(m.get('mlinkPorts').hidden,false);assert.equal(m.get('mlinkPortSelect').options.length,2);
  m.get('mlinkPortSelect').value='/dev/cu.RED';m.get('mlinkPortSelect').listeners.change({target:m.get('mlinkPortSelect')});
  assert.equal(m.counts().created,1);assert.equal(m.get('connectBoardBtn').textContent,'Odpojit');
  m.get('transportSelect').value='direct';m.get('transportSelect').listeners.change();
  assert.equal(m.get('uploadBtn').disabled,true);
  assert.equal(m.get('usbCompatibility').hidden,false);
  assert.equal(m.get('mlinkPorts').hidden,true);
  assert.equal(m.get('boardConnection').dataset.connected,'false');
}
{
  const m=model({serial:true});assert.equal(m.get('transportSelect').value,'direct');
  assert.equal(m.get('usbCompatibility').hidden,true);assert.equal(m.get('uploadBtn').disabled,false);
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.counts().portRequests,1);assert.equal(m.counts().lists,0);
  assert.equal(m.get('boardConnection').dataset.connected,'true');
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.get('boardConnection').dataset.connected,'false');
}
{
  const m=model({unavailable:true});enableBridge(m);await m.get('connectBoardBtn').listeners.click();
  assert.equal(m.get('uploadStatus').dataset.error,'true');assert.match(m.get('uploadStatus').textContent,/mLink/);assert.equal(m.get('connectBoardBtn').disabled,false);
  assert.equal(m.get('compilerDetails').hidden,true,'Do not repeat the generic status as technical details');
}
{
  const m=model({unavailable:true,technical:'Endpoint: http://127.0.0.1:55278/socket.io/\nError: xhr poll error'});enableBridge(m);
  await m.get('connectBoardBtn').listeners.click();
  assert.equal(m.get('compilerDetails').hidden,false);
  assert.match(m.get('compilerLog').textContent,/xhr poll error/);
  assert.notEqual(m.get('compilerLog').textContent,m.get('uploadStatus').textContent);
}
{
  const m=model();m.get('codeTab').listeners.click();m.get('arduinoSource').value='// manual source';
  m.get('downloadSourceBtn').listeners.click();assert.equal(await m.downloads.at(-1).text(),'// manual source');
  await m.get('importSourceInput').listeners.change({target:{files:[{size:20,text:async()=>'// imported source'}],value:'test.ino'}});
  assert.equal(m.get('codeTab').getAttribute('aria-selected'),'true');assert.equal(m.get('arduinoSource').value,'// imported source');
  m.get('blocksTab').listeners.click();m.get('downloadSourceBtn').listeners.click();
  assert.equal(await m.downloads.at(-1).text(),'void setup(){} void loop(){}','Source export follows the selected mode');
}
console.log('UI: direct USB default, unsupported-browser compilation/export, optional bridge recovery, stale HEX protection, source transfer and i18n passed.');
