import {BOARDS,boardById,MAX_IMAGE,validateFirmware} from "./boards.mjs";
import {flashFirmware} from "./flasher.mjs";
import {codeKeyEdit,formatIndentation} from "../assets/js/arduino-source-editor.mjs";

const $=id=>document.getElementById(id);
const copy={
  freeMode:["Bez serveru a předplatného","No server or subscription"],
  arduinoDownload:["Arduino IDE ↗","Arduino IDE ↗"],
  localBuild:["Ulož .ino, sestav ho v Arduino IDE a přes Sketch → Export Compiled Binary vyexportuj .merged.bin. Ten potom nahraj vpravo přes USB.","Save the .ino, build it in Arduino IDE and use Sketch → Export Compiled Binary to export a .merged.bin. Then upload it over USB on the right."],
  buildHelp:["Pro sestavení nainstaluj v Arduino IDE balík esp32 by Espressif Systems a zvol konkrétní desku. Použij aktuální verzi balíku; sloučený soubor má příponu .merged.bin.","To build, install esp32 by Espressif Systems in Arduino IDE and select your exact board. Use the current board package; the merged image ends in .merged.bin."],
  buildSteps:["Jak sestavit firmware zdarma","How to build firmware for free"],
  installStep:["V Arduino IDE otevři nastavení a do Additional Boards Manager URLs přidej tuto adresu:","In Arduino IDE preferences, add this URL to Additional Boards Manager URLs:"],
  packageStep:["Ve správci desek nainstaluj esp32 by Espressif Systems (verzi 3.3.12 nebo novější).","In Boards Manager, install esp32 by Espressif Systems (version 3.3.12 or later)."],
  sourceStep:["Klikni na Uložit .ino a otevři soubor v Arduino IDE. Pokud IDE nabídne vytvoření složky se stejným názvem, potvrď ho. Přidej knihovny použité v kódu.","Click Save .ino and open the file in Arduino IDE. Accept creating a matching sketch folder if prompted. Install the libraries used by your code."],
  exportStep:["Zvol Sketch → Export Compiled Binary. Přes Sketch → Show Sketch Folder otevři složku projektu; v build najdi soubor končící .merged.bin. Vyber ho zde a spusť nahrávání přes USB.","Choose Sketch → Export Compiled Binary. Open Sketch → Show Sketch Folder; find the file ending in .merged.bin under build. Select it here and flash over USB."],
  customBuild:["ESP32-C2 a C61 vyžadují Arduino jako komponentu ESP-IDF nebo vlastní sestavení statických knihoven. Běžný balík v Arduino IDE pro ně nestačí. Hotový sloučený obraz se standardní tabulkou oddílů na 0x8000 sem můžeš načíst.","ESP32-C2 and C61 require Arduino as an ESP-IDF component or rebuilding the static libraries. The standard Arduino IDE package is not enough. You can load a merged image with the standard partition table at 0x8000 here."],
  buildDocs:["Postup od Espressifu ↗","Espressif instructions ↗"],
  selectIdeBoard:["V Tools → Board zvol vlastní desku; obecný profil pro tento čip:","Select your exact board in Tools → Board; generic profile for this chip:"],
  redEditor:["Editor RED","RED editor"],theme:["Přepnout vzhled","Change appearance"],
  eyebrow:["NÁSTROJE PRO POKROČILÉ","TOOLS FOR ADVANCED USERS"],intro:["Vlastní kód. Vlastní deska. Přímé USB.","Your code. Your board. Direct USB."],back:["Zpět na Shieldio ↗","Back to Shieldio ↗"],
  autosave:["Ukládá se v prohlížeči","Saved in your browser"],open:["Otevřít .ino","Open .ino"],save:["Uložit .ino","Save .ino"],format:["Zarovnat","Format"],saveBin:["Stáhnout .bin","Download .bin"],
  sourceLabel:["Arduino C++ kód","Arduino C++ source"],compile:["Zkontrolovat C++","Check C++"],run:["Sestavit a nahrát","Build and upload"],checking:["Ověřuji kompilátor…","Checking compiler…"],
  board:["Deska","Board"],boardLabel:["Rodina / varianta","Family / variant"],usb:["USB port vybereš při nahrávání","Choose the USB port when uploading"],
  firmware:["Hotový firmware","Compiled firmware"],firmwareIntro:["Nahraj sloučený obraz z Arduino IDE přímo do desky.","Flash a merged image from Arduino IDE directly to your board."],
  chooseBin:["Vybrat .merged.bin","Choose .merged.bin"],fileLimit:["Kompletní obraz · nejvýše 32 MB","Complete image · up to 32 MB"],flash:["Nahrát firmware přes USB","Flash firmware over USB"],
  binHelp:["Obraz od adresy 0x0, tabulka oddílů na 0x8000. Samotná aplikace .bin nestačí. Nahrání může přepsat uložená data desky.","Image based at 0x0, partition table at 0x8000. App-only .bin files are not enough. Flashing may overwrite stored board data."],
  help:["Připojení a podporované desky","Connection and supported boards"],
  browserHelp:["Použij Chrome nebo Edge na počítači a datový USB kabel. Zavři sériové monitory v jiných programech.","Use desktop Chrome or Edge and a USB data cable. Close serial monitors in other applications."],
  bootHelp:["Pokud připojení selže, podrž BOOT, krátce stiskni RESET/EN a při připojování BOOT uvolni. U nativního USB může být potřeba port vybrat znovu.","If connection fails, hold BOOT, tap RESET/EN, then release BOOT while connecting. Native USB may require selecting the port again."],
  supportHelp:["Nahrávání je připravené pro uvedené čipy. Fyzické testování všech variant zatím neproběhlo. Piny, flash a periferie závisí na konkrétní desce.","Flashing is implemented for the listed chips. Not all variants have been physically tested. Pins, flash and peripherals depend on your board."],
  customHelp:["Vlastní rozložení oddílů, šifrovaný firmware a ESP8266 zatím nejsou podporované.","Custom partition layouts, encrypted firmware and ESP8266 are not supported yet."],
  output:["Výstup","Output"],cancel:["Zrušit","Cancel"],ready:["Připraveno.","Ready."],logs:["Technický výpis","Technical log"],progress:["Průběh nahrávání","Upload progress"],
  privacy:["Soukromí","Privacy"],local:["Firmware a USB připojení zůstávají v prohlížeči.","Firmware and USB access stay in your browser."],
  compilerOffline:["Kompilace nepřipojená","Compiler not connected"],compilerOnline:["Kompilátor dostupný","Compiler available"],
  offlineNote:["Online sestavení C++ zatím není připojené. Kód můžeš uložit jako .ino; hotový .merged.bin nahraješ přes USB.","Online C++ compilation is not connected yet. Save your code as .ino; upload a compiled .merged.bin over USB."],
  onlineNote:["Aktuální kód se sestaví na serveru Shieldio. SDK knihovny jsou připravené; vlastní složky knihoven zatím nepřijímáme.","Your current code is built on the Shieldio server. SDK libraries are included; custom library folders are not accepted yet."],
  binOnly:["Pro tento čip je nyní dostupné nahrávání .merged.bin. Sestavení Arduino knihoven vyžaduje vlastní konfiguraci.","This chip currently supports .merged.bin flashing. Building the Arduino libraries requires custom configuration."],
  boardDefault:["Vyber správný čip. Piny a paměť ověř podle své konkrétní desky.","Choose the correct chip. Check pins and memory against your board."],
  browserUnsupported:["USB nahrávání vyžaduje Chrome nebo Edge na počítači.","USB flashing requires desktop Chrome or Edge."],
  fileReady:["Firmware připravený k nahrání.","Firmware ready to upload."],sourceLoaded:["Zdrojový kód načten.","Source code loaded."],
  saved:["Kód uložený v prohlížeči","Code saved in your browser"],notSaved:["Automatické uložení není dostupné — stáhni si .ino.","Autosave unavailable — download your .ino."],
  compiling:["Sestavuji program…","Building program…"],compiled:["Program sestavený. Do desky zatím nebyl nahraný.","Program built. It has not been uploaded to the board."],
  connect:["Připojuji desku…","Connecting to board…"],write:["Nahrávám firmware…","Writing firmware…"],verify:["Zápis ověřený, restartuji desku…","Write verified, resetting board…"],
  done:["Nahráno a ověřeno.","Uploaded and verified."],cancelled:["Operace přerušená. Při přerušení zápisu nahraj firmware znovu.","Operation cancelled. If writing had started, upload the firmware again."],
  noPort:["USB port nebyl vybraný. Nahrávání můžeš spustit znovu.","No USB port selected. Start the upload again."],
  NO_COMPILER:["Kompilátor pro tuto desku zatím není připojený.","The compiler for this board is not connected yet."],
  IMAGE_FORMAT:["Vyber kompletní Arduino .merged.bin s bootloaderem, tabulkou oddílů na 0x8000 a aplikací. Samotný program .bin nestačí.","Select a complete Arduino .merged.bin with bootloader, partition table at 0x8000 and application. App-only .bin files are not enough."],
  IMAGE_CHIP:["Firmware neodpovídá vybranému čipu, nebo nejde o kompletní sloučený obraz.","The firmware does not match the selected chip, or is not a complete merged image."],
  WRONG_CHIP:["Připojená deska má jiný čip. Zvol odpovídající variantu a firmware.","The connected board has a different chip. Select the matching variant and firmware."],
  FLASH_SIZE:["Velikost flash se nepodařilo ověřit, nebo se do ní firmware nevejde.","Flash capacity could not be verified, or the firmware does not fit."],
  COMPILE_ERROR:["Sestavení selhalo. Podrobnosti najdeš v technickém výpisu.","Build failed. See the technical log."],
  SOURCE_SIZE:["Zdrojový soubor může mít nejvýše 200 kB.","Source files must be no larger than 200 kB."],
  failure:["Operace selhala. Zkontroluj kabel, čip a technický výpis.","Operation failed. Check the cable, chip and technical log."],
};
let lang=0,target="esp32",busy=false,image=null,controller=null,statusKey="ready",statusError=false,port=null,revision=0,resetting=false;
const defaultCode='void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  Serial.println("Ahoj ESP32!");\n  delay(1000);\n}\n';
const storageKey=()=> "shieldio-esp32-source:"+target;
const board=()=>boardById(target);
const supported=()=>Boolean(navigator.serial&&window.isSecureContext);
const t=key=>(copy[key]||copy.failure)[lang];
try{lang=localStorage.getItem("shieldio-esp32-lang")==="en"?1:0;const last=localStorage.getItem("shieldio-esp32-board");if(boardById(last))target=last;}catch{}

