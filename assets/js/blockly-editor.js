// Shieldio — block editor page glue: workspace, live code panel, download/copy

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("blocklyDiv");
  if (!container || typeof Blockly === "undefined") return;

  // Scratch/mBlock-style rounded blocks (Blockly's own "zelos" renderer) instead of
  // the default rectangular "geras" look, plus a theme matching Shieldio's palette
  const shieldioTheme = Blockly.Theme.defineTheme("shieldio", {
    base: Blockly.Themes.Classic,
    fontStyle: { family: "'Inter', -apple-system, sans-serif", weight: "500", size: 12 },
    componentStyles: {
      workspaceBackgroundColour: "#f5f5f7",
      toolboxBackgroundColour: "#ffffff",
      toolboxForegroundColour: "#1d1d1f",
      flyoutBackgroundColour: "#fbfbfd",
      flyoutForegroundColour: "#1d1d1f",
      flyoutOpacity: 1,
      scrollbarColour: "#d2d2d7",
      insertionMarkerColour: "#f72338",
      insertionMarkerOpacity: 0.3,
      cursorColour: "#f72338",
    },
  });

  const workspace = Blockly.inject(container, {
    toolbox: window.SHIELDIO_TOOLBOX,
    renderer: "zelos",
    theme: shieldioTheme,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 0.9 },
    grid: { spacing: 22, length: 2, colour: "#e5e5ea", snap: true },
  });

  // seed the workspace with the always-present root block
  const rootBlock = workspace.newBlock("shieldio_program");
  rootBlock.initSvg();
  rootBlock.render();
  rootBlock.moveBy(30, 30);

  const codeEl = document.getElementById("generatedCode");
  const statusEl = document.getElementById("editorStatus");

  function assembleSketch(setupBody, loopBody) {
    return `// Vygenerováno blokovým editorem Shieldio — piny podle desky RED
#include <Servo.h>

#define LED_RED 5
#define LED_GREEN 6
#define TRIG 7
#define ECHO 8
#define SERVO_PIN 9
#define BUZZER 10
#define BUTTON1 11
#define BUTTON2 12

Servo shieldioServo;

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
      const root = workspace.getBlocksByType("shieldio_program", false)[0];
      if (root) {
        const setupStart = root.getInputTargetBlock("SETUP");
        const loopStart = root.getInputTargetBlock("LOOP");
        setupBody = setupStart ? gen.blockToCode(setupStart) : "";
        loopBody = loopStart ? gen.blockToCode(loopStart) : "";
        if (Array.isArray(setupBody)) setupBody = setupBody[0];
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
});
