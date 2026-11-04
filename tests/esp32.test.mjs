import assert from "node:assert/strict";
import {BOARDS,boardById,validateFirmware} from "../esp32/boards.mjs";
import {flashFirmware} from "../esp32/flasher.mjs";
import {compilerBoards,compile} from "../esp32/compiler.mjs";
export function firmwareFor(board){
  const bytes=new Uint8Array(0x11000).fill(255),v=new DataView(bytes.buffer);
  for(const p of [board.boot,0x10000]){bytes[p]=0xe9;bytes[p+1]=1;v.setUint16(p+12,board.imageId,true);}
  v.setUint16(0x8000,0x50aa,true);bytes[0x8002]=0;bytes[0x8003]=0;v.setUint32(0x8004,0x10000,true);v.setUint32(0x8008,0x300000,true);return bytes;
}
for(const board of BOARDS){
  assert.equal(validateFirmware(firmwareFor(board),board).length,0x11000);
  assert.throws(()=>validateFirmware(firmwareFor(board).slice(0x10000),board),/IMAGE_FORMAT/,"An app-only image must never overwrite the bootloader");
  const other=BOARDS.find(b=>b.imageId!==board.imageId);
  assert.throws(()=>validateFirmware(firmwareFor(other),board),/IMAGE_CHIP/);
}
assert.equal(BOARDS.length,11);assert.equal(boardById("esp8266"),null);
const b=boardById("esp32s3"),image=firmwareFor(b),events=[];
let opens=0,writes=0,closes=0,resets=0,chip=9,size="4MB",writeError=null,options;
const tools=async()=>({
  Transport:class{async disconnect(){closes++;}},
  ESPLoader:class{
    constructor(){this.chip={IMAGE_CHIP_ID:chip,CHIP_NAME:"ESP32-S3"};}
    async main(){opens++;}async detectFlashSize(){return size;}
    flashSizeBytes(){return 4*1024*1024;}async usesUsbOtg(){return true;}
    async after(mode,native){assert.equal(mode,"hard_reset");assert.equal(native,true);resets++;}
    async writeFlash(value){writes++;options=value;if(writeError)throw writeError;value.reportProgress(0,100,100);}
  },md5:()=> "md5",
});
await flashFirmware({},image,b,{tools,onProgress:(...e)=>events.push(e)});
assert.equal(writes,1);assert.equal(closes,1);assert.equal(resets,1);
assert.equal(options.eraseAll,false);assert.equal(options.flashSize,"keep");assert.equal(options.fileArray[0].address,0);
assert.equal(typeof options.calculateMD5Hash,"function");assert.deepEqual(events.at(-1),["done",100]);assert.equal(events.find(e=>e[0]==="write")[1],94);
chip=5;await assert.rejects(flashFirmware({},image,b,{tools}),/WRONG_CHIP/);assert.equal(writes,1);
chip=9;size=undefined;await assert.rejects(flashFirmware({},image,b,{tools}),/FLASH_SIZE/);assert.equal(writes,1);
size="4MB";writeError=Error("MD5 mismatch");await assert.rejects(flashFirmware({},image,b,{tools}),/MD5 mismatch/);assert.equal(resets,1);
writeError=null;const ac=new AbortController();ac.abort();const before=opens;
await assert.rejects(flashFirmware({},image,b,{tools,signal:ac.signal}));assert.equal(opens,before);
await assert.rejects(flashFirmware({},new Uint8Array(8),b,{tools}),/IMAGE_FORMAT/);assert.equal(opens,before);
// Abort while waiting for bootloader must close the transport and never write.
const midAbort=new AbortController();
await assert.rejects(flashFirmware({},image,b,{signal:midAbort.signal,tools:async()=>({...await tools(),ESPLoader:class{
  constructor(){this.chip={IMAGE_CHIP_ID:9};}async main(){midAbort.abort();}
}})}));assert.equal(writes,2);
const response=(data,status=200,type="application/json")=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":type}});
assert.deepEqual(await compilerBoards({request:async()=>response({},404)}),[]);
assert.deepEqual(await compilerBoards({request:async()=>response({},200,"text/html")}),[]);
assert.deepEqual(await compilerBoards({request:async()=>response({protocol:"shieldio-esp32-v1",boards:["esp32s3","esp32c2","wrong"]})}),["esp32s3"]);
let requested;
const built=await compile("void setup(){} void loop(){}","esp32s3",{request:async(url,init)=>{requested={url,init};return response({protocol:"shieldio-esp32-v1",board:"esp32s3",image:Buffer.from(image).toString("base64")});}});
assert.deepEqual(built.image,image);assert.equal(requested.url,"/api/esp32/compile");assert.equal(JSON.parse(requested.init.body).board,"esp32s3");
await assert.rejects(compile("source","esp32c2"),/NO_COMPILER/);
await assert.rejects(compile("source","esp32s3",{request:async()=>response({protocol:"shieldio-esp32-v1",board:"esp32c3",image:""})}),/IMAGE_FORMAT/);
await assert.rejects(compile("source","esp32s3",{request:async()=>response({error:"COMPILE_ERROR",details:"sketch.ino:1: error"},422)}),e=>e.message==="COMPILE_ERROR"&&e.details.includes("sketch.ino"));
console.log("ESP32: all 11 profiles, wrong chip/app-only rejection, capacity, MD5 failure, cancellation, USB cleanup and compiler protocol passed.");
