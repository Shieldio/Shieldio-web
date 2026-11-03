import { importLibrary, validateLibraries } from "./arduino-libraries.mjs";
import { indentSelection } from "./arduino-source-editor.mjs";
import { flashNano, NANO_FLASH_BYTES, parseHex } from "./arduino-flasher.mjs";

const messages = {
  exampleLoading: ["Načítám ukázkový program…", "Loading the example program…"],
  exampleLoaded: ["Ukázka je připravená. Připoj desku a zvol Spustit na desce.", "Example ready. Connect your board and choose Run on board."],
  exampleLoadError: ["Ukázkový program se nepodařilo načíst. Obnov stránku nebo otevři jeho soubor .ino.", "Could not load the example. Reload or open its .ino file."],
  focus: ["Zvětšit editor", "Expand editor"], unfocus: ["Zpět na web", "Back to website"],
  removeLibrary: ["Odebrat", "Remove"], libraryAdded: ["Knihovna je připravená. Použij její #include v programu.", "Library ready. Use its #include in your program."],
  LIBRARY_LIMIT: ["Knihovny jsou příliš velké: nejvýše 8 knihoven, 160 souborů, 12 C++ zdrojů a 2 MB kódu včetně ShieldioDisplay.", "Library limits: 8 libraries, 160 files, 12 C++ sources and 2 MB of code including ShieldioDisplay."],
  LIBRARY_FORMAT: ["Vyber kořenovou složku jedné knihovny s hlavičkami a C++ zdroji.", "Choose the root folder of one library containing headers and C++ sources."],
  LIBRARY_ARCH: ["Tato knihovna není určená pro AVR / Arduino Nano.", "This library does not support AVR / Arduino Nano."],
  LIBRARY_LANGUAGE: ["Tato knihovna obsahuje C, assembler nebo předkompilované objekty. Zatím podporujeme C++ a hlavičky.", "This library contains C, assembly or precompiled objects. Only C++ and headers are supported yet."],
  LIBRARY_PATH: ["Knihovna obsahuje nepodporovanou cestu k souboru.", "The library contains an unsupported file path."],
  LIBRARY_CONFLICT: ["Knihovna koliduje s připravenou nebo jinou vlastní knihovnou.", "The library conflicts with an included or another custom library."],
  ready: ["Připoj RED datovým USB kabelem. Potom zvol Spustit na desce.", "Connect RED with a USB data cable. Then choose Run on board."],
  connected: ["Deska je vybraná. Klikni na Spustit na desce.", "Board selected. Choose Run on board."],
  connect: ["Připojit desku", "Connect board"], disconnect: ["Odpojit", "Disconnect"],
  compiling: ["Připravuji program pro desku…", "Preparing your program for the board…"],
  compiled: ["Kontrola dokončena. Na desce se ještě nic nezměnilo.", "Check complete. Nothing has changed on the board yet."],
  changed: ["Program jsi změnil. Spusť ho na desce znovu.", "You changed the program. Run it on the board again."],
  reset: ["Připojuji se k desce…", "Connecting to the board…"],
  write: ["Posílám program do desky", "Sending your program to the board"], verify: ["Kontroluji, že deska dostala celý program", "Checking the board received the complete program"],
  done: ["Nahráno. Teď sleduj, co deska dělá.", "Uploaded. Now watch what the board does."],
  cancelled: ["Zastaveno. Pokud už probíhalo nahrávání, spusť program na desce znovu.", "Stopped. If upload had started, run the program on the board again."],
  noPort: ["Deska nebyla vybraná. Zkus Spustit na desce znovu a vyber její USB port.", "No board selected. Choose Run on board again and select its USB port."],
  unsupported: ["Pro spuštění na RED otevři editor v Chrome nebo Edge na počítači.", "To run on RED, open the editor in desktop Chrome or Edge."],
  failure: ["Nepodařilo se to. Otevři podrobnosti a zkus doporučený postup.", "That did not work. Open the details and try the suggested steps."],
  compileError: ["Program nejde připravit. V podrobnostech najdeš chybu a její řádek.", "The program could not be prepared. Find the error and its line in the details."],
  fileLoaded: ["Program byl načten do záložky Arduino C++.", "Program loaded into the Arduino C++ tab."],
  codeUnavailable: ["Blokový editor se nenačetl. Obnov stránku nebo použij záložku Arduino C++.", "The block editor did not load. Reload or use the Arduino C++ tab."],
  errorGenerated: ["V blocích je chyba. Oprav ji podle zprávy pod výběrem součástky.", "There is a block error. Follow the message below the component selector."],
  codeChanged: ["Program se mezitím změnil. Spusť ho znovu.", "The program changed in the meantime. Run it again."],
  compileTimeout: ["Příprava trvá příliš dlouho. Zkontroluj internet a zkus to znovu.", "Preparation took too long. Check your internet connection and try again."],
  loadFailure: ["Kompilátor se nepodařilo načíst. Zkontroluj internet a povolení cdn.jsdelivr.net ve školní síti.", "Could not load the compiler. Check your connection and school access to cdn.jsdelivr.net."],
  FLASH_OVERFLOW: ["Program je větší než 30 720 bajtů pro Arduino Nano. Zkrať ho.", "The program exceeds Arduino Nano's 30,720-byte application limit. Reduce its size."],
  RAM_OVERFLOW: ["Programu a OLED displeji nestačí RAM desky. Zmenši pole, texty nebo počet proměnných.", "The program and OLED buffer exceed the board's RAM. Reduce arrays, strings or variables."],
  BOOTLOADER_SYNC: ["Deska neodpovídá. Zkus druhý bootloader, zkontroluj datový USB kabel a zavři sériový monitor v Arduino IDE.", "The board did not respond. Try the other bootloader, check the USB data cable and close Arduino IDE's Serial Monitor."],
  SERIAL_TIMEOUT: ["Deska přestala odpovídat. Zkontroluj kabel a nastavení bootloaderu a nahraj program znovu.", "The board stopped responding. Check the cable and bootloader setting, then upload again."],
  SERIAL_DISCONNECTED: ["USB deska byla odpojena. Připoj ji a vyber znovu.", "The USB board was disconnected. Reconnect and select it again."],
  WRONG_CHIP: ["Vybraná deska nemá ATmega328P. Tento editor nahrává do klasického Arduino Nano / Shieldio RED.", "The selected board is not an ATmega328P. This editor uploads to classic Arduino Nano / Shieldio RED."],
  VERIFY_FAILED: ["Ověření zápisu selhalo. Program není potvrzený jako správně nahraný. Zkontroluj kabel a zkus nahrávání znovu.", "Flash verification failed. The upload is not confirmed. Check the cable and try uploading again."],
  STK_RESPONSE: ["Neočekávaná odpověď bootloaderu. Zkontroluj typ desky a bootloader.", "Unexpected bootloader response. Check your board and bootloader setting."],
  usbIdle: ["USB · deska není vybraná", "USB · no board selected"],
  usbSelected: ["USB · deska vybraná", "USB · board selected"],
  usbUnavailable: ["USB · prohlížeč nepodporuje nahrávání", "USB · upload unavailable in this browser"],
};
const t = key => (messages[key] || messages.failure)[document.documentElement.lang === "en" ? 1 : 0];
const $ = id => document.getElementById(id);
const supported = "serial" in navigator && window.isSecureContext;
let selectedPort = null, busy = false, cached = null, worker = null, controller = null, disconnected = false;
let libraries = [], expanded = false, toolsOpen = false, importedProject = false, uploadRequested = false;
let statusKey = "ready", statusError = false, statusPercent = null;
const sourceInput = $("arduinoSource"), blocksPanel = $("blocksPanel"), codePanel = $("arduinoCodePanel");
const exampleFiles = {digitalni_metr:"/assets/code/digitalni_metr/digitalni_metr.ino",ultrazvukovy_radar:"/assets/code/ultrazvukovy_radar/ultrazvukovy_radar.ino"};
const entryParams = new URLSearchParams(window.location?.search || "");
const requestedExample = entryParams.get("example");
const exampleId = Object.hasOwn(exampleFiles,requestedExample) ? requestedExample : null;
const sourceStorageKey = "shieldio-source-v1" + (exampleId ? ":example:" + exampleId : "");
const mode = () => $("codeTab").getAttribute("aria-selected") === "true" ? "code" : "blocks";
const source = () => mode() === "code" ? sourceInput.value : window.SHIELDIO_EDITOR?.getCode() || "";

