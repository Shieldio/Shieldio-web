import { flashNano, NANO_FLASH_BYTES, parseHex } from "./arduino-flasher.mjs";
import { connectMlink } from "./arduino-mlink.mjs?v=20261102-diagnostics";

const messages = {
  ready: ["Poskládej program a klikni na Zkompilovat nebo Nahrát do desky.", "Build a program, then choose Compile or Upload to board."],
  connected: ["USB deska je vybraná. Můžeš nahrát program.", "USB board selected. You can upload your program."],
  connect: ["Připojit desku", "Connect board"], disconnect: ["Odpojit", "Disconnect"],
  compiling: ["Kompiluji program… Při prvním použití se stahuje kompilátor a knihovny.", "Compiling… The compiler and libraries download on first use."],
  compiled: ["Kompilace proběhla. Program je připravený k nahrání.", "Compilation complete. Your program is ready to upload."],
  changed: ["Program se změnil. Před nahráním ho znovu zkompiluji.", "Program changed. It will be compiled again before upload."],
  reset: ["Spouštím bootloader desky…", "Starting the board bootloader…"],
  write: ["Nahrávám program", "Uploading program"], verify: ["Ověřuji zápis v desce", "Verifying flash contents"],
  done: ["Program je nahraný a ověřený. Deska ho nyní spouští.", "Program uploaded and verified. The board is now starting it."],
  cancelled: ["Operace byla zrušena. Pokud se zápis přerušil, nahraj program znovu.", "Operation cancelled. If flashing was interrupted, upload again."],
  noPort: ["Nebyla vybrána žádná deska.", "No board selected."],
  unsupported: ["Pro nahrávání přes USB otevři tuto stránku v Chrome nebo Edge na počítači. Kompilaci můžeš použít i zde.", "For USB upload, open this page in desktop Chrome or Edge. Compilation is still available here."],
  failure: ["Operace se nepodařila. Podrobnosti jsou níže.", "Operation failed. See the details below."],
  compileError: ["Oprav chybu v programu. Kompilátor ukazuje řádek v podrobnostech níže.", "Fix the program error. The compiler shows the line in the details below."],
  fileLoaded: ["Program byl načten do záložky Arduino C++.", "Program loaded into the Arduino C++ tab."],
  codeUnavailable: ["Blokový editor se nenačetl. Obnov stránku nebo použij záložku Arduino C++.", "The block editor did not load. Reload or use the Arduino C++ tab."],
  errorGenerated: ["Oprav chybu v blocích, než budeš kompilovat.", "Fix the block error before compiling."],
  codeChanged: ["Program se během kompilace změnil. Zkompiluj ho znovu.", "The program changed during compilation. Compile again."],
  compileTimeout: ["Kompilace trvala příliš dlouho. Zkontroluj připojení k internetu a zkus to znovu.", "Compilation timed out. Check your internet connection and try again."],
  loadFailure: ["Kompilátor se nepodařilo načíst. Zkontroluj internet a povolení cdn.jsdelivr.net ve školní síti.", "Could not load the compiler. Check your connection and school access to cdn.jsdelivr.net."],
  FLASH_OVERFLOW: ["Program je větší než 30 720 bajtů pro Arduino Nano. Zkrať ho.", "The program exceeds Arduino Nano's 30,720-byte application limit. Reduce its size."],
  RAM_OVERFLOW: ["Programu a OLED displeji nestačí RAM desky. Zmenši pole, texty nebo počet proměnných.", "The program and OLED buffer exceed the board's RAM. Reduce arrays, strings or variables."],
  BOOTLOADER_SYNC: ["Deska neodpovídá. Zkus druhý bootloader, zkontroluj datový USB kabel a zavři sériový monitor v Arduino IDE.", "The board did not respond. Try the other bootloader, check the USB data cable and close Arduino IDE's Serial Monitor."],
  SERIAL_TIMEOUT: ["Deska přestala odpovídat. Zkontroluj kabel a nastavení bootloaderu a nahraj program znovu.", "The board stopped responding. Check the cable and bootloader setting, then upload again."],
  SERIAL_DISCONNECTED: ["USB deska byla odpojena. Připoj ji a vyber znovu.", "The USB board was disconnected. Reconnect and select it again."],
  WRONG_CHIP: ["Vybraná deska nemá ATmega328P. Tento editor nahrává do klasického Arduino Nano / Shieldio RED.", "The selected board is not an ATmega328P. This editor uploads to classic Arduino Nano / Shieldio RED."],
  VERIFY_FAILED: ["Ověření zápisu selhalo. Program není potvrzený jako správně nahraný. Zkontroluj kabel a zkus nahrávání znovu.", "Flash verification failed. The upload is not confirmed. Check the cable and try uploading again."],
  STK_RESPONSE: ["Neočekávaná odpověď bootloaderu. Zkontroluj typ desky a bootloader.", "Unexpected bootloader response. Check your board and bootloader setting."],
  mlinkReady: ["Safari: spusť mLink v počítači a klikni na Připojit desku. Toto napojení je zatím experimentální.", "Safari: start mLink on your computer, then click Connect board. This integration is experimental."],
  mlinkFinding: ["Hledám místní službu mLink…", "Looking for the local mLink service…"],
  mlinkChoose: ["mLink odpovídá. Vyber sériový port své desky níže.", "mLink is responding. Select your board's serial port below."],
  mlinkEmpty: ["mLink běží, ale nehlásí žádné porty. Připoj desku datovým USB kabelem a klikni na Obnovit porty.", "mLink is running but reports no ports. Connect a board with a USB data cable and click Refresh ports."],
  portPlaceholder: ["Vyber port desky…", "Select the board port…"],
  MLINK_UNAVAILABLE: ["Web se nemůže spojit s mLinkem 2. Klikni na Spustit mLink. Pokud jej nemáš, stáhni ho od výrobce. Pak zkus připojení znovu.", "The site cannot reach mLink 2. Click Launch mLink. If it is not installed, download it from the manufacturer, then try connecting again."],
  MLINK_DISCONNECTED: ["Spojení s mLinkem se přerušilo. Spusť ho a vyber desku znovu.", "The mLink connection was lost. Restart it and select the board again."],
  MLINK_TIMEOUT: ["mLink neodpověděl včas. Zavři připojení k desce v mBlocku a zkus to znovu.", "mLink did not respond in time. Disconnect the board in mBlock and try again."],
  MLINK_PROTOCOL: ["Tato verze mLinku vrátila neznámou odpověď. Zkus aktuální mLink 2 nebo přímé USB v Chrome/Edge.", "This mLink version returned an unknown response. Try current mLink 2 or direct USB in Chrome/Edge."],
  MLINK_CLIENT: ["Nepodařilo se načíst rozhraní mLinku. Obnov stránku a zkus to znovu.", "Could not load the mLink interface. Reload and try again."],
};
const t = key => (messages[key] || messages.failure)[document.documentElement.lang === "en" ? 1 : 0];
const $ = id => document.getElementById(id);
const supported = "serial" in navigator && window.isSecureContext;
let selectedPort = null, busy = false, cached = null, worker = null, controller = null, disconnected = false;
let bridge = null;
let statusKey = supported ? "ready" : "mlinkReady", statusError = false, statusPercent = null;
const transport = () => $("transportSelect").value;
$("transportSelect").value = supported ? "direct" : "mlink";
$("directTransportOption").disabled = !supported;
$("mlinkHelp").hidden = supported;
const sourceInput = $("arduinoSource"), blocksPanel = $("blocksPanel"), codePanel = $("arduinoCodePanel");
const mode = () => $("codeTab").getAttribute("aria-selected") === "true" ? "code" : "blocks";
const source = () => mode() === "code" ? sourceInput.value : window.SHIELDIO_EDITOR?.getCode() || "";

