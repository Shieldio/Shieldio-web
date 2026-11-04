import {boardById,MAX_IMAGE,validateFirmware} from "./boards.mjs";
export async function compilerBoards({signal,request=fetch}={}) {
  try {
    const r=await request("/api/esp32/status",{signal,cache:"no-store",headers:{Accept:"application/json"}});
    if(!r.ok||!r.headers.get("content-type")?.includes("application/json"))return [];
    const body=await r.json();
    return body.protocol==="shieldio-esp32-v1"&&Array.isArray(body.boards)?body.boards.filter(id=>boardById(id)?.fqbn):[];
  }catch{return [];}
}
export async function compile(source,boardId,{signal,request=fetch}={}) {
  const board=boardById(boardId);
  if(!board?.fqbn)throw Error("NO_COMPILER");
  const r=await request("/api/esp32/compile",{method:"POST",signal,headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({protocol:"shieldio-esp32-v1",board:boardId,source})});
  if(!r.headers.get("content-type")?.includes("application/json"))throw Error("NO_COMPILER");
  const body=await r.json();
  if(!r.ok){const error=Error(body.error==="COMPILE_ERROR"?"COMPILE_ERROR":"NO_COMPILER");error.details=String(body.details||"").slice(0,60000);throw error;}
  if(body.protocol!=="shieldio-esp32-v1"||body.board!==boardId||typeof body.image!=="string"||body.image.length>MAX_IMAGE*1.4)throw Error("IMAGE_FORMAT");
  let image;
  try{image=Uint8Array.from(atob(body.image),c=>c.charCodeAt(0));}catch{throw Error("IMAGE_FORMAT");}
  validateFirmware(image,board);
  return {image,logs:Array.isArray(body.stderr)?body.stderr.map(String):[]};
}