const projectCopy = {
  blikani: {
    title: ["Rozblikej zelenou LED.", "Make the green LED blink."],
    expected: ["Najdi zelenou LED na RED. Ve výchozím programu půl sekundy svítí a půl sekundy nesvítí.", "Find the green LED on RED. The starter program keeps it on for half a second, then off for half a second."],
    change: ["LED bliká? Změň oba časy 500 na 1000, odhadni rozdíl a spusť program znovu.", "Is the LED blinking? Change both 500 values to 1000, predict the difference and run it again."]
  },
  zavora: {
    title: ["Rozpohybuj závoru.", "Make the barrier move."],
    expected: ["Přibliž předmět před senzor. Pod 15 cm servo změní polohu; u svého modelu ověř, která poloha závoru otevírá.", "Move an object towards the sensor. Below 15 cm the servo changes position; check which position opens your model's barrier."],
    change: ["Závora reaguje? Změň hranici 15 cm na 25 cm a vyzkoušej, kdy se teď pohne.", "Does the barrier respond? Change the 15 cm threshold to 25 cm and test when it moves."]
  },
  parkovani: {
    title: ["Změř, jak daleko je překážka.", "Measure how far away an obstacle is."],
    expected: ["Přibližuj předmět k senzoru. Na displeji sleduj centimetry a na desce změnu červené a zelené LED.", "Move an object towards the sensor. Watch the centimetres on the display and the red and green LEDs on the board."],
    change: ["LED reagují? Změň jednu hranici 15 nebo 30 cm, odhadni výsledek a spusť program znovu.", "Do the LEDs respond? Change one 15 or 30 cm threshold, predict the result and run it again."]
  },
  digitalni_metr: {
    title: ["Změř vzdálenost na displeji.", "Read distance on the display."],
    expected: ["Polož před senzor rovnou překážku a porovnej údaj na displeji s pravítkem.", "Place a flat obstacle in front of the sensor and compare the display reading with a ruler."],
    change: ["Zkus jinou vzdálenost a povrch překážky. Kdy je měření spolehlivé?", "Try a different distance and obstacle surface. When is the reading reliable?"]
  },
  ultrazvukovy_radar: {
    title: ["Prozkoumej prostor radarem.", "Explore the space with a radar."],
    expected: ["Použij držák a zapojení z návodu. Sleduj, jak se pohyb senzoru projeví na displeji.", "Use the bracket and wiring from the guide. Watch how sensor movement appears on the display."],
    change: ["Přesuň překážku a porovnej obraz na displeji. Odpovídá jejímu novému místu?", "Move the obstacle and compare the display. Does it match the new position?"]
  },
  own: {
    title: ["Co tvůj program udělá?", "What will your program do?"],
    expected: ["Vyber si jeden výstup, který budeš na desce sledovat. Potom svůj program spusť.", "Choose one output to watch on the board. Then run your program."],
    change: ["Porovnej výsledek se svým odhadem. Změň jednu věc a spusť program znovu.", "Compare the result with your prediction. Change one thing and run the program again."]
  }
};
const localized = pair => pair[document.documentElement.lang === "en" ? 1 : 0];
function project() {
  if (importedProject) return projectCopy.own;
  const preset = window.SHIELDIO_EDITOR?.getPresetId?.();
  const id = exampleId || (mode() === "code" ? "own" : preset === undefined ? entryParams.get("preset") || "own" : preset || "own");
  return Object.hasOwn(projectCopy,id) ? projectCopy[id] : projectCopy.own;
}
function paintProject() {
  const copy = project();
  $("projectTitle").textContent = localized(copy.title);
  $("projectExpected").textContent = localized(copy.expected);
  const next = $("projectNext");
  next.hidden = !(statusKey === "done" || (statusKey === "compiled" && !uploadRequested));
  next.textContent = statusKey === "done" ? localized(copy.change) : localized(["Další krok: klikni na Spustit na desce. Kontrola sama program do desky neposílá.", "Next: choose Run on board. Checking alone does not send the program to the board."]);
}
function setTools(open) {
  if (!open && mode() === "code") switchMode("blocks");
  toolsOpen = open;
  $("programmingStudio").dataset.tools = open ? "open" : "closed";
  $("toggleToolsBtn").setAttribute("aria-expanded",String(open));
  window.SHIELDIO_EDITOR?.resize();
}
$("toggleToolsBtn").addEventListener("click", () => setTools(!toolsOpen));
window.addEventListener("shieldio:project-import", () => {importedProject=true;paintProject();});