function paint() {
  $("uploadStatus").textContent = t(statusKey) + (statusPercent === null ? "" : ` · ${statusPercent} %`);
  $("uploadStatus").dataset.error = String(statusError);
  $("connectBoardBtn").textContent = t(selectedPort ? "disconnect" : "connect");
}
function status(key, error = false, percent = null) { statusKey = key; statusError = error; statusPercent = percent; paint(); }
function setBusy(value) {
  busy = value;
  for (const id of ["compileBtn", "uploadBtn", "connectBoardBtn", "bootloaderSelect", "transportSelect", "mlinkPortSelect", "refreshMlinkBtn", "blocksTab", "codeTab"]) $(id).disabled = value || (!supported && transport() === "direct" && (id === "uploadBtn" || id === "connectBoardBtn"));
  $("cancelBuildBtn").hidden = !value;
  blocksPanel.inert = value;
  codePanel.inert = value;
  $("uploadProgress").hidden = !value;
  $("programmingStudio").dataset.busy = String(value);
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
  if (isCode && !sourceInput.value.trim()) sourceInput.value = window.SHIELDIO_EDITOR?.getCode() || "void setup() {\n}\n\nvoid loop() {\n}\n";
  $("codeTab").setAttribute("aria-selected", String(isCode));
  $("blocksTab").setAttribute("aria-selected", String(!isCode));
  $("codeTab").tabIndex = isCode ? 0 : -1;
  $("blocksTab").tabIndex = isCode ? -1 : 0;
  blocksPanel.hidden = isCode;
  codePanel.hidden = !isCode;
  if (!isCode) window.SHIELDIO_EDITOR?.resize();
  invalidate();
}
$("blocksTab").addEventListener("click", () => switchMode("blocks"));
$("codeTab").addEventListener("click", () => switchMode("code"));
for (const id of ["blocksTab", "codeTab"]) $(id).addEventListener("keydown", event => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" || event.key === "ArrowLeft" ? "blocks" : "code";
  switchMode(next); $(next === "blocks" ? "blocksTab" : "codeTab").focus();
});
sourceInput.addEventListener("input", invalidate);
window.addEventListener("shieldio:code-change", invalidate);

