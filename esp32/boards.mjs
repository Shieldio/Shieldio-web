// Pinned to esptool-js 0.7.0 / Arduino-ESP32 3.3.12.
export const BOARDS=Object.freeze([
  {id:"esp32",name:"ESP32 · Dev Module",chip:"ESP32",imageId:0,boot:0x1000,fqbn:"esp32:esp32:esp32"},
  {id:"esp32s2",name:"ESP32-S2",chip:"ESP32-S2",imageId:2,boot:0x1000,fqbn:"esp32:esp32:esp32s2"},
  {id:"esp32s3",name:"ESP32-S3",chip:"ESP32-S3",imageId:9,boot:0,fqbn:"esp32:esp32:esp32s3"},
  {id:"esp32c2",name:"ESP32-C2",chip:"ESP32-C2",imageId:12,boot:0,fqbn:null},
  {id:"esp32c3",name:"ESP32-C3",chip:"ESP32-C3",imageId:5,boot:0,fqbn:"esp32:esp32:esp32c3"},
  {id:"esp32c5",name:"ESP32-C5",chip:"ESP32-C5",imageId:23,boot:0x2000,fqbn:"esp32:esp32:esp32c5"},
  {id:"esp32c6",name:"ESP32-C6",chip:"ESP32-C6",imageId:13,boot:0,fqbn:"esp32:esp32:esp32c6"},
  {id:"esp32c61",name:"ESP32-C61",chip:"ESP32-C61",imageId:20,boot:0,fqbn:null},
  {id:"esp32h2",name:"ESP32-H2",chip:"ESP32-H2",imageId:16,boot:0,fqbn:"esp32:esp32:esp32h2"},
  {id:"esp32p4",name:"ESP32-P4",chip:"ESP32-P4",imageId:18,boot:0x2000,fqbn:"esp32:esp32:esp32p4"},
  {id:"nano-esp32",name:"Arduino Nano ESP32 · S3",chip:"ESP32-S3",imageId:9,boot:0,fqbn:"esp32:esp32:nano_nora"},
].map(Object.freeze));
export const boardById=id=>BOARDS.find(b=>b.id===id)||null;
export const MAX_IMAGE=32*1024*1024;
const header=(b,p,id)=>p+24<=b.length&&b[p]===0xe9&&b[p+1]>0&&b[p+1]<=16&&(b[p+12]|b[p+13]<<8)===id;
// Only complete Arduino merged images based at zero. App-only binaries must
// never overwrite a bootloader. Custom partition offsets need their own tool.
export function validateFirmware(bytes,board) {
  if(!board||!(bytes instanceof Uint8Array)||bytes.length<0x10000||bytes.length>MAX_IMAGE)throw Error("IMAGE_FORMAT");
  if(!header(bytes,board.boot,board.imageId))throw Error("IMAGE_CHIP");
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const apps=[];
  for(let p=0x8000;p+32<=Math.min(0x9000,bytes.length);p+=32) {
    if(view.getUint16(p,true)!==0x50aa)break;
    const offset=view.getUint32(p+4,true),size=view.getUint32(p+8,true);
    if(offset%4096||!size||offset+size>MAX_IMAGE)throw Error("IMAGE_FORMAT");
    if(bytes[p+2]===0)apps.push(offset);
  }
  if(!apps.some(offset=>header(bytes,offset,board.imageId)))throw Error("IMAGE_FORMAT");
  return bytes;
}