function paint() {
  $("uploadStatus").textContent = t(statusKey) + (statusPercent === null ? "" : ` · ${statusPercent} %`);
  $("uploadStatus").dataset.error = String(statusError);
  $("connectBoardBtn").textContent = t(selectedPort ? "disconnect" : "connect");
  $("boardConnection").textContent = t(selectedPort ? "usbSelected" : supported ? "usbIdle" : "usbUnavailable");
  $("boardConnection").dataset.connected = String(Boolean(selectedPort));
  $("usbCompatibility").hidden = supported;
  $("uploadBtn").setAttribute("aria-describedby",supported ? "uploadStatus" : "usbCompatibility uploadStatus");
  $("focusEditorBtn").textContent = t(expanded ? "unfocus" : "focus");
  paintProject();
}
function status(key, error = false, percent = null) { statusKey = key; statusError = error; statusPercent = percent; paint(); }
function setBusy(value) {
  busy = value;
  for (const id of ["compileBtn", "uploadBtn", "connectBoardBtn", "bootloaderSelect", "blocksTab", "codeTab", "importSourceBtn", "downloadSourceBtn", "addLibraryBtn", "boardSelect", "blockProfileSelect", "moduleSelect", "advancedBlocksToggle", "loadBlocksBtn", "saveBlocksBtn"]) $(id).disabled = value || (!supported && (id === "uploadBtn" || id === "connectBoardBtn"));
  $("downloadHexBtn").disabled = value || !cached || cached.source !== source();
  $("toggleToolsBtn").disabled = value;
  $("cancelBuildBtn").hidden = !value;
  $("customLibraryList").inert = value;
  blocksPanel.inert = value;
  codePanel.inert = value;
  $("uploadProgress").hidden = !value;
  $("programmingStudio").dataset.busy = String(value);
  paintProject();
}
function invalidate() {
  if (cached && cached.source !== source()) {
    cached = null;
    $("downloadHexBtn").disabled = true;
    $("memoryUsage").textContent = "";
    if (!busy) status("changed");
  }
}
function switchMode(next) {
  const isCode = next === "code";
  if (isCode) setTools(true);
  if (isCode && !sourceInput.value.trim()) sourceInput.value = window.SHIELDIO_EDITOR?.getCode() || "void setup() {\n}\n\nvoid loop() {\n}\n";
  $("codeTab").setAttribute("aria-selected", String(isCode));
  $("blocksTab").setAttribute("aria-selected", String(!isCode));
  $("codeTab").tabIndex = isCode ? 0 : -1;
  $("blocksTab").tabIndex = isCode ? -1 : 0;
  blocksPanel.hidden = isCode;
  codePanel.hidden = !isCode;
  if (!isCode) window.SHIELDIO_EDITOR?.resize();
  invalidate();updateSourcePosition();paintProject();
}
$("blocksTab").addEventListener("click", () => switchMode("blocks"));
$("codeTab").addEventListener("click", () => switchMode("code"));
for (const id of ["blocksTab", "codeTab"]) $(id).addEventListener("keydown", event => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" || event.key === "ArrowLeft" ? "blocks" : "code";
  switchMode(next); $(next === "blocks" ? "blocksTab" : "codeTab").focus();
});
try { sourceInput.value = localStorage.getItem(sourceStorageKey) || ""; } catch {}
function updateSourcePosition() {
  const lines = sourceInput.value.split("\n");
  $("sourceLineNumbers").textContent = lines.map((_,i) => i+1).join("\n");
  const cursor = sourceInput.value.slice(0,sourceInput.selectionStart || 0).split("\n");
  $("sourcePosition").textContent = `${cursor.length}:${cursor.at(-1).length+1} · ${lines.length} ${document.documentElement.lang === "en" ? (lines.length === 1 ? "line" : "lines") : (lines.length === 1 ? "řádek" : lines.length < 5 ? "řádky" : "řádků")}`;
}
sourceInput.addEventListener("input", () => {invalidate();updateSourcePosition();try {localStorage.setItem(sourceStorageKey,sourceInput.value);} catch {}});
sourceInput.addEventListener("scroll", () => {$("sourceLineNumbers").scrollTop = sourceInput.scrollTop;});
for (const event of ["click","keyup","select"]) sourceInput.addEventListener(event, updateSourcePosition);
sourceInput.addEventListener("keydown", event => {
  if (event.key !== "Tab" || busy) return;
  event.preventDefault();
  const edit = indentSelection(sourceInput.value,sourceInput.selectionStart,sourceInput.selectionEnd,event.shiftKey);
  sourceInput.value = edit.text;sourceInput.setSelectionRange(edit.start,edit.end);
  sourceInput.dispatchEvent(new Event("input"));
});
window.addEventListener("shieldio:code-change", () => {invalidate();paintProject();});