async function selectPort() {
  if (transport() === "mlink") {
    status("mlinkFinding");
    if (!bridge?.socket.connected) {
      bridge?.close();
      bridge = await connectMlink({ signal: controller?.signal });
    }
    const ports = await bridge.listPorts();
    const select = $("mlinkPortSelect");
    select.replaceChildren(new Option(t("portPlaceholder"), ""));
    for (const port of ports) select.add(new Option(port.path + (port.manufacturer ? " (" + port.manufacturer + ")" : ""), port.path));
    $("mlinkPorts").hidden = false;
    status(ports.length ? "mlinkChoose" : "mlinkEmpty");
    return false; // Explicit port selection is required before opening hardware.
  }
  selectedPort = await navigator.serial.requestPort();
  disconnected = false;
  status("connected");
  return true;
}
$("connectBoardBtn").addEventListener("click", async () => {
  if (busy) return;
  if (selectedPort) { selectedPort = null; bridge?.close(); bridge = null; $("mlinkPorts").hidden = true; status(transport() === "mlink" ? "mlinkReady" : "ready"); return; }
  setBusy(true); controller = new AbortController();
  try { await selectPort(); }
  catch (error) { if (error.name === "NotFoundError") status("noPort"); else showError(error); }
  finally { setBusy(false); controller = null; }
});
$("transportSelect").addEventListener("change", () => {
  bridge?.close(); bridge = null; selectedPort = null;
  $("mlinkPorts").hidden = true;
  $("mlinkHelp").hidden = transport() !== "mlink";
  setBusy(false); status(transport() === "mlink" ? "mlinkReady" : "ready");
});
$("mlinkPortSelect").addEventListener("change", event => {
  selectedPort = event.target.value && bridge?.socket.connected ? bridge.createPort(event.target.value) : null;
  disconnected = false;
  status(selectedPort ? "connected" : "mlinkChoose");
});
$("refreshMlinkBtn").addEventListener("click", async () => {
  if (busy) return;
  selectedPort = null; setBusy(true); controller = new AbortController();
  try { await selectPort(); } catch (error) { showError(error); }
  finally { setBusy(false); controller = null; }
});
window.addEventListener("pagehide", () => bridge?.close());
if (supported) navigator.serial.addEventListener("disconnect", event => {
  if ((event.port || event.target) !== selectedPort) return;
  selectedPort = null; disconnected = true;
  controller?.abort();
  status("SERIAL_DISCONNECTED", true);
});

function compileInWorker(text, signal) {
  return new Promise((resolve, reject) => {
    worker = new Worker(new URL("./arduino-compiler-worker.mjs", import.meta.url), { type: "module" });
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", cancel); worker?.terminate(); worker = null; };
    const cancel = () => { cleanup(); reject(new Error("CANCELLED")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("compileTimeout")); }, 120000);
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => { cleanup(); data.error ? reject(new Error(data.error)) : resolve(data.result); };
    worker.onerror = event => { event.preventDefault(); cleanup(); reject(new Error("loadFailure")); };
    worker.postMessage({ source: text });
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
  const oledBytes = /Adafruit_SSD1306\.h/.test(text) ? 1024 : 0;
  if (result.ramBytes + oledBytes >= 2048) throw new Error("RAM_OVERFLOW");
  parseHex(result.hex);
  if (text !== source()) throw new Error("codeChanged");
  cached = { source: text, result };
  $("downloadHexBtn").disabled = false;
  $("memoryUsage").textContent = `Flash ${result.flashBytes.toLocaleString()} / 30 720 B · RAM ${result.ramBytes} / 2048 B${oledBytes ? " (+1024 B OLED)" : ""}`;
  $("compilerLog").textContent = result.stderr.join("\n");
  $("compilerDetails").hidden = !result.stderr.length;
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
  if (busy) return;
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
  finally { setBusy(false); controller = null; }
}
$("compileBtn").addEventListener("click", () => run(false));
$("uploadBtn").addEventListener("click", () => run(true));
$("cancelBuildBtn").addEventListener("click", () => controller?.abort());

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("downloadHexBtn").addEventListener("click", () => { if (cached?.source === source()) download(cached.result.hex, "shieldio_red.hex"); });
$("downloadSourceBtn").addEventListener("click", () => download(sourceInput.value, "shieldio_red.ino"));
$("importSourceBtn").addEventListener("click", () => $("importSourceInput").click());
$("importSourceInput").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 200000) throw new Error("Source file exceeds 200 kB.");
    sourceInput.value = await file.text(); switchMode("code"); invalidate(); status("fileLoaded");
  } catch (error) { showError(error); }
  finally { event.target.value = ""; }
});
new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
setBusy(false); paint();

