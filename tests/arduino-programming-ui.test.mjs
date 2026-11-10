// Behavior tests using a minimal DOM model; no browser, hardware or network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { Blob } from 'node:buffer';
import { importLibrary, validateLibraries } from '../assets/js/arduino-libraries.mjs';
import * as sourceEditor from '../assets/js/arduino-source-editor.mjs';
import { SerialMonitor } from '../assets/js/arduino-serial-monitor.mjs';
import { SerialPlotter, drawSerialPlot, PLOT_COLORS } from '../assets/js/arduino-serial-plotter.mjs';
import * as diagnostics from '../assets/js/arduino-diagnostics.mjs';
const html=await fs.readFile(new URL('../instructions/blokovy-editor.html',import.meta.url),'utf8');
const source=(await fs.readFile(new URL('../assets/js/arduino-programming.mjs',import.meta.url),'utf8')).replace(/^import .+;\n/gm,'').replaceAll('import.meta.url','"https://shieldio.cz/assets/js/arduino-programming.mjs"');
const dictionary=JSON.parse(await fs.readFile(new URL('../assets/data/i18n.json',import.meta.url),'utf8'));
for(const key of [...html.matchAll(/data-i18n(?:-title|-aria-label)?="([^"]+)"/g)].map(m=>m[1])) assert.ok(dictionary[key],key);
function model({mockPort=null,confirmReset=true,serial=false,portError=null,savedSource="",search="",exampleText="void setup(){} void loop(){}",exampleFailure=false,flashSuccess=false,compileError=null,compileResult={}}={}){
  const elements=new Map();
  class Element{
    constructor(id){this.id=id;this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.attributes={};this.listeners={};this.options=[];this.children=[];this.style={};this.selectionStart=0;this.selectionEnd=0;this.classList={toggle(){}};}
    addEventListener(name,fn){this.listeners[name]=fn;}
    getAttribute(name){return this.attributes[name]??null;}
    setAttribute(name,value){this.attributes[name]=value;}
    removeAttribute(name){delete this.attributes[name];}
    replaceChildren(...options){this.options=options;this.children=options;this.value='';}
    add(option){this.options.push(option);}
    append(...nodes){this.children.push(...nodes);}
    dispatchEvent(event){return this.listeners[event.type]?.(event);}
    setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}
    focus(){}
    click(){return this.listeners.click?.();}
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element(match[1]));
  const get=id=>{assert.ok(elements.has(id),'Missing HTML element '+id);return elements.get(id);};
  get('blocksTab').attributes['aria-selected']='true';get('codeTab').attributes['aria-selected']='false';
  let portRequests=0,compilations=0,fetches=0,uploads=0;
  const progressStates=[],downloads=[],buildMessages=[],windowEvents={},documentEvents={},storage=new Map([["shieldio-source-v1",savedSource]]);
  let blockSource="void setup(){} void loop(){}",cleared=0,persisted=0,reloads=0,confirmations=0;
  const navigator=serial?{serial:{async requestPort(){portRequests++;if(portError)throw portError;return mockPort || {direct:true};},addEventListener(){}}}:{};
  const window={confirm(){confirmations++;return confirmReset;},location:{search,pathname:"/instructions/blokovy-editor",reload(){reloads++;}},isSecureContext:true,SHIELDIO_EDITOR:{hasContent:()=>blockSource!=="void setup(){} void loop(){}",clear(){cleared++;blockSource="void setup(){} void loop(){}";},persist(){persisted++;},getCode:()=>blockSource,getError:()=>null,resize(){}},addEventListener(name,handler){windowEvents[name]=handler;}};
  const context=vm.createContext({
    window,navigator,document:{addEventListener(name,handler){documentEvents[name]=handler;},body:{classList:{toggle(){}}},documentElement:{lang:'cs'},getElementById:get,createElement:()=>new Element('generated')},
    MutationObserver:class{observe(){}},
    localStorage:{getItem:key=>storage.get(key) || null,setItem:(key,value)=>storage.set(key,value)},
    async fetch(url){fetches++;assert.match(String(url),/^https:\/\/shieldio.cz\/assets\/code\/(?:digitalni_metr|ultrazvukovy_radar)\//);return {ok:!exampleFailure,text:async()=>exampleText};},
    SerialMonitor,SerialPlotter,drawSerialPlot,PLOT_COLORS,importLibrary,validateLibraries,...sourceEditor,...diagnostics,Event:class{constructor(type){this.type=type;}},
    AbortController,URLSearchParams,Blob,console,setTimeout,clearTimeout,NANO_FLASH_BYTES:30720,
    URL:class extends URL {static createObjectURL(blob){downloads.push(blob);return 'blob:test';}static revokeObjectURL(){}},
    Worker:class {
      postMessage(data){buildMessages.push(data);compilations++;Promise.resolve().then(()=>this.onmessage({data:compileError?{error:compileError}:{result:{fitsTarget:true,flashBytes:2,ramBytes:0,hex:':test',stderr:[],...compileResult}}}));}
      terminate(){}
    },
    parseHex(){},async flashNano(port,hex,options){assert.ok(!port.readable?.locked,'Monitor reader must release the port before upload');assert.ok(!port.opened,'Monitor must close the port before upload');if(!flashSuccess)throw Error('Discovery must not flash hardware');uploads++;for(const [phase,percent] of [['reset',0],['write',50],['write',100],['verify',0],['verify',100],['done',100]]){options.onProgress(phase,percent);progressStates.push({phase,value:get('uploadProgress').value,label:get('uploadPercent').textContent});}}
  });
  vm.runInContext(source,context,{filename:'arduino-programming.mjs'});
  return {get,progressStates,downloads,buildMessages,windowEvents,storage,setLanguage(lang){context.document.documentElement.lang=lang;documentEvents["shieldio-lang-change"]?.();},setBlockSource(value){blockSource=value;},actions:()=>({cleared,persisted,reloads,confirmations}),counts:()=>({portRequests,compilations,fetches,uploads})};
}
{
  const m=model(),button=m.get('toggleToolsBtn');
  assert.equal(button.textContent,dictionary['programming.tools'].cs);
  button.click();assert.equal(button.textContent,dictionary['programming.simpleMode'].cs);
  assert.equal(button.getAttribute('aria-expanded'),'true');
  assert.equal(button.getAttribute('data-i18n'),'programming.simpleMode');
  m.setLanguage('en');assert.equal(button.textContent,dictionary['programming.simpleMode'].en);
  button.click();assert.equal(button.textContent,dictionary['programming.tools'].en);
  assert.equal(button.getAttribute('aria-expanded'),'false');
  m.get('codeTab').click();assert.equal(button.textContent,dictionary['programming.simpleMode'].en);
  m.setLanguage('cs');assert.equal(button.textContent,dictionary['programming.simpleMode'].cs);
  button.click();assert.equal(button.textContent,dictionary['programming.tools'].cs);
  assert.equal(m.get('blocksTab').getAttribute('aria-selected'),'true');
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
  assert.equal(m.get('uploadBtn').getAttribute('aria-describedby'),'uploadStatus','Supported upload must not announce the hidden unsupported-browser instructions');
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.counts().portRequests,1);
  assert.equal(m.get('boardConnection').dataset.connected,'true');
  await m.get('connectBoardBtn').listeners.click();assert.equal(m.get('boardConnection').dataset.connected,'false');
}
{
  const error=Error('User cancelled');error.name='NotFoundError';
  const m=model({serial:true,portError:error});await m.get('connectBoardBtn').listeners.click();
  assert.equal(m.get('uploadStatus').dataset.error,'false');
  assert.equal(m.get('uploadStatus').textContent,'Deska nebyla vybraná. Zkus Spustit na desce znovu a vyber její USB port.');
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
{
  const m=model();await m.get('compileBtn').listeners.click();
  assert.equal(m.get('downloadHexBtn').disabled,false);
  const files=[{webkitRelativePath:'MyLib/src/MyLib.h',name:'MyLib.h',size:20,text:async()=> '#pragma once\nint answer();'},{webkitRelativePath:'MyLib/src/MyLib.cpp',name:'MyLib.cpp',size:30,text:async()=> 'int answer(){return 42;}'}];
  await m.get('libraryFolderInput').listeners.change({target:{files,value:'library'}});
  assert.equal(m.get('downloadHexBtn').disabled,true,'Library change invalidates HEX even for unchanged sketch');
  await m.get('compileBtn').listeners.click();
  assert.equal(m.buildMessages.at(-1).libraries[0].name,'MyLib');
  assert.equal(m.buildMessages.at(-1).libraries[0].files.length,2);
  m.get('focusEditorBtn').listeners.click();assert.equal(m.get('focusEditorBtn').getAttribute('aria-pressed'),'true');
  m.windowEvents.keydown({key:'Escape'});assert.equal(m.get('focusEditorBtn').getAttribute('aria-pressed'),'false');
  m.get('arduinoSource').value='test';m.get('arduinoSource').selectionStart=4;m.get('arduinoSource').selectionEnd=4;
  m.get('arduinoSource').listeners.keydown({key:'Tab',shiftKey:false,preventDefault(){}});
  assert.equal(m.get('arduinoSource').value,'test  ');
}
{
  const m=model({savedSource:'// restored code'});m.get('codeTab').listeners.click();assert.equal(m.get('arduinoSource').value,'// restored code');
  m.get('arduinoSource').value='// changed code';m.get('arduinoSource').listeners.input();assert.equal(m.storage.get('shieldio-source-v1'),'// changed code');
}
{
  const m=model({savedSource:'// my manual project',search:'?example=digitalni_metr',exampleText:'void setup(){pinMode(5,OUTPUT);} void loop(){}'});
  await new Promise(r=>setTimeout(r,0));
  assert.equal(m.get('codeTab').getAttribute('aria-selected'),'true');assert.match(m.get('arduinoSource').value,/pinMode/);
  assert.equal(m.storage.get('shieldio-source-v1'),'// my manual project','Opening an example preserves the existing manual program');
  assert.match(m.storage.get('shieldio-source-v1:example:digitalni_metr'),/pinMode/);
}
{
  const m=model({search:'?example=../../private'});assert.equal(m.counts().fetches,0,'Unknown examples never trigger a fetch');
  const failure=model({search:'?example=digitalni_metr',exampleFailure:true});await new Promise(r=>setTimeout(r,0));
  assert.equal(failure.get('uploadStatus').dataset.error,'true');assert.equal(failure.get('compileBtn').disabled,false,'A failed example load releases the UI');
}
console.log('UI: direct USB default, unsupported-browser compilation/export, port cancellation and error recovery, stale HEX protection, source transfer and i18n passed.');



// Checking prepares a file; only a verified upload may invite observation on the board.
{
  const m=model({serial:true,search:'?preset=blikani',flashSuccess:true});
  assert.equal(m.get('projectTitle').textContent,'Rozblikej zelenou LED.');
  await m.get('compileBtn').listeners.click();
  assert.equal(m.counts().portRequests,0);
  assert.equal(m.counts().uploads,0);
  assert.equal(m.get('uploadStatus').textContent,'Zkompilováno');
  assert.equal(m.get('projectNext').hidden,true);
  assert.ok(!m.get('projectNext').textContent.includes('LED bliká'));
  await m.get('uploadBtn').listeners.click();
  assert.equal(m.counts().compilations,1,'One upload action reuses a current successful check');
  assert.equal(m.counts().portRequests,1);assert.equal(m.counts().uploads,1);
  assert.match(m.get('uploadStatus').textContent,/Nahráno/);
  assert.equal(m.get('projectNext').textContent,'');
  m.setBlockSource('changed');m.get('arduinoSource').listeners.input();
  assert.equal(m.get('projectNext').hidden,true,'An old upload result is no longer guidance for changed code');
  m.get('codeTab').listeners.click();assert.equal(m.get('programmingStudio').dataset.tools,'open');
  m.get('toggleToolsBtn').listeners.click();assert.equal(m.get('programmingStudio').dataset.tools,'closed');
  assert.equal(m.get('blocksTab').getAttribute('aria-selected'),'true');
}
{
  const m=model({serial:true,flashSuccess:true,search:'?preset=parkovani'});
  await m.get('uploadBtn').listeners.click();
  assert.deepEqual(m.counts(),{portRequests:1,compilations:1,fetches:0,uploads:1},'One learner action selects, prepares and uploads');
  assert.equal(m.get('projectNext').hidden,true);
  m.windowEvents['shieldio:project-import']();assert.equal(m.get('projectTitle').textContent,'Programování RED');
}

// Compiler failures stay visible, select the correct line, and never edit code
// or touch hardware until the visitor explicitly chooses an action.
{
  const sketch='void setup() {}\nvoid loop() {\n  digitalWrite(LED_GREEN, LOW;\n}';
  const column=sketch.split('\n')[2].indexOf(';')+1;
  const message=`[cc1plus] shieldio.ino:3:${column}: error: expected ')' before ';' token`;
  const m=model({savedSource:sketch,compileError:message+'\n'+message});
  m.get('codeTab').listeners.click();
  await m.get('compileBtn').listeners.click();
  assert.equal(m.get('compilerErrors').hidden,false);
  assert.equal(m.get('compilerErrorList').children.length,1,'Do not duplicate an identical compiler diagnostic');
  assert.equal(m.get('arduinoSource').value,sketch,'Reporting a diagnostic never silently fixes the program');
  assert.equal(m.get('arduinoSource').attributes['aria-invalid'],'true');
  const actions=m.get('compilerErrorList').children[0].children.find(el=>el.className==='programming-error-actions');
  actions.children[0].click();
  assert.equal(m.get('arduinoSource').selectionStart,sketch.indexOf(';'));
  actions.children[1].click();
  assert.ok(m.get('arduinoSource').value.includes('digitalWrite(LED_GREEN, LOW);'));
  assert.equal(m.get('compilerErrors').hidden,true,'The previous diagnostic is retired when the source changes');
  assert.equal(m.counts().uploads,0);assert.equal(m.counts().portRequests,0);
  assert.equal(m.counts().compilations,1,'A suggested patch does not compile or upload automatically');
  assert.match(m.get('uploadStatus').textContent,/Závorka je doplněná/);
  m.get('arduinoSource').value='void loop(){\ndelay(1);\n}';
  m.get('formatSourceBtn').click();
  assert.equal(m.get('arduinoSource').value,'void loop(){\n  delay(1);\n}');
  assert.equal(m.storage.get('shieldio-source-v1'),m.get('arduinoSource').value);
}
console.log('Compiler error UI: visible deduplicated errors, exact line navigation, explicit guarded patch, stale marker cleanup and formatter autosave passed.');

// Upload progress stays monotonic through write + verify, and success remains visible.
{
  const m=model({serial:true,flashSuccess:true,compileResult:{flashBytes:15360,ramBytes:426,oledBufferBytes:1024}});
  await m.get('uploadBtn').click();
  assert.equal(m.get('uploadStatus').textContent,'Nahráno');
  assert.equal(m.get('uploadProgress').hidden,false);assert.equal(m.get('uploadProgress').value,100);
  assert.equal(m.get('uploadPercent').textContent,'100 %');
  assert.deepEqual(m.progressStates.slice(1).map(x=>x.value),[25,50,50,100,100]);
  assert.equal(m.get('memoryUsage').hidden,false);
  assert.equal(m.get('flashUsage').value,15360);assert.equal(m.get('flashPercent').textContent,'50 %');
  assert.equal(m.get('ramUsage').value,1450);assert.equal(m.get('ramPercent').textContent,'71 %');
  assert.equal(m.get('ramLabel').textContent,'RAM · data + OLED');
  assert.equal(m.get('projectNext').textContent,'');
  m.setLanguage('en');assert.equal(m.get('uploadStatus').textContent,'Uploaded');
  m.setBlockSource('edited');m.get('arduinoSource').listeners.input();
  assert.equal(m.get('memoryUsage').hidden,true,'Memory from an old program must not describe the edited one');
  assert.equal(m.get('uploadProgress').hidden,false,'Progress remains visible after an edit');assert.equal(m.get('uploadProgress').value,0);
}
{
  const m=model({compileError:'FLASH_OVERFLOW'});await m.get('compileBtn').click();
  assert.equal(m.get('memoryUsage').hidden,true);assert.equal(m.get('uploadProgress').hidden,false);assert.equal(m.get('uploadProgress').value,0);
}
console.log('Result UI: continuous verified upload progress, persistent completion, Flash/static RAM + OLED usage, translation and stale result cleanup passed.');

{
 const m=model({confirmReset:false});m.setBlockSource('changed');
 m.get('newProjectBtn').click();m.get('clearProjectBtn').click();
 assert.equal(m.actions().cleared,0,'Declining preserves the project');
}
{
 const m=model();m.setBlockSource('changed');m.get('clearProjectBtn').click();
 assert.equal(m.actions().cleared,1);assert.equal(m.get('uploadProgress').value,0);
 m.get('codeTab').click();m.get('arduinoSource').value='edited';m.get('clearProjectBtn').click();
 assert.ok(m.storage.get('shieldio-source-v1').includes('void setup()'));
 m.get('newProjectBtn').click();assert.equal(m.get('blocksTab').attributes['aria-selected'],'true');
 m.get('reloadEditorBtn').click();assert.equal(m.actions().persisted,1);assert.equal(m.actions().reloads,1);
}
{
 const m=model();assert.equal(m.get('uploadProgress').hidden,false);
 await m.get('compileBtn').click();
 assert.equal(m.get('uploadProgress').value,100);assert.equal(m.get('stageCompile').dataset.state,'done');
 assert.equal(m.get('stageWrite').dataset.state,'idle');
}
console.log('Project actions: guarded reset, source persistence and reload; persistent phase progress passed.');

// The monitor shares the selected port; upload must pause it, close, then resume.
{
  const port = {
    opened: false, opens: 0, closes: 0,
    async open(options) {
      assert.equal(this.opened, false); this.opened = true; this.opens++; this.baud = options.baudRate;
      this.readable = new ReadableStream({ start: controller => { this.input = controller; } });
    },
    async close() { assert.equal(this.readable.locked, false); this.opened = false; this.closes++; }
  };
  const m = model({ serial: true, mockPort: port, flashSuccess: true });
  m.get('serialBaud').value = '115200';
  await m.get('serialConnectBtn').click();
  assert.equal(m.counts().portRequests, 1); assert.equal(port.baud, 115200);
  assert.equal(m.get('serialBaud').disabled, true);
  assert.equal(m.get('serialConnectBtn').textContent, 'Zastavit příjem');
  port.input.enqueue(new TextEncoder().encode('<script>data</script>\n' + 'x'.repeat(70000) + '\nA:10 B:20\nA:20 B:10\n'));
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(m.get('serialOutput').textContent.length, 65536, 'Serial output stays bounded');
  m.get('serialClearBtn').click(); assert.equal(m.get('serialOutput').textContent, '');
  m.get('plotPauseBtn').click();
  assert.match(m.get('plotStatus').textContent, /2 vzorků/);
  assert.equal(m.get('plotLegend').children.length, 2, 'Named series share the serial stream');
  assert.equal(m.get('plotPauseBtn').textContent, 'Pokračovat v grafu');
  m.get('plotPauseBtn').click();
  m.get('plotClearBtn').click();
  assert.match(m.get('plotStatus').textContent, /0 vzorků/);
  await m.get('uploadBtn').listeners.click();
  assert.equal(m.counts().uploads, 1); assert.equal(m.counts().portRequests, 1, 'Reuse the selected port');
  assert.equal(port.closes, 1); assert.equal(port.opens, 2, 'Receiving resumes after upload');
  assert.equal(m.get('uploadStatus').textContent, 'Nahráno');
  await m.get('connectBoardBtn').click();
  assert.equal(port.opened, false); assert.equal(m.get('boardConnection').dataset.connected, 'false');
  assert.equal(m.get('serialBaud').disabled, false);
}
{
  const m = model(); assert.equal(m.get('serialConnectBtn').disabled, true);
  await m.get('serialConnectBtn').click(); assert.equal(m.counts().portRequests, 0);
}
console.log('Serial UI: bounded output, baud control, shared port, upload handoff/resume and unsupported browser passed.');