async function selectPort() {
  if (!supported) throw new Error("unsupported");
  selectedPort = await navigator.serial.requestPort();
  disconnected = false;
  status("connected");
  return true;
}
$("connectBoardBtn").addEventListener("click", async () => {
  if (busy) return;
  if (selectedPort) { selectedPort = null; status("ready"); return; }
  setBusy(true); controller = new AbortController();
  try { await selectPort(); }
  catch (error) { if (error.name === "NotFoundError") status("noPort"); else showError(error); }
  finally { setBusy(false); controller = null; }
});
if (supported) navigator.serial.addEventListener("disconnect", event => {
  if ((event.port || event.target) !== selectedPort) return;
  selectedPort = null; disconnected = true;
  controller?.abort();
  status("SERIAL_DISCONNECTED", true);
});

function compileInWorker(text, signal) {
  return new Promise((resolve, reject) => {
    worker = new Worker(new URL("./arduino-compiler-worker.mjs?v=20261102-studio2", import.meta.url), { type: "module" });
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", cancel); worker?.terminate(); worker = null; };
    const cancel = () => { cleanup(); reject(new Error("CANCELLED")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("compileTimeout")); }, 120000);
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => { cleanup(); if(data.error) {const error = new Error(data.error);error.details=data.details;reject(error);} else resolve(data.result); };
    worker.onerror = event => { event.preventDefault(); cleanup(); reject(new Error("loadFailure")); };
    worker.postMessage({ source: text, libraries });
  });
}
async function compile(signal) {
  const text = source();
  if (mode() === "blocks" && !window.SHIELDIO_EDITOR) throw new Error("codeUnavailable");
  if (mode() === "blocks" && window.SHIELDIO_EDITOR.getError()) throw new Error("errorGenerated");
  if (!text.trim()) throw new Error("HEX_EMPTY");
  if (cached?.source === text) return cached.result;
  status("compiling");
  $("uploadProgress").removeAttribute("value");
  const result = await compileInWorker(text, signal);
  if (!result.fitsTarget || result.flashBytes > NANO_FLASH_BYTES) throw new Error("FLASH_OVERFLOW");
  const oledBytes = result.oledBufferBytes ?? (/Adafruit_SSD1306\.h/.test(text) ? 1024 : 0);
  if (result.ramBytes + oledBytes >= 2048) throw new Error("RAM_OVERFLOW");
  parseHex(result.hex);
  if (text !== source()) throw new Error("codeChanged");
  cached = { source: text, result };
  $("downloadHexBtn").disabled = false;
  $("memoryUsage").textContent = `Flash ${result.flashBytes.toLocaleString()} / 30 720 B · RAM ${result.ramBytes} / 2048 B${oledBytes ? " (+1024 B OLED)" : ""}`;
  $("compilerLog").textContent = result.stderr.join("\n");
  $("compilerDetails").hidden = false;
  status("compiled");
  return result;
}
function showError(error) {
  const key = disconnected ? "SERIAL_DISCONNECTED" : error.message === "CANCELLED" ? "cancelled" : messages[error.message] ? error.message : /\[cc1plus\].*error:/.test(error.message) ? "compileError" : "failure";
  status(key, key !== "cancelled");
  const details = error.details || (messages[error.message] ? "" : (error.message || String(error)));
  $("compilerLog").textContent = details;
  $("compilerDetails").hidden = !details;
  $("compilerDetails").open = Boolean(details);
}
async function run(upload) {
  if (busy || (upload && !supported)) return;
  uploadRequested = upload;
  setBusy(true);
  controller = new AbortController();
  disconnected = false;
  $("compilerDetails").hidden = true;
  try {
    if (upload && !selectedPort) {
      try { if (!await selectPort()) return; }
      catch (error) { if (error.name === "NotFoundError") { status("noPort"); return; } throw error; }
    }
    const result = await compile(controller.signal);
    if (upload) {
      controller.signal.throwIfAborted();
      await flashNano(selectedPort, result.hex, {
        baudRate: Number($("bootloaderSelect").value), signal: controller.signal,
        onProgress: (phase, percent) => {
          status(phase, false, ["write", "verify"].includes(phase) ? percent : null);
          $("uploadProgress").value = phase === "write" ? percent / 2 : phase === "verify" ? 50 + percent / 2 : phase === "done" ? 100 : 0;
        },
      });
    }
  } catch (error) { showError(controller.signal.aborted && !disconnected ? new Error("CANCELLED") : error); }
  finally { uploadRequested = false; setBusy(false); controller = null; }
}
$("compileBtn").addEventListener("click", () => run(false));
$("uploadBtn").addEventListener("click", () => run(true));
$("cancelBuildBtn").addEventListener("click", () => controller?.abort());

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("downloadHexBtn").addEventListener("click", () => { if (cached?.source === source()) download(cached.result.hex, "shieldio_program.hex"); });
$("downloadSourceBtn").addEventListener("click", () => download(source(), "shieldio_program.ino"));
$("importSourceBtn").addEventListener("click", () => $("importSourceInput").click());
$("importSourceInput").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 200000) throw new Error("Source file exceeds 200 kB.");
    importedProject=true;sourceInput.value = await file.text(); switchMode("code"); sourceInput.dispatchEvent(new Event("input")); status("fileLoaded");
  } catch (error) { showError(error); }
  finally { event.target.value = ""; }
});
function paintLibraries() {
  const list = $("customLibraryList");list.replaceChildren();
  libraries.forEach((lib,index) => {
    const row = document.createElement("li"), name = document.createElement("span"), remove = document.createElement("button");
    name.textContent = lib.name + (lib.version ? " " + lib.version : "");
    remove.type="button";remove.className="blockly-toggle-code";remove.textContent=t("removeLibrary");
    remove.setAttribute("aria-label",t("removeLibrary")+" "+lib.name);
    remove.addEventListener("click",() => {if(busy)return;libraries.splice(index,1);librariesChanged();});
    row.append(name,remove);list.append(row);
  });
}
function librariesChanged() {
  cached=null;$("downloadHexBtn").disabled=true;$("memoryUsage").textContent="";status("changed");paintLibraries();
}
$("addLibraryBtn").addEventListener("click", () => $("libraryFolderInput").click());
$("libraryFolderInput").addEventListener("change", async event => {
  if (busy) return;
  const files = event.target.files;if(!files?.length)return;
  setBusy(true);
  try {
    const library = await importLibrary(files);
    const next = [...libraries.filter(lib => lib.name !== library.name),library];validateLibraries(next);
    libraries=next;librariesChanged();$("libraryStatus").textContent=t("libraryAdded");
  } catch(error) {$("libraryStatus").textContent=t(error.message)+(error.details ? " "+error.details : "");}
  finally {event.target.value="";setBusy(false);}
});
$("focusEditorBtn").addEventListener("click", () => {
  expanded=!expanded;document.body.classList.toggle("programming-focus",expanded);
  $("focusEditorBtn").setAttribute("aria-pressed",String(expanded));paint();window.SHIELDIO_EDITOR?.resize();
});
window.addEventListener("keydown", event => {
  if(event.key==="Escape" && expanded) $("focusEditorBtn").click();
  if((event.ctrlKey || event.metaKey) && event.key==="Enter") {event.preventDefault();run(event.shiftKey);}
});
new MutationObserver(() => {paint();paintLibraries();updateSourcePosition();}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
setBusy(false); paint();updateSourcePosition();





// Fixed, same-origin examples only. Their autosave is separate from the visitor's manual program.
async function loadExample() {
  setBusy(true);controller=new AbortController();status("exampleLoading");
  try {
    const response=await fetch(new URL(exampleFiles[exampleId],import.meta.url),{signal:controller.signal});
    if(!response.ok)throw new Error("exampleLoadError");
    const text=await response.text();
    if(text.length>200000 || !/\bvoid\s+setup\s*\(/.test(text) || !/\bvoid\s+loop\s*\(/.test(text))throw new Error("exampleLoadError");
    sourceInput.value=text;switchMode("code");sourceInput.dispatchEvent(new Event("input"));status("exampleLoaded");
  } catch(error) {status(controller.signal.aborted ? "cancelled" : "exampleLoadError",!controller.signal.aborted);}
  finally {setBusy(false);controller=null;}
}
if(exampleId) {
  if(sourceInput.value.trim()) {switchMode("code");status("fileLoaded");}
  else loadExample();
}
