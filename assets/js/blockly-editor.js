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
      fontStyle: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif", weight: "500", size: 12 },
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
        const ifB = ws.newBlock("shieldio_if");
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
    showPresetBanner("Nahrán startovní program pro tenhle projekt, uprav si ho, jak chceš.");
  }

  const codeEl = document.getElementById("generatedCode");
  const statusEl = document.getElementById("editorStatus");

  function detectFeatures() {
    const blocks = workspace.getAllBlocks(false);
    const types = new Set(blocks.map(block => block.type));
    const leds = new Set(blocks.filter(block => block.type === "shieldio_led").map(block => block.getFieldValue("COLOR")));
    const buttons = new Set(blocks.filter(block => block.type === "shieldio_button").map(block => block.getFieldValue("BTN")));
    return {
      leds,
      buttons,
      servo: types.has("shieldio_servo"),
      buzzer: types.has("shieldio_buzzer"),
      distance: types.has("shieldio_distance"),
      display: types.has("shieldio_oled_print") || types.has("shieldio_oled_clear"),
    };
  }

  function assembleSketch(setupBody, loopBody, features) {
    const includes = [];
    const defines = [];
    const globals = [];
    const helpers = [];
    const setup = [];

    if (features.servo) {
      includes.push("#include <Servo.h>");
      defines.push("#define SERVO_PIN 9");
      globals.push("Servo shieldioServo;");
      setup.push("shieldioServo.attach(SERVO_PIN);");
    }
    if (features.display) {
      includes.push("#include <Wire.h>", "#include <Adafruit_GFX.h>", "#include <Adafruit_SSD1306.h>");
      globals.push("// OLED 0,96\" (SSD1306): SDA=A4, SCL=A5", "Adafruit_SSD1306 shieldioDisplay(128, 64, &Wire, -1);");
      setup.push("shieldioDisplay.begin(SSD1306_SWITCHCAPVCC, 0x3C);", "shieldioDisplay.clearDisplay();", "shieldioDisplay.display();");
    }
    if (features.distance) {
      defines.push("#define TRIG 7", "#define ECHO 8");
      setup.push("pinMode(TRIG, OUTPUT);", "pinMode(ECHO, INPUT);");
      helpers.push(`float shieldioDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long trvani = pulseIn(ECHO, HIGH);
  return trvani * 0.0343 / 2;
}`);
    }
    if (features.buzzer) {
      defines.push("#define BUZZER 10");
      setup.push("pinMode(BUZZER, OUTPUT);");
    }
    [["LED_RED", 5], ["LED_GREEN", 6]].forEach(([name, pin]) => {
      if (features.leds.has(name)) {
        defines.push(`#define ${name} ${pin}`);
        setup.push(`pinMode(${name}, OUTPUT);`);
      }
    });
    [["BUTTON1", 11], ["BUTTON2", 12]].forEach(([name, pin]) => {
      if (features.buttons.has(name)) {
        defines.push(`#define ${name} ${pin}`);
        setup.push(`pinMode(${name}, INPUT); // externí pull-up na desce RED`);
      }
    });

    const preamble = [includes.join("\n"), defines.join("\n"), globals.join("\n"), helpers.join("\n\n")].filter(Boolean).join("\n\n");
    const autoSetup = setup.length ? setup.map(line => "  " + line).join("\n") + "\n" : "";
    return `// Vygenerováno blokovým editorem Shieldio, piny podle desky RED
${preamble ? preamble + "\n\n" : ""}void setup() {
${autoSetup}${indent(setupBody)}}

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
      codeEl.textContent = assembleSketch(setupBody, loopBody, detectFeatures());
      if (statusEl) { statusEl.textContent = ""; statusEl.classList.remove("error"); }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Chyba při generování kódu, zkus bloky poskládat jinak. (" + err.message + ")";
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
      btn.textContent = "Zkopírováno";
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

  function downloadFile(contents, type, filename) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  document.getElementById("saveBlocksBtn")?.addEventListener("click", () => {
    const data = Blockly.serialization.workspaces.save(workspace);
    downloadFile(JSON.stringify({ format: "shieldio-blocks-v1", workspace: data }, null, 2), "application/json", "shieldio_red_bloky.shieldio.json");
  });

  const loadInput = document.getElementById("loadBlocksInput");
  document.getElementById("loadBlocksBtn")?.addEventListener("click", () => loadInput?.click());
  loadInput?.addEventListener("change", async () => {
    const file = loadInput.files?.[0];
    if (!file) return;
    const backup = Blockly.serialization.workspaces.save(workspace);
    try {
      const parsed = JSON.parse(await file.text());
      const savedWorkspace = parsed && parsed.format === "shieldio-blocks-v1" ? parsed.workspace : parsed;
      if (!savedWorkspace || typeof savedWorkspace !== "object") throw new Error("Soubor neobsahuje pracovní plochu.");
      workspace.clear();
      Blockly.serialization.workspaces.load(savedWorkspace, workspace);
      if (!workspace.getBlocksByType("shieldio_setup", false).length || !workspace.getBlocksByType("shieldio_loop", false).length) {
        throw new Error("Chybí blok Při spuštění nebo Opakuj stále.");
      }
      workspace.cleanUp();
      regenerate();
      if (statusEl) { statusEl.textContent = "Blokový projekt byl načten."; statusEl.classList.remove("error"); }
    } catch (error) {
      workspace.clear();
      Blockly.serialization.workspaces.load(backup, workspace);
      if (statusEl) { statusEl.textContent = "Soubor se nepodařilo načíst: " + error.message; statusEl.classList.add("error"); }
    } finally {
      loadInput.value = "";
    }
  });

  // code panel is hidden by default so the blocks canvas gets the full width —
  // "Zobrazit kód" splits the view, "Skrýt kód" gives the canvas back its space
  const grid = document.getElementById("blocklyGrid");
  const toggleBtn = document.getElementById("toggleCodeBtn");
  const splitter = document.getElementById("blocklySplitter");
  let splitPercent = Math.min(75, Math.max(30, Number(localStorage.getItem("shieldio-blockly-split")) || 58));

  function applySplit(percent) {
    splitPercent = Math.min(75, Math.max(30, percent));
    grid.style.setProperty("--blockly-left", splitPercent + "%");
    splitter?.setAttribute("aria-valuenow", String(Math.round(splitPercent)));
    localStorage.setItem("shieldio-blockly-split", String(splitPercent));
    Blockly.svgResize(workspace);
  }
  applySplit(splitPercent);

  splitter?.addEventListener("pointerdown", event => {
    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);
  });
  splitter?.addEventListener("pointermove", event => {
    if (!splitter.hasPointerCapture(event.pointerId)) return;
    const rect = grid.getBoundingClientRect();
    applySplit(((event.clientX - rect.left) / rect.width) * 100);
  });
  splitter?.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    applySplit(splitPercent + (event.key === "ArrowRight" ? 2 : -2));
  });
  toggleBtn?.addEventListener("click", () => {
    const showing = grid.classList.toggle("code-visible");
    toggleBtn.textContent = showing ? "Skrýt kód" : "Zobrazit kód";
    toggleBtn.classList.toggle("active", showing);
    toggleBtn.setAttribute("aria-expanded", String(showing));
    Blockly.svgResize(workspace);
  });
});
