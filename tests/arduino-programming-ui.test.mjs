// Behavior tests using a minimal DOM model; no browser, hardware or network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { Blob } from 'node:buffer';
const html=await fs.readFile(new URL('../instructions/blokovy-editor.html',import.meta.url),'utf8');
const source=(await fs.readFile(new URL('../assets/js/arduino-programming.mjs',import.meta.url),'utf8')).replace(/^import .+;\n/gm,'').replaceAll('import.meta.url','"https://shieldio.cz/assets/js/arduino-programming.mjs"');
const dictionary=JSON.parse(await fs.readFile(new URL('../assets/data/i18n.json',import.meta.url),'utf8'));
for(const key of [...html.matchAll(/data-i18n(?:-title|-aria-label)?="([^"]+)"/g)].map(m=>m[1])) assert.ok(dictionary[key],key);
function model({serial=false,portError=null}={}){
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
  let portRequests=0,compilations=0;
  const downloads=[];
  let blockSource="void setup(){} void loop(){}";
  const navigator=serial?{serial:{async requestPort(){portRequests++;if(portError)throw portError;return {direct:true};},addEventListener(){}}}:{};
  const window={isSecureContext:true,SHIELDIO_EDITOR:{getCode:()=>blockSource,getError:()=>null,resize(){}},addEventListener(){}};
  const context=vm.createContext({
    window,navigator,document:{documentElement:{lang:'cs'},getElementById:get,createElement:()=>new Element('generated')},
    MutationObserver:class{observe(){}},
    AbortController,Blob,console,setTimeout,clearTimeout,NANO_FLASH_BYTES:30720,
    URL:class extends URL {static createObjectURL(blob){downloads.push(blob);return 'blob:test';}static revokeObjectURL(){}},
    Worker:class {
      postMessage(){compilations++;Promise.resolve().then(()=>this.onmessage({data:{result:{fitsTarget:true,flashBytes:2,ramBytes:0,hex:':test',stderr:[]}}}));}
      terminate(){}
    },
    parseHex(){},flashNano(){throw Error('Discovery must not flash hardware');}
  });
  vm.runInContext(source,context,{filename:'arduino-programming.mjs'});
  return {get,downloads,setBlockSource(value){blockSource=value;},counts:()=>({portRequests,compilations})};
}
{
  const m=model();
  assert.equal(m.get('uploadBtn').disabled,true);
  assert.equal(m.get('connectBoardBtn').disabled,true);
  assert.equal(m.get('compileBtn').disabled,false);
  assert.equal(m.get('usbCompatibility').hidden,false);
  await m.get('uploadBtn').listeners.click();
  assert.equal(m.counts().portRequests,0,'Unsupported upload must not request a port');
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
  const m=model({serial:true});
  assert.equal(m.get('usbCompatibility').hidden,true);assert.equal(m.get('uploadBtn').disabled,false);
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.counts().portRequests,1);
  assert.equal(m.get('boardConnection').dataset.connected,'true');
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.get('boardConnection').dataset.connected,'false');
}
{
  const error=Error('User cancelled');error.name='NotFoundError';
  const m=model({serial:true,portError:error});await m.get('connectBoardBtn').listeners.click();
  assert.equal(m.get('uploadStatus').dataset.error,'false');
  assert.equal(m.get('uploadStatus').textContent,'Nebyla vybrána žádná deska.');
  assert.equal(m.get('connectBoardBtn').disabled,false);
  assert.equal(m.get('boardConnection').dataset.connected,'false');
}
{
  const m=model({serial:true,portError:Error('Port access denied')});
  await m.get('connectBoardBtn').listeners.click();
  assert.equal(m.get('uploadStatus').dataset.error,'true');
  assert.equal(m.get('compilerDetails').hidden,false);
  assert.equal(m.get('compilerLog').textContent,'Port access denied');
  assert.equal(m.get('connectBoardBtn').disabled,false,'Failure releases busy state');
}
{
  const m=model();m.get('codeTab').listeners.click();m.get('arduinoSource').value='// manual source';
  m.get('downloadSourceBtn').listeners.click();assert.equal(await m.downloads.at(-1).text(),'// manual source');
  await m.get('importSourceInput').listeners.change({target:{files:[{size:20,text:async()=>'// imported source'}],value:'test.ino'}});
  assert.equal(m.get('codeTab').getAttribute('aria-selected'),'true');assert.equal(m.get('arduinoSource').value,'// imported source');
  m.get('blocksTab').listeners.click();m.get('downloadSourceBtn').listeners.click();
  assert.equal(await m.downloads.at(-1).text(),'void setup(){} void loop(){}','Source export follows the selected mode');
}
console.log('UI: direct USB default, unsupported-browser compilation/export, port cancellation and error recovery, stale HEX protection, source transfer and i18n passed.');

