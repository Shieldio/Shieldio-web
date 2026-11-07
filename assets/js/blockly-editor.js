// Shieldio — block editor page glue: workspace, live code panel, download/copy

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("blocklyDiv");
  if (!container || typeof Blockly === "undefined") return;

  // Blockly 13 uses blocklyToolboxCategory (older TreeRow rules no longer apply).
  class ShieldioCategory extends Blockly.ToolboxCategory {
    addColourBorder_(colour) {
      super.addColourBorder_(colour);
      this.rowDiv_.style.setProperty("--block-category", colour);
    }
  }
  Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, ShieldioCategory, true);
  const palette = window.SHIELDIO_BLOCK_PALETTE;
  const blockStyle = (colour, hat) => ({
    colourPrimary: colour,
    colourSecondary: Blockly.utils.colour.blend("#000000", colour, 0.1),
    colourTertiary: Blockly.utils.colour.blend("#000000", colour, 0.2),
    ...(hat ? {hat} : {}),
  });

  // Scratch/mBlock-style rounded blocks (Blockly's own "zelos" renderer) instead of
  // the default rectangular "geras" look, plus a theme matching Shieldio's palette —
  // built fresh for light/dark so the workspace itself follows the site's theme toggle
  function buildShieldioTheme(isDark) {
    return Blockly.Theme.defineTheme("shieldio-" + (isDark ? "dark" : "light"), {
      base: Blockly.Themes.Zelos,
      blockStyles: {
        // Blockly reapplies styles when dragging and changing themes: keep hats in the style.
        shieldio_start: blockStyle(palette.start, "cap"),
        shieldio_forever: blockStyle(palette.control, "cap"),
        shieldio_hardware: blockStyle(palette.hardware),
        shieldio_pins: blockStyle(palette.pins),
        shieldio_serial: blockStyle(palette.serial),
        loop_blocks: blockStyle(palette.control),
        logic_blocks: blockStyle(palette.conditions),
        math_blocks: blockStyle(palette.values),
        text_blocks: blockStyle(palette.values),
        variable_blocks: blockStyle(palette.variables),
        variable_dynamic_blocks: blockStyle(palette.variables),
      },
      fontStyle: { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif", weight: "500", size: 13 },
      componentStyles: {
        workspaceBackgroundColour: isDark ? "#181b20" : "#fafbfc",
        toolboxBackgroundColour: isDark ? "#202329" : "#ffffff",
        toolboxForegroundColour: isDark ? "#f5f5f7" : "#1d1d1f",
        flyoutBackgroundColour: isDark ? "#272b33" : "#f3f5f8",
        flyoutForegroundColour: isDark ? "#f5f5f7" : "#1d1d1f",
        flyoutOpacity: 1,
        scrollbarColour: isDark ? "#48484a" : "#d2d2d7",
        insertionMarkerColour: "#0d9488",
        insertionMarkerOpacity: 0.3,
        cursorColour: "#0d9488",
      },
    });
  }

  const isDarkNow = document.documentElement.dataset.theme === "dark";

  const workspace = Blockly.inject(container, {
    toolbox: window.SHIELDIO_TOOLBOX,
    renderer: "zelos",
    theme: buildShieldioTheme(isDarkNow),
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 0.95, minScale: 0.35, maxScale: 2, scaleSpeed: 1.1 },
    move: {scrollbars:true,drag:true,wheel:true},
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
  const presetNumber = value => ({type:"math_number",fields:{NUM:value}});
  const presetCompare = (operator,limit) => ({type:"logic_compare",fields:{OP:operator},inputs:{A:{block:{type:"shieldio_distance"}},B:{shadow:presetNumber(limit)}}});
  function presetBlock(ws, state) {
    const block = Blockly.serialization.blocks.append(state, ws);
    return block;
  }
  const PRESETS = {
    blikani(ws, loop) {
      let previous = null;
      for (const [type,state] of [["shieldio_led","HIGH"],["shieldio_wait"],["shieldio_led","LOW"],["shieldio_wait"]]) {
        const block = ws.newBlock(type);block.initSvg();
        if (type === "shieldio_led") {block.setFieldValue("LED_GREEN","COLOR");block.setFieldValue(state,"STATE");}
        block.render();
        (previous ? previous.nextConnection : loop.getInput("LOOP").connection).connect(block.previousConnection);
        previous=block;
      }
    },
    zavora(ws, loop) {
      const init = presetBlock(ws, {type:"shieldio_servo", inputs:{ANGLE:{shadow:presetNumber(0)}}});
      setupBlock.getInput("SETUP").connection.connect(init.previousConnection);
      const decision = presetBlock(ws, {type:"shieldio_if", inputs:{
        IF0:{block:{type:"shieldio_distance_valid"}},
        DO0:{block:{type:"shieldio_if_else", inputs:{
          IF0:{block:presetCompare("LT",15)},
          DO0:{block:{type:"shieldio_servo",inputs:{ANGLE:{shadow:presetNumber(90)}}}},
          ELSE:{block:{type:"shieldio_servo",inputs:{ANGLE:{shadow:presetNumber(0)}}}}
        }}}
      }, next:{block:{type:"shieldio_wait",inputs:{MS:{shadow:presetNumber(60)}}}}});
      loop.getInput("LOOP").connection.connect(decision.previousConnection);
    },
    parkovani(ws, loop) {
      const led = (color,state,next) => ({type:"shieldio_led",fields:{COLOR:color,STATE:state},...(next?{next:{block:next}}:{})});
      const both = (red,green) => led("LED_RED",red,led("LED_GREEN",green));
      const decision = presetBlock(ws, {type:"shieldio_if_else",inputs:{
        IF0:{block:{type:"shieldio_distance_valid"}},
        DO0:{block:{type:"shieldio_oled_print",inputs:{TEXT:{block:{type:"shieldio_distance"}}},next:{block:{type:"shieldio_if_elseif_else",inputs:{
          IF0:{block:presetCompare("LT",15)}, DO0:{block:both("HIGH","LOW")},
          IF1:{block:presetCompare("LT",30)}, DO1:{block:both("LOW","HIGH")},
          ELSE:{block:both("LOW","LOW")}
        }}}}},
        ELSE:{block:{type:"shieldio_oled_print",inputs:{TEXT:{shadow:{type:"text",fields:{TEXT:"Bez echa/No echo"}}}},next:{block:both("LOW","LOW")}}}
      },next:{block:{type:"shieldio_wait",inputs:{MS:{shadow:presetNumber(100)}}}}});
      loop.getInput("LOOP").connection.connect(decision.previousConnection);
    },
  };

  const entryParams = new URLSearchParams(location.search);
  const requestedPreset = entryParams.get("preset");
  // A first visit starts with something observable. Existing manual work keeps its own storage.
  let hasManualWork = false;
  if (!requestedPreset && !entryParams.has("example")) {
    try { hasManualWork = Boolean(JSON.parse(localStorage.getItem("shieldio-workspace-v1") || "null")?.workspace); } catch {}
  }
  let presetId = Object.hasOwn(PRESETS, requestedPreset) ? requestedPreset
    : !requestedPreset && !entryParams.has("example") && !entryParams.has("module") && !entryParams.has("profile") && !hasManualWork ? "blikani" : null;
  let workspaceStorageKey = "shieldio-workspace-v1" + (presetId ? ":preset:" + presetId : "");
  if (presetId) {
    PRESETS[presetId](workspace, loopBlock);
    workspace.cleanUp();
  }

  const profileSelect = document.getElementById("blockProfileSelect");
  const moduleSelect = document.getElementById("moduleSelect");
  const advancedToggle = document.getElementById("advancedBlocksToggle");
  const moduleHelp = document.getElementById("moduleHelp");
  const hints = {
    all:["LED D5/D6 · tlačítka D11/D12 · senzor D7/D8 · servo D9 · bzučák D10 · OLED A4/A5", "LED D5/D6 · buttons D11/D12 · sensor D7/D8 · servo D9 · buzzer D10 · OLED A4/A5"],
    led:["Červená LED D5, zelená LED D6. Čas napiš přímo do políčka v bloku počkej.","Red LED D5, green LED D6. Type time directly into the wait block."],
    buttons:["Tlačítka D11 a D12 mají externí pull-up. Stisk je LOW.","Buttons D11 and D12 use external pull-ups. Pressed means LOW."],
    distance:["HC-SR04: TRIG D7, ECHO D8. Jeden vzorek pro celý průchod; bez echa je neplatný. Použij blok platnosti měření.","HC-SR04: TRIG D7, ECHO D8. One sample per loop; no echo is invalid. Use the measurement-valid block."],
    servo:["Servo D9. Úhel 0–180° zadáš přímo do bloku.","Servo D9. Type an angle from 0–180° directly into the block."],
    buzzer:["Bzučák D10. Frekvence v Hz, délka tónu v milisekundách.","Buzzer D10. Frequency in Hz, duration in milliseconds."],
    oled:["SSD1306 128×64 na A4/A5. ShieldioDisplay je připravená; text zatím bez diakritiky.","SSD1306 128×64 on A4/A5. ShieldioDisplay is included; text supports ASCII only."],
    universal:["Piny určuješ v blocích. Výběr nabídky nemění hotový program. Kompilace zatím cílí na Nano / ATmega328P.","Choose pins in the blocks. Changing the toolbox keeps your program. Compilation currently targets Nano / ATmega328P."],
  };
  function updateToolbox() {
    const profile = profileSelect.value || "red", module = "all";
    // YELLOW and PRO are placeholders; old component filters migrate to the RED family.
    moduleSelect.value = "red";
    workspace.updateToolbox(window.SHIELDIO_CREATE_TOOLBOX({profile,module,advanced:advancedToggle.checked}));
    document.getElementById("moduleField").hidden = profile !== "red";
    const hint = hints[profile === "universal" ? "universal" : module] || hints.all;
    moduleHelp.textContent = hint[document.documentElement.lang === "en" ? 1 : 0];
    Blockly.svgResize(workspace);
  }
  for (const control of [profileSelect,moduleSelect,advancedToggle]) control.addEventListener("change", updateToolbox);
  document.addEventListener("shieldio-lang-change", updateToolbox);
  document.getElementById("fitBlocksBtn").addEventListener("click", () => workspace.zoomToFit());
  new ResizeObserver(() => Blockly.svgResize(workspace)).observe(container);
  updateToolbox();

  // Each guide has its own saved project; opening it again keeps the visitor's edits.
  {
    const initial = Blockly.serialization.workspaces.save(workspace);
    try {
      const saved = JSON.parse(localStorage.getItem(workspaceStorageKey) || "null");
      if (saved?.workspace) {
        workspace.clear();Blockly.serialization.workspaces.load(saved.workspace, workspace);
        if (!workspace.getBlocksByType("shieldio_setup",false).length || !workspace.getBlocksByType("shieldio_loop",false).length) throw Error("Incomplete project");
        profileSelect.value = saved.profile === "universal" ? "universal" : "red";
        moduleSelect.value = "red";advancedToggle.checked = Boolean(saved.advanced);updateToolbox();
      }
    } catch {workspace.clear();Blockly.serialization.workspaces.load(initial,workspace);}
  }
  // Guide links adjust the toolbox without replacing the visitor's existing blocks.
  const entryModule = entryParams.get("module"), entryProfile = entryParams.get("profile");
  if (["all","led","buttons","distance","servo","buzzer","oled"].includes(entryModule)) {profileSelect.value="red";moduleSelect.value="red";}
  if (entryProfile === "universal") profileSelect.value="universal";
  if (presetId === "blikani") {profileSelect.value="red";moduleSelect.value="red";}
  updateToolbox();
  const projectState = () => ({format:"shieldio-blocks-v1",workspace:Blockly.serialization.workspaces.save(workspace),profile:profileSelect.value,module:moduleSelect.value,advanced:advancedToggle.checked});
  let saveTimer;
  function autosave() {
    clearTimeout(saveTimer);saveTimer=setTimeout(() => {try {const text=JSON.stringify(projectState());if(text.length < 400000)localStorage.setItem(workspaceStorageKey,text);} catch {}},200);
  }
  for (const control of [profileSelect,moduleSelect,advancedToggle]) control.addEventListener("change", autosave);
  const codeEl = document.getElementById("generatedCode");
  const statusEl = document.getElementById("editorStatus");
  let generationError = null;
  window.SHIELDIO_EDITOR = {
    getCode: () => codeEl.textContent,
    getError: () => generationError,
    getPresetId: () => presetId,
    resize: () => Blockly.svgResize(workspace),
    hasContent: () => workspace.getAllBlocks(false).some(block => !["shieldio_setup","shieldio_loop"].includes(block.type)),
    persist: () => {
      clearTimeout(saveTimer);
      localStorage.setItem(workspaceStorageKey, JSON.stringify(projectState()));
    },
    clear: (newProject = false) => {
      clearTimeout(saveTimer);
      Blockly.Events.setGroup(true);
      try {
        workspace.clear();
        for (const [type,y] of [["shieldio_setup",30],["shieldio_loop",220]]) {
          const root=workspace.newBlock(type);root.initSvg();root.render();root.moveBy(30,y);
        }
        if (newProject) {
          presetId=null;workspaceStorageKey="shieldio-workspace-v1";
          profileSelect.value="red";moduleSelect.value="red";advancedToggle.checked=false;updateToolbox();
        }
      } finally { Blockly.Events.setGroup(false); }
      regenerate();
      localStorage.setItem(workspaceStorageKey, JSON.stringify(projectState()));
      Blockly.svgResize(workspace);
    },
  };

  function detectFeatures() {
    const blocks = ["shieldio_setup", "shieldio_loop"].flatMap(type => workspace.getBlocksByType(type, false).flatMap(block => block.getDescendants(false)));
    const types = new Set(blocks.map(block => block.type));
    const leds = new Set(blocks.filter(block => block.type === "shieldio_led").map(block => block.getFieldValue("COLOR")));
    const buttons = new Set(blocks.filter(block => block.type === "shieldio_button").map(block => block.getFieldValue("BTN")));
    return {
      leds,
      buttons,
      servo: types.has("shieldio_servo"),
      buzzer: types.has("shieldio_buzzer"),
      distance: types.has("shieldio_distance") || types.has("shieldio_distance_valid"),
      display: [...types].some(type => type.startsWith("shieldio_oled_")),
      graphics: [...types].some(type => ["shieldio_oled_pixel","shieldio_oled_line","shieldio_oled_square","shieldio_oled_rect","shieldio_oled_circle"].includes(type)),
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
      includes.push("#include <ShieldioDisplay.h>");
      globals.push((features.graphics ? "ShieldioCanvas" : "ShieldioDisplay") + " shieldioDisplay;");
      setup.push("shieldioDisplay.begin();");
    }
    if (features.distance) {
      defines.push("#define TRIG 7", "#define ECHO 8");
      setup.push("pinMode(TRIG, OUTPUT);", "pinMode(ECHO, INPUT);");
      includes.push("#include <math.h>");
      globals.push("float shieldioDistanceCm = NAN;");
      helpers.push(`float shieldioReadDistance() {
  // One shared sample; no echo is invalid, never zero centimetres.
  // HC-SR04 needs a pause between trigger pulses, including in fast loops.
  static bool sampled = false;
  static unsigned long lastSampleAt = 0;
  static float lastDistance = NAN;
  unsigned long now = millis();
  if (sampled && (unsigned long)(now - lastSampleAt) < 60UL) return lastDistance;
  sampled = true;
  lastSampleAt = now;
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  unsigned long duration = pulseIn(ECHO, HIGH, 30000UL);
  lastDistance = duration == 0 ? NAN : duration * 0.0343f / 2.0f;
  return lastDistance;
}`);
      setup.push("shieldioDistanceCm = shieldioReadDistance();");
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

    workspace.getVariableMap().getAllVariables().forEach((variable, index) => globals.push(`float v_${index} = 0; // ${variable.name.replace(/[\r\n]/g, " ")}`));
    const preamble = [includes.join("\n"), defines.join("\n"), globals.join("\n"), helpers.join("\n\n")].filter(Boolean).join("\n\n");
    const autoSetup = setup.length ? setup.map(line => "  " + line).join("\n") + "\n" : "";
    return `// Vygenerováno v editoru Shieldio; piny jsou určeny použitými bloky.
${preamble ? preamble + "\n\n" : ""}void setup() {
${autoSetup}${indent(setupBody)}}

void loop() {
${features.distance ? "  shieldioDistanceCm = shieldioReadDistance();\n" : ""}${indent(loopBody)}}
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
      generationError = null;
      window.dispatchEvent(new Event("shieldio:code-change"));
      if (statusEl) { statusEl.textContent = ""; statusEl.classList.remove("error"); }
    } catch (err) {
      generationError = err;
      window.dispatchEvent(new Event("shieldio:code-change"));
      if (statusEl) {
        statusEl.textContent = "Chyba při generování kódu, zkus bloky poskládat jinak. (" + err.message + ")";
        statusEl.classList.add("error");
      }
    }
  }

  function fillDefaults(blocks) {
    for (const block of blocks) for (const [name,state] of Object.entries(window.SHIELDIO_INPUT_DEFAULTS[block.type] || {})) {
      const connection = block.getInput(name)?.connection;
      if (connection && !connection.targetBlock()) connection.setShadowState(structuredClone(state));
    }
  }
  workspace.addChangeListener((e) => {
    if (e.type === Blockly.Events.BLOCK_CREATE) fillDefaults((e.ids || []).map(id => workspace.getBlockById(id)).filter(Boolean));
    if (e.isUiEvent) return;
    regenerate();autosave();
  });
  fillDefaults(workspace.getAllBlocks(false));
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
    downloadFile(JSON.stringify(projectState(), null, 2), "application/json", "shieldio_red_bloky.shieldio.json");
  });

  // Imported projects are untrusted JSON. Bound both size and nesting before Blockly
  // traverses the structure to avoid freezing shared school computers.
  const MAX_IMPORTED_PROJECT_BYTES = 400000;
  function validateImportedProject(tree) {
    if (!tree || typeof tree !== "object" || Array.isArray(tree)) throw new Error("Soubor neobsahuje pracovní plochu.");
    const pending = [[tree, 0]];
    let visited = 0;
    while (pending.length) {
      const [value, depth] = pending.pop();
      if (++visited > 20000 || depth > 80) throw new Error("Projekt je příliš složitý nebo hluboce vnořený.");
      for (const child of Object.values(value)) {
        if (child && typeof child === "object") pending.push([child, depth + 1]);
      }
    }
  }
  const loadInput = document.getElementById("loadBlocksInput");
  document.getElementById("loadBlocksBtn")?.addEventListener("click", () => loadInput?.click());
  loadInput?.addEventListener("change", async () => {
    const file = loadInput.files?.[0];
    if (!file) return;
    const backup = Blockly.serialization.workspaces.save(workspace);
    try {
      if (file.size > MAX_IMPORTED_PROJECT_BYTES) throw new Error("Projekt přesahuje limit 400 kB.");
      const text = await file.text();
      if (text.length > MAX_IMPORTED_PROJECT_BYTES) throw new Error("Projekt přesahuje limit 400 kB.");
      const parsed = JSON.parse(text);
      const savedWorkspace = parsed && parsed.format === "shieldio-blocks-v1" ? parsed.workspace : parsed;
      validateImportedProject(savedWorkspace);
      workspace.clear();
      Blockly.serialization.workspaces.load(savedWorkspace, workspace);
      if (!workspace.getBlocksByType("shieldio_setup", false).length || !workspace.getBlocksByType("shieldio_loop", false).length) {
        throw new Error("Chybí blok Při spuštění nebo Opakuj stále.");
      }
      fillDefaults(workspace.getAllBlocks(false));
      if(parsed.profile) {profileSelect.value=parsed.profile === "universal" ? "universal" : "red";moduleSelect.value="red";advancedToggle.checked=Boolean(parsed.advanced);updateToolbox();}
      workspace.cleanUp();
      regenerate();autosave();
      window.dispatchEvent(new Event("shieldio:project-import"));
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
  let savedSplit = 58;
  try { savedSplit = Number(localStorage.getItem("shieldio-blockly-split")) || 58; } catch {}
  let splitPercent = Math.min(75, Math.max(30, savedSplit));

  function applySplit(percent) {
    splitPercent = Math.min(75, Math.max(30, percent));
    grid.style.setProperty("--blockly-left", splitPercent + "%");
    splitter?.setAttribute("aria-valuenow", String(Math.round(splitPercent)));
    try { localStorage.setItem("shieldio-blockly-split", String(splitPercent)); } catch {}
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

