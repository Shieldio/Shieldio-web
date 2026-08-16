// Shieldio — block editor page glue: workspace, live code panel, download/copy

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("blocklyDiv");
  if (!container || typeof Blockly === "undefined") return;

  // Scratch/mBlock-style rounded blocks (Blockly's own "zelos" renderer) instead of
  // the default rectangular "geras" look, plus a theme matching Shieldio's palette —
  // built fresh for light/dark so the workspace itself follows the site's theme toggle
  function buildShieldioTheme(isDark) {
    return Blockly.Theme.defineTheme("shieldio-" + (isDark ? "dark" : "light"), {
      base: Blockly.Themes.Classic,
      fontStyle: { family: "'Inter', -apple-system, sans-serif", weight: "500", size: 12 },
      componentStyles: {
        workspaceBackgroundColour: isDark ? "#1c1c1e" : "#f5f5f7",
        toolboxBackgroundColour: isDark ? "#000000" : "#ffffff",
        toolboxForegroundColour: isDark ? "#f5f5f7" : "#1d1d1f",
        flyoutBackgroundColour: isDark ? "#121214" : "#fbfbfd",
        flyoutForegroundColour: isDark ? "#f5f5f7" : "#1d1d1f",
        flyoutOpacity: 1,
        scrollbarColour: isDark ? "#48484a" : "#d2d2d7",
        insertionMarkerColour: "#f72338",
        insertionMarkerOpacity: 0.3,
        cursorColour: "#f72338",
      },
    });
  }

  const isDarkNow = document.documentElement.dataset.theme === "dark";

  const workspace = Blockly.inject(container, {
    toolbox: window.SHIELDIO_TOOLBOX,
    renderer: "zelos",
    theme: buildShieldioTheme(isDarkNow),
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 0.9 },
    grid: { spacing: 22, length: 2, colour: isDarkNow ? "#3a3a3c" : "#e5e5ea", snap: true },
  });

  window.addEventListener("shieldio:theme-change", (e) => {
    workspace.setTheme(buildShieldioTheme(e.detail.theme === "dark"));
  });

  // seed the workspace with the two always-present entry-point blocks —
  // separate hats for setup/loop, mirroring Arduino's own two functions
  const setupBlock = workspace.newBlock("shieldio_setup");
  setupBlock.initSvg();
  setupBlock.render();
  setupBlock.moveBy(30, 30);

  const loopBlock = workspace.newBlock("shieldio_loop");
  loopBlock.initSvg();
  loopBlock.render();
  loopBlock.moveBy(30, 220);

  // ---------- project presets ----------
  // a guide can link here with ?preset=<id> to drop the visitor straight into a
  // working starter program for that specific project, instead of a blank canvas
  const PRESETS = {
    zavora(ws, loop) {
      function ifServo(op, threshold, angle) {
        const ifB = ws.newBlock("controls_if");
        ifB.initSvg();
        ifB.render();

        const cmp = ws.newBlock("logic_compare");
        cmp.initSvg();
        cmp.render();
        cmp.setFieldValue(op, "OP");

        const dist = ws.newBlock("shieldio_distance");
        dist.initSvg();
        dist.render();
        cmp.getInput("A").connection.connect(dist.outputConnection);

        const threshNum = ws.newBlock("math_number");
        threshNum.initSvg();
        threshNum.render();
        threshNum.setFieldValue(threshold, "NUM");
        cmp.getInput("B").connection.connect(threshNum.outputConnection);

        ifB.getInput("IF0").connection.connect(cmp.outputConnection);

        const servo = ws.newBlock("shieldio_servo");
        servo.initSvg();
        servo.render();
        const angleNum = ws.newBlock("math_number");
        angleNum.initSvg();
        angleNum.render();
        angleNum.setFieldValue(angle, "NUM");
        servo.getInput("ANGLE").connection.connect(angleNum.outputConnection);

        ifB.getInput("DO0").connection.connect(servo.previousConnection);
        return ifB;
      }

      const openIf = ifServo("LT", 15, 90);
      const closeIf = ifServo("GTE", 15, 0);
      loop.getInput("LOOP").connection.connect(openIf.previousConnection);
      openIf.nextConnection.connect(closeIf.previousConnection);
    },
  };

  function showPresetBanner(text) {
    const banner = document.createElement("p");
    banner.className = "form-status success";
    banner.style.marginBottom = "16px";
    banner.textContent = text;
    document.getElementById("blocklyDiv")?.closest("section")?.querySelector(".wrap")?.prepend(banner);
  }

  const presetId = new URLSearchParams(location.search).get("preset");
  if (presetId && PRESETS[presetId]) {
    PRESETS[presetId](workspace, loopBlock);
    workspace.cleanUp();
    showPresetBanner("✓ Nahrán startovní program pro tenhle projekt — uprav si ho, jak chceš.");
  }

  const codeEl = document.getElementById("generatedCode");
  const statusEl = document.getElementById("editorStatus");

  function assembleSketch(setupBody, loopBody) {
    return `// Vygenerováno blokovým editorem Shieldio — piny podle desky RED
#include <Servo.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define LED_RED 5
#define LED_GREEN 6
#define TRIG 7
#define ECHO 8
#define SERVO_PIN 9
#define BUZZER 10
#define BUTTON1 11
#define BUTTON2 12
// OLED (0,96", SSD1306) běží po I2C na pevné sběrnici Nana — SDA=A4, SCL=A5

Servo shieldioServo;
Adafruit_SSD1306 shieldioDisplay(128, 64, &Wire, -1);

float shieldioDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long trvani = pulseIn(ECHO, HIGH);
  return trvani * 0.0343 / 2;
}

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUTTON1, INPUT_PULLUP);
  pinMode(BUTTON2, INPUT_PULLUP);
  shieldioServo.attach(SERVO_PIN);
  shieldioDisplay.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  shieldioDisplay.clearDisplay();
  shieldioDisplay.display();
${indent(setupBody)}}

void loop() {
${indent(loopBody)}}
`;
  }

  function indent(code) {
    if (!code.trim()) return "";
    return code
      .split("\n")
      .filter((l) => l.length)
      .map((l) => "  " + l)
      .join("\n") + "\n";
  }

  function regenerate() {
    const gen = window.SHIELDIO_ARDUINO_GENERATOR;
    let setupBody = "";
    let loopBody = "";
    try {
      const setupRoot = workspace.getBlocksByType("shieldio_setup", false)[0];
      const loopRoot = workspace.getBlocksByType("shieldio_loop", false)[0];
      if (setupRoot) {
        const setupStart = setupRoot.getInputTargetBlock("SETUP");
        setupBody = setupStart ? gen.blockToCode(setupStart) : "";
        if (Array.isArray(setupBody)) setupBody = setupBody[0];
      }
      if (loopRoot) {
        const loopStart = loopRoot.getInputTargetBlock("LOOP");
        loopBody = loopStart ? gen.blockToCode(loopStart) : "";
        if (Array.isArray(loopBody)) loopBody = loopBody[0];
      }
      codeEl.textContent = assembleSketch(setupBody, loopBody);
      if (statusEl) { statusEl.textContent = ""; statusEl.classList.remove("error"); }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Chyba při generování kódu — zkus bloky poskládat jinak. (" + err.message + ")";
        statusEl.classList.add("error");
      }
    }
  }

  workspace.addChangeListener((e) => {
    if (e.isUiEvent) return;
    regenerate();
  });
  regenerate();

  document.getElementById("copyCodeBtn")?.addEventListener("click", () => {
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      const btn = document.getElementById("copyCodeBtn");
      const original = btn.textContent;
      btn.textContent = "Zkopírováno ✓";
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  });

  document.getElementById("downloadCodeBtn")?.addEventListener("click", () => {
    const blob = new Blob([codeEl.textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shieldio_red_program.ino";
    a.click();
    URL.revokeObjectURL(url);
  });

  // code panel is hidden by default so the blocks canvas gets the full width —
  // "Zobrazit kód" splits the view, "Skrýt kód" gives the canvas back its space
  const grid = document.getElementById("blocklyGrid");
  const toggleBtn = document.getElementById("toggleCodeBtn");
  toggleBtn?.addEventListener("click", () => {
    const showing = grid.classList.toggle("code-visible");
    toggleBtn.textContent = showing ? "Skrýt kód" : "Zobrazit kód";
    toggleBtn.classList.toggle("active", showing);
    toggleBtn.setAttribute("aria-expanded", String(showing));
    Blockly.svgResize(workspace);
  });
});
