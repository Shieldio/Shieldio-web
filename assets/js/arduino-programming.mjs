import { SerialMonitor } from "./arduino-serial-monitor.mjs?v=20261113-friendly2";
import { SerialPlotter, drawSerialPlot, PLOT_COLORS } from "./arduino-serial-plotter.mjs?v=20261110-plot1";
import { importLibrary, validateLibraries } from "./arduino-libraries.mjs";
import { codeKeyEdit, formatIndentation, toggleLineComment } from "./arduino-source-editor.mjs?v=20261103-assist2";
import { parseCompilerDiagnostics, describeDiagnostic, applyDiagnosticFix } from "./arduino-diagnostics.mjs?v=20261104-status1";
import { flashArduino, NANO_FLASH_BYTES, UNO_FLASH_BYTES, parseHex } from "./arduino-flasher.mjs?v=20261113-friendly2";

const messages = {
  serialSimpleConnect: ["Připojit monitor", "Connect monitor"],
  serialSimpleIdle: ["Po připojení se zprávy z programu zobrazí tady.", "Messages from your program appear here after connecting."],
  serialSent: ["Zpráva odeslána.", "Message sent."],
  serialSendError: ["Zprávu se nepodařilo odeslat. Zkontroluj spojení a délku zprávy (max. 4096 bajtů včetně konce řádku).", "Could not send. Check the connection and message size (max. 4096 bytes including line ending)."],
  serialIdle: ["Nastav stejnou rychlost jako v Serial.begin(9600) a spusť příjem.", "Match the baud rate to Serial.begin(9600), then start receiving."],
  serialStart: ["Spustit příjem", "Start receiving"], serialStop: ["Zastavit příjem", "Stop receiving"],
  serialReading: ["Přijímám data z Arduina…", "Receiving data from Arduino…"],
  serialOpening: ["Otevírám sériový port…", "Opening serial port…"],
  serialPaused: ["Příjem pozastaven pro nahrávání.", "Receiving paused for upload."],
  serialStopped: ["Příjem zastaven.", "Receiving stopped."],
  serialNoPort: ["Deska nebyla vybraná.", "No board selected."],
  plotPause: ["Pozastavit graf", "Pause plot"], plotResume: ["Pokračovat v grafu", "Resume plot"],
  plotWaiting: ["Čekám na číselná data…", "Waiting for numeric data…"],
  serialError: ["Port se nepodařilo otevřít nebo bylo spojení přerušeno. Zavři sériový monitor v Arduino IDE a dalších kartách a zkus příjem znovu.", "Could not open the port or the connection was interrupted. Close serial monitors in Arduino IDE and other tabs, then try again."],
  reloadHint: ["Obnoví stránku a zachová rozpracovaný program.","Reloads the page and keeps your current program."],
  clearBlocks: ["Vymazat bloky","Clear blocks"], clearCode: ["Vymazat kód","Clear code"],
  confirmClear: ["Vymazat aktuální program? Před vymazáním si ho můžeš uložit přes Soubor.","Clear the current program? You can save it using File first."],
  confirmNew: ["Začít nový projekt? Současné bloky, kód a přidané knihovny budou nahrazeny prázdným projektem.","Start a new project? Current blocks, code and added libraries will be replaced with an empty project."],
  saveFailure: ["Projekt se nepodařilo uložit. Před obnovením ho stáhni přes Soubor.","Could not save the project. Download it using File before reloading."],
  compilingHint: ["Kompilace… První spuštění může trvat déle.","Compiling… The first build may take longer."],

  ramStatic: ["RAM · statická", "RAM · static"], ramOled: ["RAM · data + OLED", "RAM · data + OLED"],
  ramDetail: ["Statická data a vyhrazený buffer OLED. Zásobník a další dynamické alokace nejsou zahrnuté.", "Static data and reserved OLED buffer. Stack and other dynamic allocations are not included."],
  tools: ["Pokročilý režim", "Advanced mode"], simpleMode: ["Jednoduchý režim", "Simple mode"],
  exampleLoading: ["Načítání ukázky…", "Loading example…"],
  exampleLoaded: ["Ukázka načtena", "Example loaded"],
  exampleLoadError: ["Ukázkový program se nepodařilo načíst. Obnov stránku nebo otevři jeho soubor .ino.", "Could not load the example. Reload or open its .ino file."],
  focus: ["Zvětšit editor", "Expand editor"], unfocus: ["Zpět na web", "Back to website"],
  removeLibrary: ["Odebrat", "Remove"], libraryAdded: ["Knihovna je připravená. Použij její #include v programu.", "Library ready. Use its #include in your program."],
  LIBRARY_LIMIT: ["Knihovny jsou příliš velké: nejvýše 8 knihoven, 160 souborů, 12 C++ zdrojů a 2 MB kódu včetně ShieldioDisplay.", "Library limits: 8 libraries, 160 files, 12 C++ sources and 2 MB of code including ShieldioDisplay."],
  LIBRARY_FORMAT: ["Vyber kořenovou složku jedné knihovny s hlavičkami a C++ zdroji.", "Choose the root folder of one library containing headers and C++ sources."],
  LIBRARY_ARCH: ["Tato knihovna není určená pro AVR / Arduino Nano.", "This library does not support AVR / Arduino Nano."],
  LIBRARY_LANGUAGE: ["Tato knihovna obsahuje C, assembler nebo předkompilované objekty. Zatím podporujeme C++ a hlavičky.", "This library contains C, assembly or precompiled objects. Only C++ and headers are supported yet."],
  LIBRARY_PATH: ["Knihovna obsahuje nepodporovanou cestu k souboru.", "The library contains an unsupported file path."],
  LIBRARY_CONFLICT: ["Knihovna koliduje s připravenou nebo jinou vlastní knihovnou.", "The library conflicts with an included or another custom library."],
  ready: ["Připraveno", "Ready"],
  connected: ["Deska vybraná", "Board selected"],
  connect: ["Připojit desku", "Connect board"], disconnect: ["Odpojit", "Disconnect"],
  compiling: ["Kompilace…", "Compiling…"],
  compiled: ["Zkompilováno", "Compiled"],
  changed: ["Program změněn", "Program changed"],
  reset: ["Připojování…", "Connecting…"],
  write: ["Nahrávání…", "Uploading…"], verify: ["Ověřování…", "Verifying…"],
  done: ["Nahráno", "Uploaded"],
  cancelled: ["Zastaveno. Pokud už probíhalo nahrávání, spusť program na desce znovu.", "Stopped. If upload had started, run the program on the board again."],
  noPort: ["Deska nebyla vybraná. Zkus Spustit na desce znovu a vyber její USB port.", "No board selected. Choose Run on board again and select its USB port."],
  unsupported: ["Pro spuštění na RED otevři editor v Chrome nebo Edge na počítači.", "To run on RED, open the editor in desktop Chrome or Edge."],
  failure: ["Operace selhala", "Operation failed"],
  compileError: ["Chyba kompilace", "Compilation error"],
  errorsTitle: ["Chyba v programu", "Program error"],
  blockErrorContext: ["Tento kód vznikl z bloků. Uprav bloky a spusť kontrolu znovu.", "This code was generated from blocks. Edit the blocks, then check again."],
  goToLine: ["Přejít na řádek", "Go to line"],
  addClosingParen: ["Doplnit )", "Insert )"],
  fixApplied: ["Závorka je doplněná. Spusť kontrolu znovu.", "Parenthesis inserted. Check the program again."],
  formatted: ["Kód zarovnán", "Code formatted"],
  moreErrors: ["Další chyby jsou v technických podrobnostech. Nejdřív oprav první chybu.", "More errors are in the technical details. Fix the first error first."],
  fileLoaded: ["Program načten", "Program loaded"],
  codeUnavailable: ["Blokový editor se nenačetl. Obnov stránku nebo použij záložku Arduino C++.", "The block editor did not load. Reload or use the Arduino C++ tab."],
  errorGenerated: ["V blocích je chyba. Oprav ji podle zprávy pod výběrem součástky.", "There is a block error. Follow the message below the component selector."],
  codeChanged: ["Program se mezitím změnil. Spusť ho znovu.", "The program changed in the meantime. Run it again."],
  compileTimeout: ["Příprava trvá příliš dlouho. Zkontroluj internet a zkus to znovu.", "Preparation took too long. Check your internet connection and try again."],
  loadFailure: ["Kompilátor se nepodařilo načíst. Zkontroluj internet a povolení cdn.jsdelivr.net ve školní síti.", "Could not load the compiler. Check your connection and school access to cdn.jsdelivr.net."],
  FLASH_OVERFLOW: ["Program se nevejde do paměti vybrané desky. Zkrať ho.", "The program exceeds the selected board’s application memory. Reduce its size."],
  RAM_OVERFLOW: ["Programu a OLED displeji nestačí RAM desky. Zmenši pole, texty nebo počet proměnných.", "The program and OLED buffer exceed the board's RAM. Reduce arrays, strings or variables."],
  BOOTLOADER_SYNC: ["Deska neodpovídá. Zkus druhý bootloader, zkontroluj datový USB kabel a zavři sériový monitor v Arduino IDE.", "The board did not respond. Try the other bootloader, check the USB data cable and close Arduino IDE's Serial Monitor."],
  SERIAL_TIMEOUT: ["Deska přestala odpovídat. Zkontroluj kabel a nastavení bootloaderu a nahraj program znovu.", "The board stopped responding. Check the cable and bootloader setting, then upload again."],
  SERIAL_DISCONNECTED: ["USB deska byla odpojena. Připoj ji a vyber znovu.", "The USB board was disconnected. Reconnect and select it again."],
  WRONG_CHIP: ["Vybraná deska nemá ATmega328P. Tento editor podporuje klasické Uno R3, Nano a Shieldio RED.", "The selected board is not an ATmega328P. This editor supports classic Uno R3, Nano and Shieldio RED."],
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
let memorySnapshot = null;
let serialSending = false, proBoard = "red";
let serialChanging = false, serialStatusKey = "serialIdle", serialText = "", serialTimer = null;
const serialPlotter = new SerialPlotter();
let plotPaused = false, plotTimer = null;
let lastCompile = null, failedBuild = null, errorLine = null, renderedLineCount = 0;
const sourceInput = $("arduinoSource"), blocksPanel = $("blocksPanel"), codePanel = $("arduinoCodePanel");
const exampleFiles = {zviratko:"/assets/code/zviratko/zviratko.ino",digitalni_metr:"/assets/code/digitalni_metr/digitalni_metr.ino",ultrazvukovy_radar:"/assets/code/ultrazvukovy_radar/ultrazvukovy_radar.ino"};
const entryParams = new URLSearchParams(window.location?.search || "");
const requestedExample = entryParams.get("example");
const exampleId = Object.hasOwn(exampleFiles,requestedExample) ? requestedExample : null;
let sourceStorageKey = "shieldio-source-v1" + (exampleId ? ":example:" + exampleId : "");
const selectedBoard = () => $("boardSelect").value === "uno" ? "uno" : "nano";
const flashLimit = () => selectedBoard() === "uno" ? UNO_FLASH_BYTES : NANO_FLASH_BYTES;
const mode = () => $("codeTab").getAttribute("aria-selected") === "true" ? "code" : "blocks";
const source = () => mode() === "code" ? sourceInput.value : window.SHIELDIO_EDITOR?.getCode() || "";

const serialMonitor = new SerialMonitor({
  onText(text) {
    serialText = (serialText + text).slice(-65536);
    if (serialTimer === null) serialTimer = setTimeout(renderSerial, 80);
    if (!plotPaused && serialPlotter.append(text)) schedulePlot();
  },
  onError() { serialStatusKey = "serialError"; paintSerial(); },
  onClose() {
    if (serialStatusKey === "serialReading") serialStatusKey = "serialStopped";
    paintSerial();
  }
});
function renderSerial() {
  if (serialTimer !== null) clearTimeout(serialTimer);
  serialTimer = null;
  const output = $("serialOutput");
  output.textContent = serialText;
  if ($("serialAutoscroll").checked) output.scrollTop = output.scrollHeight;
}
function latestPlotValue(name) {
  for (let i = serialPlotter.samples.length - 1; i >= 0; i--) {
    const value = serialPlotter.samples[i].values[name];
    if (value !== undefined) return value;
  }
  return null;
}
function renderPlot() {
  if (plotTimer !== null) clearTimeout(plotTimer);
  plotTimer = null;
  const en = document.documentElement.lang === "en";
  const labels = serialPlotter.series.map((name, i) => {
    const item = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.style.backgroundColor = PLOT_COLORS[i];
    swatch.setAttribute("aria-hidden", "true");
    const value = latestPlotValue(name);
    const label = document.createElement("span");
    label.textContent = name + (value === null ? "" : ": " + value);
    item.append(swatch, label);
    return item;
  });
  $("plotLegend").replaceChildren(...labels);
  const count = serialPlotter.count;
  const running = serialMonitor.active;
  const state = plotPaused ? (en ? " · paused" : " · pozastaveno") :
    running ? (en ? " · receiving" : " · příjem běží") : "";
  $("plotStatus").textContent = (en ? count + " samples · " + serialPlotter.series.length + " channels" :
    count + " vzorků · " + serialPlotter.series.length + " řad") + state;
  if ($("serialPlotterPanel").open) {
    const auto = $("plotAutoScale").checked;
    const min = auto ? null : Number($("plotMin").value);
    const max = auto ? null : Number($("plotMax").value);
    drawSerialPlot($("serialPlotCanvas"), serialPlotter, { min, max, emptyLabel: t("plotWaiting") });
  }
}
function schedulePlot() {
  if (!$("serialPlotterPanel").open || plotTimer !== null) return;
  plotTimer = setTimeout(renderPlot, 80);
}
function paintPlotButtons() {
  $("plotConnectBtn").textContent = t(serialMonitor.active ? "serialStop" : "serialStart");
  $("plotConnectBtn").removeAttribute("data-i18n");
  $("plotConnectBtn").disabled = !supported || busy || serialChanging;
  $("plotBaud").disabled = busy || serialChanging || serialMonitor.active;
  $("plotPauseBtn").textContent = t(plotPaused ? "plotResume" : "plotPause");
  $("plotPauseBtn").removeAttribute("data-i18n");
}
function paintSerial() {
  $("serialConnectBtn").textContent = t(toolsOpen ? serialMonitor.active ? "serialStop" : "serialStart" : "serialSimpleConnect");
  $("serialConnectBtn").hidden = !toolsOpen && serialMonitor.active;
  $("serialSendBtn").disabled = !toolsOpen || !serialMonitor.active || busy || serialChanging || serialSending;
  $("serialSendInput").disabled = !toolsOpen || !serialMonitor.active || busy || serialSending;
  $("serialLineEnding").disabled = busy || serialSending;
  // Remove the static translation key after initialization; subsequent labels depend on state.
  $("serialConnectBtn").removeAttribute("data-i18n");
  $("serialConnectBtn").disabled = !supported || busy || serialChanging;
  $("serialBaud").disabled = busy || serialChanging || serialMonitor.active;
  $("serialStatus").textContent = t(supported ? !toolsOpen && ["serialIdle","serialStopped"].includes(serialStatusKey) ? "serialSimpleIdle" : serialStatusKey : "unsupported");
  $("serialStatus").dataset.error = String(serialStatusKey === "serialError");
  paintPlotButtons();
  if (!busy) {
    $("uploadBtn").disabled = !supported || serialChanging;
    $("connectBoardBtn").disabled = !supported || serialChanging;
  }
}
function inferSerialBaud() {
  const match = source().match(/\bSerial\.begin\s*\(\s*(\d+)\s*(?:UL|U|L)?\s*\)/i);
  const baud = match ? Number(match[1]) : 9600;
  return baud >= 300 && baud <= 250000 ? baud : 9600;
}
async function startSerial() {
  const baudRate = toolsOpen ? Number($("serialBaud").value) || 9600 : inferSerialBaud();
  if (!toolsOpen) {
    for (const id of ["serialBaud","plotBaud"]) {
      if (!Array.from($(id).options).some(option=>Number(option.value) === baudRate)) {
        const option=document.createElement("option");option.value=String(baudRate);option.textContent=String(baudRate);$(id).add(option);
      }
      $(id).value=String(baudRate);
    }
  }
  serialStatusKey = "serialOpening"; paintSerial();
  await serialMonitor.start(selectedPort, baudRate);
  if (serialMonitor.active) serialStatusKey = "serialReading";
  else if (serialStatusKey !== "serialError") serialStatusKey = "serialStopped";
  paintSerial();
}
$("serialConnectBtn").addEventListener("click", async () => {
  if (busy || serialChanging || !supported) return;
  serialChanging = true; paintSerial();
  try {
    if (serialMonitor.active) { await serialMonitor.stop(); serialStatusKey = "serialStopped"; }
    else {
      // Request permission directly from the click, before awaiting unrelated work.
      if (!selectedPort && !await selectPort()) return;
      await startSerial();
    }
  } catch (error) { serialStatusKey = error.name === "NotFoundError" ? "serialNoPort" : "serialError"; }
  finally { serialChanging = false; paintSerial(); paint(); }
});
$("serialMonitorPanel").addEventListener("toggle", async () => {
  if (!toolsOpen && $("serialMonitorPanel").open && selectedPort && !serialMonitor.active && !busy && !serialChanging) {
    serialChanging = true;paintSerial();
    try { await startSerial(); } catch { serialStatusKey="serialError"; }
    finally { serialChanging=false;paintSerial(); }
  }
  window.SHIELDIO_EDITOR?.resize();
});
async function sendSerial() {
  if (!toolsOpen || !serialMonitor.active || busy || serialChanging || serialSending) return;
  serialSending=true;$("serialSendStatus").textContent="";paintSerial();
  try {
    await serialMonitor.send($("serialSendInput").value,{lineEnding:$("serialLineEnding").value || "lf"});
    $("serialSendInput").value="";$("serialSendStatus").textContent=t("serialSent");
  } catch { $("serialSendStatus").textContent=t("serialSendError"); }
  finally { serialSending=false;paintSerial(); }
}
$("serialSendBtn").addEventListener("click",sendSerial);
$("serialSendInput").addEventListener("keydown",event => { if (event.key === "Enter") {event.preventDefault();sendSerial();} });
$("serialClearBtn").addEventListener("click", () => { serialText = ""; renderSerial(); });
$("serialBaud").addEventListener("change", () => { $("plotBaud").value = $("serialBaud").value; });
$("plotBaud").addEventListener("change", () => { $("serialBaud").value = $("plotBaud").value; });
$("plotConnectBtn").addEventListener("click", () => {
  if (busy || serialChanging || !supported) return;
  $("serialBaud").value = $("plotBaud").value;
  // Jeden Web Serial reader; synchronní click zachová oprávnění uživatelského gesta.
  $("serialConnectBtn").click();
});
$("plotPauseBtn").addEventListener("click", () => {
  plotPaused = !plotPaused;
  serialPlotter.partial = "";
  paintPlotButtons();
  renderPlot();
});
$("plotClearBtn").addEventListener("click", () => { serialPlotter.clear(); renderPlot(); });
$("plotAutoScale").addEventListener("change", () => {
  const fixed = !$("plotAutoScale").checked;
  $("plotMinLabel").hidden = !fixed;
  $("plotMaxLabel").hidden = !fixed;
  renderPlot();
});
for (const id of ["plotMin", "plotMax"]) $(id).addEventListener("input", renderPlot);
$("serialPlotterPanel").addEventListener("toggle", renderPlot);
window.addEventListener("resize", schedulePlot);
const menuIds = ["projectMenu", "connectionSettings", "projectFiles", "libraryManager"];
for (const id of menuIds) $(id).addEventListener("toggle", () => {
  if ($(id).open) for (const other of menuIds) if (other !== id) $(other).open = false;
});
document.addEventListener("click", event => {
  for (const id of menuIds) if (!$(id).contains(event.target)) $(id).open = false;
});

const projectCopy = {
  zviratko: {
    title: ["Oživ zvířátko na displeji.", "Bring an animal to the display."],
    expected: ["Bez stisku kočka spí. Tlačítko 1 ji rozveselí, tlačítko 2 ukáže překvapeného psa.", "The cat sleeps when no button is pressed. Button 1 makes it happy; button 2 shows a surprised dog."],
    change: ["Změň psa na lva nebo zkus jinou náladu. Co se stane při stisku obou tlačítek?", "Change the dog to a lion or try another mood. What happens when both buttons are pressed?"]
  },
  blikani: {
    title: ["Rozblikej zelenou LED.", "Make the green LED blink."],
    expected: ["Najdi zelenou LED na RED. Ve výchozím programu půl sekundy svítí a půl sekundy nesvítí.", "Find the green LED on RED. The starter program keeps it on for half a second, then off for half a second."],
    change: ["LED bliká? Změň obě čekání z 0,5 na 1 s, odhadni rozdíl a spusť program znovu.", "Is the LED blinking? Change both waits from 0.5 to 1 s, predict the difference and run it again."]
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
    title: ["Programování RED", "Program RED"],
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
  $("projectTitle").textContent = copy === projectCopy.own && $("boardSelect").value !== "red" && $("boardSelect").value ? (document.documentElement.lang === "en" ? "Program " : "Programování ") + (selectedBoard() === "uno" ? "Arduino Uno R3" : "Arduino Nano") : localized(copy.title);
  $("projectExpected").textContent = localized(copy.expected);
  $("projectExpected").hidden = copy === projectCopy.own;
  $("projectNext").hidden = true;
  $("projectNext").textContent = "";
}
function paintToolsButton() {
  const key = toolsOpen ? "simpleMode" : "tools";
  $("toggleToolsBtn").setAttribute("data-i18n", "programming." + key);
  $("toggleToolsBtn").textContent = t(key);
}
function setTools(open) {
  if (!open && mode() === "code") switchMode("blocks");
  if (toolsOpen === open) { window.SHIELDIO_EDITOR?.setExperienceMode?.(open ? "pro" : "simple"); return; }
  if (!open) { proBoard = $("boardSelect").value || "red"; $("boardSelect").value = "red"; $("serialPlotterPanel").open = false; }
  else {
    if (proBoard === "red" && $("blockProfileSelect").value === "universal") proBoard="nano";
    $("boardSelect").value = proBoard;
  }
  toolsOpen = open;
  $("serialPlotterPanel").hidden = !open;
  window.SHIELDIO_EDITOR?.setExperienceMode?.(open ? "pro" : "simple");
  window.SHIELDIO_EDITOR?.setBoard?.(selectedBoard());
  boardTargetChanged(false);
  paintSerial();
  $("programmingStudio").dataset.tools = open ? "open" : "closed";
  $("toggleToolsBtn").setAttribute("aria-expanded",String(open));
  paintToolsButton();
  window.SHIELDIO_EDITOR?.resize();
}
$("toggleToolsBtn").addEventListener("click", () => setTools(!toolsOpen));
window.addEventListener("shieldio:request-pro", () => setTools(true));
window.addEventListener("shieldio:project-import", () => {importedProject=true;paintProject();});

function boardTargetChanged(syncProfile = true) {
  cached=null;$("downloadHexBtn").disabled=true;clearMemory();clearCompilerErrors();
  const board=selectedBoard(), family=$("boardSelect").value || "red";
  $("bootloaderSelect").disabled = busy || board === "uno";
  if (board === "uno") $("bootloaderSelect").value = "115200";
  if ($("bootloaderSelect").options[0]) $("bootloaderSelect").options[0].textContent = board === "uno" ? "Uno R3 · Optiboot (115200)" : "Nano / RED · Optiboot (115200)";
  $("boardTarget").textContent = (board === "uno" ? "Uno R3" : "Nano") + " · ATmega328P · 16 MHz";
  if (syncProfile) {
    $("blockProfileSelect").value = family === "red" ? "red" : "universal";
    $("blockProfileSelect").dispatchEvent(new Event("change"));
  }
  window.SHIELDIO_EDITOR?.setBoard?.(board);
  $("blockFamilyLabel").textContent = family === "red" ? "Shieldio RED" : board === "uno" ? "Arduino Uno R3" : "Arduino Nano";
  if (!busy) status("changed");
}
$("boardSelect").addEventListener("change", () => { if (!busy) {proBoard=$("boardSelect").value;boardTargetChanged();} });

function clearMemory() { memorySnapshot=null; $("memoryUsage").hidden=true; }
function paintMemory() {
  $("memoryUsage").hidden=!memorySnapshot;
  if (!memorySnapshot) return;
  const {flash,ram,oled}=memorySnapshot;
  const locale=document.documentElement.lang==="en"?"en-US":"cs-CZ";
  const bytes=n=>n.toLocaleString(locale);
  for (const [kind,value,max] of [["flash",flash,flashLimit()],["ram",ram,2048]]) {
    $(kind+"Percent").textContent=Math.round(value/max*100)+" %";
    $(kind+"Bytes").textContent=bytes(value)+" / "+bytes(max)+" B";
    $(kind+"Usage").max=max;
    $(kind+"Usage").value=value;
    $(kind+"Usage").setAttribute("aria-valuetext",bytes(value)+" / "+bytes(max)+" B");
    $(kind+"Percent").title=bytes(value)+" / "+bytes(max)+" B";
  }
  $("ramLabel").textContent=t(oled?"ramOled":"ramStatic");
  $("ramUsage").setAttribute("aria-label",t(oled?"ramOled":"ramStatic"));
  $("ramUsage").setAttribute("title",t("ramDetail"));
}
function paint() {
  paintSerial();
  paintToolsButton();
  $("uploadStatus").textContent = t(statusKey);
  $("uploadStatus").hidden=false;
  if(statusKey==="compiling") $("uploadStatus").textContent=t("compilingHint");
  $("clearProjectBtn").textContent=t(mode()==="code"?"clearCode":"clearBlocks");
  $("reloadEditorBtn").title=t("reloadHint");
  $("uploadPercent").textContent=statusPercent===null?"":Math.round(statusPercent)+" %";
  $("uploadPercent").hidden=statusPercent===null;
  $("uploadProgress").hidden=false;
  const running=busy && ["compiling","reset","exampleLoading"].includes(statusKey);
  if(running) $("uploadProgress").removeAttribute("value");
  else if(statusPercent!==null) $("uploadProgress").value=statusPercent;
  else $("uploadProgress").value=["compiled","done"].includes(statusKey)?100:0;
  const stage=["compiling","compiled"].includes(statusKey)?"compile":statusKey==="write"||statusKey==="reset"?"write":statusKey==="verify"||statusKey==="done"?"verify":null;
  const order=["compile","write","verify"];
  for(const [i,id]of ["stageCompile","stageWrite","stageVerify"].entries()) {
    $(id).dataset.state=stage===order[i]?(["compiled","done"].includes(statusKey)?"done":"active"):stage && order.indexOf(stage)>i?"done":"idle";
    if(stage===order[i]) $(id).setAttribute("aria-current","step");else $(id).removeAttribute("aria-current");
  }
  $("programmingStudio").dataset.status=statusError?"error":statusKey;
  paintMemory();
  $("uploadStatus").dataset.error = String(statusError);
  $("connectBoardBtn").textContent = t(selectedPort ? "disconnect" : "connect");
  $("boardConnection").textContent = t(selectedPort ? "usbSelected" : supported ? "usbIdle" : "usbUnavailable");
  $("boardConnection").dataset.connected = String(Boolean(selectedPort));
  $("usbCompatibility").hidden = supported;
  $("uploadBtn").setAttribute("aria-describedby",supported ? "uploadStatus" : "usbCompatibility uploadStatus");
  $("focusEditorBtn").textContent = t(expanded ? "unfocus" : "focus");
  paintProject();
  renderCompilerErrors();
}
function status(key, error = false, percent = null) { statusKey = key; statusError = error; statusPercent = percent; paint(); }
function setBusy(value) {
  busy = value;
  for (const id of ["compileBtn", "uploadBtn", "connectBoardBtn", "bootloaderSelect", "blocksTab", "codeTab", "importSourceBtn", "downloadSourceBtn", "addLibraryBtn", "boardSelect", "blockProfileSelect", "moduleSelect", "advancedBlocksToggle", "loadBlocksBtn", "saveBlocksBtn", "formatSourceBtn", "toggleCommentBtn", "newProjectBtn", "clearProjectBtn", "reloadEditorBtn"]) $(id).disabled = value || (!supported && (id === "uploadBtn" || id === "connectBoardBtn"));
  $("downloadHexBtn").disabled = value || !cached || (cached.source !== source() || cached.board !== selectedBoard());
  $("bootloaderSelect").disabled = value || selectedBoard() === "uno";
  $("toggleToolsBtn").disabled = value;
  $("cancelBuildBtn").hidden = !value;
  $("customLibraryList").inert = value;
  blocksPanel.inert = value;
  codePanel.inert = value;
  $("compilerErrors").inert = value;
  $("uploadProgress").hidden = false;
  $("programmingStudio").dataset.busy = String(value);
  paintSerial();
  paintProject();
}
function invalidate() {
  if (failedBuild && failedBuild.source !== source()) {
    clearCompilerErrors();
    $("compilerDetails").hidden = true;
    if (!busy) status("changed");
  }
  if (cached && (cached.source !== source() || cached.board !== selectedBoard())) {
    cached = null;
    $("downloadHexBtn").disabled = true;
    clearMemory();
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
  invalidate();updateSourcePosition();paintProject();$("clearProjectBtn").textContent=t(isCode?"clearCode":"clearBlocks");
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
  if (renderedLineCount !== lines.length) {
    $("sourceLineNumbers").replaceChildren(...lines.map((_, i) => {
      const number = document.createElement("span"); number.textContent = i + 1;
      number.className = i + 1 === errorLine ? "is-error" : "";
      return number;
    }));
    renderedLineCount = lines.length;
  }
  const cursor = sourceInput.value.slice(0,sourceInput.selectionStart || 0).split("\n");
  $("sourcePosition").textContent = `${cursor.length}:${cursor.at(-1).length+1} · ${lines.length} ${document.documentElement.lang === "en" ? (lines.length === 1 ? "line" : "lines") : (lines.length === 1 ? "řádek" : lines.length < 5 ? "řádky" : "řádků")}`;
  paintErrorLine();
}
sourceInput.addEventListener("input", () => {invalidate();updateSourcePosition();try {localStorage.setItem(sourceStorageKey,sourceInput.value);} catch {}});
sourceInput.addEventListener("scroll", () => {$("sourceLineNumbers").scrollTop = sourceInput.scrollTop;paintErrorLine();});
for (const event of ["click","keyup","select"]) sourceInput.addEventListener(event, updateSourcePosition);
sourceInput.addEventListener("keydown", event => {
  if (busy || event.isComposing) return;
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
    event.preventDefault();formatSource();return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "/") {
    event.preventDefault();commentSource();return;
  }
  const edit = codeKeyEdit(sourceInput.value,sourceInput.selectionStart,sourceInput.selectionEnd,event);
  if (edit) {event.preventDefault();applySourceEdit(edit);}
});
window.addEventListener("shieldio:code-change", () => {invalidate();paintProject();});

function applySourceEdit(edit) {
  if (!edit || busy) return;
  const previous = sourceInput.value, scrollTop = sourceInput.scrollTop, scrollLeft = sourceInput.scrollLeft;
  if (edit.text !== previous) {
    let start = 0, end = previous.length, nextEnd = edit.text.length;
    while (start < end && start < nextEnd && previous[start] === edit.text[start]) start++;
    while (end > start && nextEnd > start && previous[end - 1] === edit.text[nextEnd - 1]) {end--;nextEnd--;}
    sourceInput.focus();sourceInput.setSelectionRange(start,end);
    // Native insertion keeps the edit in the textarea's undo history. The
    // fallback is for browsers which do not implement insertText on textareas.
    const inserted = document.execCommand?.("insertText",false,edit.text.slice(start,nextEnd));
    if (!inserted || sourceInput.value !== edit.text) sourceInput.value=edit.text;
    sourceInput.dispatchEvent(new Event("input"));
  }
  sourceInput.setSelectionRange(edit.start,edit.end);
  sourceInput.scrollTop=scrollTop;sourceInput.scrollLeft=scrollLeft;
  updateSourcePosition();
}
function formatSource() {
  if (busy) return;
  applySourceEdit(formatIndentation(sourceInput.value,sourceInput.selectionStart,sourceInput.selectionEnd));
  status("formatted");
}
function commentSource() {
  if (!busy) applySourceEdit(toggleLineComment(sourceInput.value,sourceInput.selectionStart,sourceInput.selectionEnd));
}
$("formatSourceBtn").addEventListener("click",formatSource);
$("toggleCommentBtn").addEventListener("click",commentSource);

function paintErrorLine() {
  const marker=$("sourceErrorLine");
  marker.hidden=!errorLine || mode()!=="code";
  if (marker.hidden) return;
  const style=window.getComputedStyle?.(sourceInput);
  const height=parseFloat(style?.lineHeight)||22.1;
  const top=(parseFloat(style?.paddingTop)||14)+(errorLine-1)*height-(sourceInput.scrollTop||0);
  marker.style.top=`${top}px`;marker.style.height=`${height}px`;
  marker.hidden=top<0 || top>=(sourceInput.clientHeight||10000);
}
function clearCompilerErrors() {
  failedBuild=null;errorLine=null;renderedLineCount=0;
  $("compilerErrors").hidden=true;$("compilerErrorList").replaceChildren();
  sourceInput.removeAttribute("aria-invalid");sourceInput.removeAttribute("aria-describedby");
  updateSourcePosition();
}
function goToDiagnostic(diagnostic) {
  if (busy || !failedBuild || failedBuild.mode!=="code" || sourceInput.value!==failedBuild.source || !diagnostic.inSketch) return;
  switchMode("code");
  const lines=sourceInput.value.split("\n");
  const offset=lines.slice(0,diagnostic.line-1).reduce((n,line)=>n+line.length+1,0)+Math.min(diagnostic.column-1,lines[diagnostic.line-1].length);
  sourceInput.focus();sourceInput.setSelectionRange(offset,Math.min(offset+1,sourceInput.value.length));
  const height=parseFloat(window.getComputedStyle?.(sourceInput)?.lineHeight)||22.1;
  sourceInput.scrollTop=Math.max(0,(diagnostic.line-4)*height);
  sourceInput.scrollLeft=Math.max(0,(diagnostic.column-30)*height*.6);
  $("sourceLineNumbers").scrollTop=sourceInput.scrollTop;
  errorLine=diagnostic.line;renderedLineCount=0;updateSourcePosition();
}
function renderCompilerErrors() {
  const panel=$("compilerErrors");
  panel.hidden=!failedBuild;
  if (!failedBuild) return;
  const lang=document.documentElement.lang==="en"?"en":"cs";
  $("compilerErrorHeading").textContent=t("errorsTitle");
  $("compilerErrorContext").hidden=failedBuild.mode!=="blocks" || !failedBuild.diagnostics.length;
  $("compilerErrorContext").textContent=t("blockErrorContext");
  const list=$("compilerErrorList");list.replaceChildren();
  if (!failedBuild.diagnostics.length) {
    const hint=document.createElement("p");hint.textContent=t(failedBuild.key);list.append(hint);
  }
  for (const diagnostic of failedBuild.diagnostics.slice(0,1)) {
    const item=document.createElement("div");item.className="programming-error-item";
    const heading=document.createElement("strong"),hint=document.createElement("p");
    const copy=describeDiagnostic(diagnostic,lang);heading.textContent=copy.title;hint.textContent=copy.hint;
    item.append(heading);
    const location=document.createElement("p");location.className="programming-error-location";
    location.textContent=`${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`;item.append(location);
    if (diagnostic.inSketch) {
      const snippet=document.createElement("pre");snippet.className="programming-error-snippet";
      snippet.textContent=failedBuild.source.split("\n")[diagnostic.line-1];item.append(snippet);
    }
    item.append(hint);
    if (failedBuild.mode==="code" && diagnostic.inSketch) {
      const actions=document.createElement("div");actions.className="programming-error-actions";
      const jump=document.createElement("button");jump.type="button";jump.textContent=t("goToLine")+" "+diagnostic.line;
      jump.addEventListener("click",()=>goToDiagnostic(diagnostic));actions.append(jump);
      if (diagnostic.fix) {
        const fix=document.createElement("button");fix.type="button";fix.textContent=t("addClosingParen");
        fix.addEventListener("click",()=>{
          if (!failedBuild || busy) return;
          const edit=applyDiagnosticFix(sourceInput.value,failedBuild.source,diagnostic.fix);
          if (!edit) return;
          applySourceEdit(edit);status("fixApplied");
        });actions.append(fix);
      }
      item.append(actions);
    }
    list.append(item);
  }
  $("compilerErrorMore").hidden=failedBuild.diagnostics.length<=1;
  $("compilerErrorMore").textContent=t("moreErrors");
  const editable=failedBuild.mode==="code" && failedBuild.source===sourceInput.value;
  errorLine=editable ? failedBuild.diagnostics.find(d=>d.inSketch)?.line || null : null;
  if (errorLine) {sourceInput.setAttribute("aria-invalid","true");sourceInput.setAttribute("aria-describedby","compilerErrorHeading");}
  renderedLineCount=0;updateSourcePosition();
}

async function selectPort() {
  if (!supported) throw new Error("unsupported");
  selectedPort = await navigator.serial.requestPort();
  disconnected = false;
  status("connected");
  return true;
}
$("connectBoardBtn").addEventListener("click", async () => {
  if (busy || serialChanging) return;
  if (selectedPort) {
    serialChanging = true; paintSerial();
    try { await serialMonitor.stop(); selectedPort = null; status("ready"); }
    catch { serialStatusKey = "serialError"; }
    finally { serialChanging = false; paintSerial(); }
    return;
  }
  setBusy(true); controller = new AbortController();
  try { await selectPort(); }
  catch (error) { if (error.name === "NotFoundError") status("noPort"); else showError(error); }
  finally { setBusy(false); controller = null; }
});
if (supported) navigator.serial.addEventListener("disconnect", event => {
  if ((event.port || event.target) !== selectedPort) return;
  selectedPort = null; disconnected = true;
  serialStatusKey = "serialError";
  void serialMonitor.stop().catch(() => {}).finally(paintSerial);
  controller?.abort();
  status("SERIAL_DISCONNECTED", true);
});

function compileInWorker(text, signal) {
  return new Promise((resolve, reject) => {
    worker = new Worker(new URL("./arduino-compiler-worker.mjs?v=20261113-friendly2", import.meta.url), { type: "module" });
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", cancel); worker?.terminate(); worker = null; };
    const cancel = () => { cleanup(); reject(new Error("CANCELLED")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("compileTimeout")); }, 120000);
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => { cleanup(); if(data.error) {const error = new Error(data.error);error.details=data.details;reject(error);} else resolve(data.result); };
    worker.onerror = event => { event.preventDefault(); cleanup(); reject(new Error("loadFailure")); };
    worker.postMessage({ source: text, libraries, board: selectedBoard() });
  });
}
async function compile(signal) {
  const text = source(), board = selectedBoard();
  lastCompile={source:text,mode:mode()};
  if (mode() === "blocks" && !window.SHIELDIO_EDITOR) throw new Error("codeUnavailable");
  if (mode() === "blocks" && window.SHIELDIO_EDITOR.getError()) throw new Error("errorGenerated");
  if (!text.trim()) throw new Error("HEX_EMPTY");
  if (cached?.source === text && cached.board === board) {
    const result=cached.result,oled=result.oledBufferBytes??(/Adafruit_SSD1306\.h/.test(text)?1024:0);
    memorySnapshot={flash:result.flashBytes,ram:result.ramBytes+oled,oled};status("compiled");return result;
  }
  status("compiling");
  $("uploadProgress").removeAttribute("value");
  const result = await compileInWorker(text, signal);
  if (!result.fitsTarget || result.flashBytes > flashLimit()) throw new Error("FLASH_OVERFLOW");
  const oledBytes = result.oledBufferBytes ?? (/Adafruit_SSD1306\.h/.test(text) ? 1024 : 0);
  if (result.ramBytes + oledBytes >= 2048) throw new Error("RAM_OVERFLOW");
  parseHex(result.hex, flashLimit());
  if (text !== source() || board !== selectedBoard()) throw new Error("codeChanged");
  cached = { source: text, board, result };
  $("downloadHexBtn").disabled = false;
  memorySnapshot={flash:result.flashBytes,ram:result.ramBytes+oledBytes,oled:oledBytes};
  $("compilerLog").textContent = result.stderr.join("\n");
  $("compilerDetails").hidden = false;
  status("compiled");
  return result;
}
function showError(error) {
  clearMemory();
  const log=[error.message,error.details].filter(Boolean).join("\n");
  const diagnostics=parseCompilerDiagnostics(log,lastCompile?.source||source());
  const key = disconnected ? "SERIAL_DISCONNECTED" : error.message === "CANCELLED" ? "cancelled" : messages[error.message] ? error.message : diagnostics.length ? "compileError" : "failure";
  failedBuild=key==="cancelled"?null:{source:lastCompile?.source||source(),mode:lastCompile?.mode||mode(),diagnostics,key};
  status(key, key !== "cancelled");
  const details = error.details || (messages[error.message] ? "" : (error.message || String(error)));
  $("compilerLog").textContent = details;
  $("compilerDetails").hidden = !details;
  $("compilerDetails").open = Boolean(details) && !diagnostics.length;
}
async function run(upload) {
  if (busy || serialChanging || serialSending || (upload && !supported)) return;
  let resumeSerial = false, uploaded = false;
  uploadRequested = upload;
  clearCompilerErrors();lastCompile=null;
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
      resumeSerial = serialMonitor.active || (!toolsOpen && $("serialMonitorPanel").open);
      if (resumeSerial) {
        await serialMonitor.stop();
        serialStatusKey = "serialPaused"; paintSerial();
      }
      controller.signal.throwIfAborted();
      await flashArduino(selectedPort, result.hex, {
        board: selectedBoard(),
        baudRate: selectedBoard() === "uno" ? 115200 : Number($("bootloaderSelect").value), signal: controller.signal,
        onProgress: (phase, percent) => {
          const progress=phase==="write"?percent/2:phase==="verify"?50+percent/2:phase==="done"?100:null;
          if (progress===null) $("uploadProgress").removeAttribute("value");
          else $("uploadProgress").value=progress;
          status(phase,false,progress);
        },
      });
      uploaded = true;
    }
  } catch (error) { showError(controller.signal.aborted && !disconnected ? new Error("CANCELLED") : error); }
  finally {
    if (resumeSerial && uploaded && selectedPort && !disconnected) {
      try { await startSerial(); } catch { serialStatusKey = "serialError"; }
    }
    uploadRequested = false; setBusy(false); controller = null;
  }
}
$("compileBtn").addEventListener("click", () => run(false));
$("uploadBtn").addEventListener("click", () => run(true));
$("cancelBuildBtn").addEventListener("click", () => controller?.abort());