function controls(){
  for(const id of ["board","openSource","saveSource","formatCode","sourceFile","firmware"])$(id).disabled=busy;
  $("source").readOnly=busy;$("flash").disabled=busy||!image||!supported();
  $("cancel").hidden=!busy;
}
function paint(){
  document.documentElement.lang=lang?"en":"cs";
  for(const el of document.querySelectorAll("[data-copy]"))el.textContent=t(el.dataset.copy);
  for(const el of document.querySelectorAll("[data-aria]"))el.setAttribute("aria-label",t(el.dataset.aria));
  $("language").textContent=lang?"CS":"EN";
  const targetBoard=board(),standardBuild=Boolean(targetBoard.fqbn);
  $("boardHint").textContent=t(standardBuild?"boardDefault":"binOnly");
  $("ideSteps").hidden=!standardBuild;$("customBuild").hidden=standardBuild;
  $("buildSummary").textContent=t(standardBuild?"localBuild":"binOnly");
  $("ideBoard").textContent=t("selectIdeBoard")+" "+(target==="nano-esp32"?"Arduino Nano ESP32":targetBoard.chip.replace("ESP32-","ESP32")+" Dev Module")+".";
  $("buildDocs").href="https://docs.espressif.com/projects/arduino-esp32/en/latest/"+(standardBuild?"installing.html":"esp-idf_component.html");
  $("usbState").querySelector("span:last-child").textContent=t(supported()?"usb":"browserUnsupported");
  $("status").textContent=t(statusKey);$("status").dataset.error=String(statusError);
  if(image)$("fileInfo").textContent=image.name+" · "+image.bytes.length.toLocaleString(lang?"en-US":"cs-CZ")+" B";
  controls();
}
function status(key,error=false){statusKey=key;statusError=error;$("status").textContent=t(key);$("status").dataset.error=String(error);}
function log(line){$("log").textContent=($("log").textContent+line+"\n").slice(-60000);}
function updatePosition(){
  const input=$("source"),lines=input.value.split("\n"),before=input.value.slice(0,input.selectionStart).split("\n");
  $("lineNumbers").textContent=lines.map((_,i)=>i+1).join("\n");
  $("lineNumbers").scrollTop=input.scrollTop;$("cursor").textContent=before.length+":"+String(before.at(-1).length+1);
}
function persist(){
  try{localStorage.setItem(storageKey(),$("source").value);$("saveState").textContent=t("saved");}catch{$("saveState").textContent=t("notSaved");}
  updatePosition();
}
function restore(){$("board").value=target;try{$("source").value=localStorage.getItem(storageKey())||defaultCode;}catch{$("source").value=defaultCode;}updatePosition();}
function edit(change){
  if(!change||busy)return;
  const input=$("source"),previous=input.value,scroll=input.scrollTop;
  let start=0,end=previous.length,nextEnd=change.text.length;
  while(start<end&&start<nextEnd&&previous[start]===change.text[start])start++;
  while(end>start&&nextEnd>start&&previous[end-1]===change.text[nextEnd-1]){end--;nextEnd--;}
  input.focus?.();input.setSelectionRange(start,end);
  const inserted=document.execCommand?.("insertText",false,change.text.slice(start,nextEnd));
  if(!inserted||input.value!==change.text)input.value=change.text;
  input.setSelectionRange(change.start,change.end);input.scrollTop=scroll;persist();
}
$("source").addEventListener("input",persist);
for(const event of ["click","keyup","select","scroll"])$("source").addEventListener(event,updatePosition);
$("source").addEventListener("keydown",event=>{
  if(busy||event.isComposing)return;
  const input=$("source");
  if((event.metaKey||event.ctrlKey)&&event.shiftKey&&event.key.toLowerCase()==="f"){event.preventDefault();$("formatCode").click();return;}
  const change=codeKeyEdit(input.value,input.selectionStart,input.selectionEnd,event);if(change){event.preventDefault();edit(change);}
});
$("formatCode").addEventListener("click",()=>edit(formatIndentation($("source").value,$("source").selectionStart,$("source").selectionEnd)));
$("language").addEventListener("click",()=>{lang=1-lang;try{localStorage.setItem("shieldio-esp32-lang",lang?"en":"cs");}catch{}paint();});
$("theme").addEventListener("click",()=>{const value=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=value;try{localStorage.setItem("shieldio-theme",value);}catch{}});
$("board").addEventListener("change",()=>{
  if(busy)return;
  try{localStorage.setItem(storageKey(),$("source").value);}catch{}
  target=$("board").value;revision++;port=null;image=null;$("firmware").value="";$("progress").hidden=true;$("progressText").textContent="";restore();status("ready");paint();
  try{localStorage.setItem("shieldio-esp32-board",target);}catch{}
});
function download(data,name,type){
  const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("saveSource").addEventListener("click",()=>download($("source").value,target+"_sketch.ino","text/plain;charset=utf-8"));
$("openSource").addEventListener("click",()=>$("sourceFile").click());
$("sourceFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file||busy)return;const current=revision;
  try{if(file.size>200000)throw Error("SOURCE_SIZE");const text=await file.text();if(current!==revision||busy)return;$("source").value=text;persist();status("sourceLoaded");}
  catch(e){status(e.message in copy?e.message:"failure",true);}finally{event.target.value="";}
});
$("firmware").addEventListener("change",async event=>{
  image=null;controls();const file=event.target.files?.[0],current=revision;if(!file||busy){paint();return;}
  try{
    if(file.size>MAX_IMAGE)throw Error("IMAGE_FORMAT");
    const bytes=new Uint8Array(await file.arrayBuffer());if(current!==revision||busy)return;
    validateFirmware(bytes,board());image={bytes,name:file.name};status("fileReady");paint();
  }catch(e){if(current!==revision)return;paint();status(e.message in copy?e.message:"IMAGE_FORMAT",true);}
});
function progress(phase,percent){
  if(phase==="verify")resetting=true;
  status(phase);$("progress").hidden=false;
  if(percent===null)$("progress").removeAttribute("value");else $("progress").value=percent;
  $("progressText").textContent=percent===null?"":Math.round(percent)+" %";
}
function error(e){
  if(e.name==="NotFoundError"){status("noPort");return;}
  if(controller?.signal.aborted){status("cancelled",true);return;}
  status(e.message in copy?e.message:"failure",true);if(e.details||!(e.message in copy)){log(e.details||String(e));$("logDetails").open=true;}
}
async function action(){
  if(busy||!image)return;
  if(!supported()){status("browserUnsupported",true);return;}
  busy=true;resetting=false;controller=new AbortController();controls();$("log").textContent="";$("progress").hidden=true;$("progressText").textContent="";
  try{
    if(!port)port=await navigator.serial.requestPort();
    await flashFirmware(port,image.bytes,board(),{signal:controller.signal,onProgress:progress,onLog:log});
  }catch(e){error(e);}finally{busy=false;controller=null;controls();if(statusKey!=="done"){$("progress").hidden=true;$("progressText").textContent="";}}
}
$("flash").addEventListener("click",action);
$("cancel").addEventListener("click",()=>controller?.abort());
if(supported())navigator.serial.addEventListener("disconnect",event=>{if((event.port||event.target)===port){port=null;if(!resetting)controller?.abort();}});
restore();paint();

