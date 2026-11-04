import {validateFirmware} from "./boards.mjs";
const loadTools=async()=>{
  const [esp,hash]=await Promise.all([
    import("https://cdn.jsdelivr.net/npm/esptool-js@0.7.0/+esm"),
    import("https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/+esm"),
  ]);
  return {...esp,md5:bytes=>hash.default.ArrayBuffer.hash(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))};
};
export async function flashFirmware(port,bytes,board,{signal,onProgress=()=>{},onLog=()=>{},tools=loadTools}={}) {
  validateFirmware(bytes,board);
  signal?.throwIfAborted();
  const {Transport,ESPLoader,md5}=await tools();
  signal?.throwIfAborted();
  const transport=new Transport(port);
  let closing;
  const abort=()=>{closing=transport.disconnect().catch(()=>{});};
  signal?.addEventListener("abort",abort,{once:true});
  try {
    const loader=new ESPLoader({transport,baudrate:115200,terminal:{clean(){},write:onLog,writeLine:onLog}});
    onProgress("connect",null);
    await loader.main();
    signal?.throwIfAborted();
    if(loader.chip.IMAGE_CHIP_ID!==board.imageId)throw Error("WRONG_CHIP");
    const size=await loader.detectFlashSize();
    if(!size||bytes.length>loader.flashSizeBytes(size))throw Error("FLASH_SIZE");
    await loader.writeFlash({
      fileArray:[{data:bytes,address:0}],flashMode:"keep",flashFreq:"keep",flashSize:"keep",
      eraseAll:false,compress:true,calculateMD5Hash:md5,
      reportProgress:(_file,written,total)=>{signal?.throwIfAborted();onProgress("write",Math.min(94,written/total*94));},
    });
    signal?.throwIfAborted();
    // With calculateMD5Hash esptool verifies the written image before resolving.
    onProgress("verify",95);
    await loader.after("hard_reset",await loader.usesUsbOtg());
    signal?.throwIfAborted();
    onProgress("done",100);
    return loader.chip.CHIP_NAME;
  } finally {
    signal?.removeEventListener("abort",abort);
    if(closing)await closing;
    await transport.disconnect().catch(()=>{});
  }
}
