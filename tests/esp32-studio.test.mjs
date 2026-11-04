import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import {BOARDS,boardById,MAX_IMAGE,validateFirmware} from "../esp32/boards.mjs";
import {codeKeyEdit,formatIndentation} from "../assets/js/arduino-source-editor.mjs";
import {firmwareFor} from "./esp32.test.mjs";
const source=(await fs.readFile(new URL("../esp32/studio.mjs",import.meta.url),"utf8")).replace(/^import .*;\n/gm,"");
const html=await fs.readFile(new URL("../esp32/index.html",import.meta.url),"utf8");
async function model({serial=true,available=[],flashError=null,disconnectPhase=null}={}){
  class El{
    constructor(id){this.id=id;this.value="";this.hidden=false;this.listeners={};this.dataset={};this.textContent="";this.selectionStart=0;this.selectionEnd=0;this.files=[];this.attributes={};}
    addEventListener(name,fn){this.listeners[name]=fn;}async emit(name,event={}){return this.listeners[name]?.(event);}
    async click(){return this.emit("click");}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
    setAttribute(k,v){this.attributes[k]=v;}removeAttribute(k){delete this.attributes[k];}
    querySelector(){return this.child||=new El("child");}
  }
  const els=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new El(m[1])]));
  const get=id=>{assert.ok(els.has(id),"Missing "+id);return els.get(id);};get("board").value="esp32";
  const saved=new Map(),serialEvents={},portRef={};let requests=0,uploads=0,builds=0;
  const sandbox={
    document:{documentElement:{lang:"cs",dataset:{}},getElementById:get,querySelectorAll:()=>[],createElement:()=>new El("download")},
    window:{isSecureContext:true},navigator:serial?{serial:{requestPort:async()=>{requests++;return portRef;},addEventListener(name,fn){serialEvents[name]=fn;}}}:{},
    localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},
    BOARDS,boardById,MAX_IMAGE,validateFirmware,codeKeyEdit,formatIndentation,
    compilerBoards:async()=>available,
    compile:async(text,target)=>{builds++;return {image:firmwareFor(boardById(target)),logs:[]};},
    flashFirmware:async(port,bytes,board,{onProgress,signal})=>{validateFirmware(bytes,board);uploads++;if(flashError)throw flashError;for(const [phase,percent] of [["write",94],["verify",95],["done",100]]){onProgress(phase,percent);if(phase===disconnectPhase)serialEvents.disconnect?.({port});signal.throwIfAborted();}},
    Uint8Array,DataView,AbortController,AbortSignal,Blob,URL,setTimeout,clearTimeout,console,
  };
  await vm.runInNewContext("(async()=>{"+source+"})()",sandbox);
  return {get,saved,counts:()=>({requests,uploads,builds})};
}
{
  const m=await model();
  assert.ok(!html.includes('id="compile"'));assert.ok(!html.includes('id="run"'));
  assert.ok(!source.includes('compilerBoards('),"Free Studio never requests a compilation server");
  m.get("source").value="my ESP32 source";await m.get("source").emit("input");
  m.get("board").value="esp32s3";await m.get("board").emit("change");
  assert.ok(!m.get("source").value.includes("my ESP32 source"));
  m.get("board").value="esp32";await m.get("board").emit("change");
  assert.equal(m.get("source").value,"my ESP32 source","Source is kept per target");
  const bytes=firmwareFor(boardById("esp32"));
  m.get("firmware").files=[{name:"app-only.bin",size:64,arrayBuffer:async()=>bytes.slice(0x10000).buffer}];
  await m.get("firmware").emit("change",{target:m.get("firmware")});
  assert.equal(m.get("flash").disabled,true);assert.equal(m.counts().requests,0);
  m.get("firmware").files=[{name:"complete.merged.bin",size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
  await m.get("firmware").emit("change",{target:m.get("firmware")});
  assert.equal(m.get("flash").disabled,false);
  await m.get("flash").click();assert.deepEqual(m.counts(),{requests:1,uploads:1,builds:0});
  assert.match(m.get("status").textContent,/ověřeno/);assert.equal(m.get("progress").value,100);
  m.get("board").value="esp32c3";await m.get("board").emit("change");
  assert.equal(m.get("flash").disabled,true,"A different board invalidates the selected image");
}
{
  const m=await model({serial:false});
  assert.equal(m.get("flash").disabled,true);assert.equal(m.get("saveSource").disabled,false);
  assert.deepEqual(m.counts(),{requests:0,uploads:0,builds:0});
}
{
  const m=await model({flashError:Error("MD5 mismatch")}),bytes=firmwareFor(boardById("esp32"));
  m.get("firmware").files=[{name:"firmware.bin",size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
  await m.get("firmware").emit("change",{target:m.get("firmware")});await m.get("flash").click();
  assert.equal(m.get("status").dataset.error,"true");assert.equal(m.get("progress").hidden,true);
  assert.equal(m.get("flash").disabled,false,"Failed upload releases the controls");
}
console.log("Studio UI: independent source per board, no compilation server, valid/invalid files, no accidental builds, local source storage, USB compatibility and error recovery passed.");

for(const phase of ["write","verify"]) {
  const m=await model({disconnectPhase:phase}),bytes=firmwareFor(boardById("esp32"));
  m.get("firmware").files=[{name:"firmware.bin",size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
  await m.get("firmware").emit("change",{target:m.get("firmware")});await m.get("flash").click();
  assert.equal(m.get("status").dataset.error,String(phase==="write"),"Only the expected disconnect during verified native USB reset may complete");
}
const messages=vm.runInNewContext("("+source.match(/const copy=(\{[\s\S]*?\n\});/)[1]+")");
for(const match of html.matchAll(/data-(?:copy|aria)="([^"]+)"/g)) {
  assert.ok(Array.isArray(messages[match[1]]),"Translation: "+match[1]);
  assert.equal(messages[match[1]].length,2);
}
console.log("Native USB reset, interrupted writes and all Czech/English interface strings passed.");