const emptySketch = "void setup() {\n}\n\nvoid loop() {\n}\n";
function resetResults() {
  cached=null;lastCompile=null;clearMemory();clearCompilerErrors();
  $("downloadHexBtn").disabled=true;$("compilerDetails").hidden=true;
  $("compilerLog").textContent="";status("ready");updateSourcePosition();
}
function hasProjectContent() {
  return Boolean(window.SHIELDIO_EDITOR?.hasContent?.() || (sourceInput.value.trim() && sourceInput.value!==emptySketch));
}
$("clearProjectBtn").addEventListener("click", () => {
  if(busy) return;
  const content=mode()==="blocks"?window.SHIELDIO_EDITOR?.hasContent?.():sourceInput.value.trim() && sourceInput.value!==emptySketch;
  if(content && !window.confirm(t("confirmClear"))) return;
  if(mode()==="blocks") window.SHIELDIO_EDITOR?.clear();
  else {sourceInput.value=emptySketch;localStorage.setItem(sourceStorageKey,sourceInput.value);}
  resetResults();
});
$("newProjectBtn").addEventListener("click", () => {
  if(busy || (hasProjectContent() && !window.confirm(t("confirmNew")))) return;
  window.SHIELDIO_EDITOR?.clear(true);
  sourceStorageKey="shieldio-source-v1";sourceInput.value=emptySketch;
  localStorage.setItem(sourceStorageKey,sourceInput.value);
  libraries=[];paintLibraries();importedProject=true;
  window.history?.replaceState(null,"",window.location.pathname);
  switchMode("blocks");resetResults();
});
$("reloadEditorBtn").addEventListener("click", () => {
  if(busy) return;
  try {
    window.SHIELDIO_EDITOR?.persist();
    localStorage.setItem(sourceStorageKey,sourceInput.value);
  } catch { status("saveFailure",true);return; }
  window.location.reload();
});


function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("downloadHexBtn").addEventListener("click", () => { if (cached?.source === source() && cached.board === selectedBoard()) download(cached.result.hex, "shieldio_program.hex"); });
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
  cached=null;$("downloadHexBtn").disabled=true;clearMemory();status("changed");paintLibraries();
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
  if(event.key==="Escape") for (const id of menuIds) $(id).open = false;
  if(event.key==="Escape" && expanded) $("focusEditorBtn").click();
  if((event.ctrlKey || event.metaKey) && event.key==="Enter") {event.preventDefault();run(event.shiftKey);}
});
document.addEventListener("shieldio-lang-change", () => { paint(); renderPlot(); });
new MutationObserver(() => {paint();paintLibraries();updateSourcePosition();}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
setBusy(false); paint();updateSourcePosition();renderPlot();
window.SHIELDIO_EDITOR?.setExperienceMode?.("simple");
window.addEventListener("shieldio:editor-ready", () => window.SHIELDIO_EDITOR?.setExperienceMode?.(toolsOpen ? "pro" : "simple"));





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


