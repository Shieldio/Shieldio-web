// Shieldio — custom Blockly blocks + Arduino C++ generator, scoped to the real RED board pin map
// (read directly off the physical board silkscreen: D5 LED RED, D6 LED GREEN, D7 TRIG, D8 ECHO,
// D9 Servo, D10 Buzzer, D11 Button 1, D12 Button 2). OLED is intentionally left out for now —
// its exact wiring hasn't been confirmed, and this project doesn't fabricate pin assignments.

(function () {
  const RED = "#f72338";

  // ---------- block definitions ----------

  Blockly.Blocks["shieldio_program"] = {
    init: function () {
      this.appendDummyInput().appendField("Shieldio RED program");
      this.appendStatementInput("SETUP").setCheck(null).appendField("nastavení (jednou)");
      this.appendStatementInput("LOOP").setCheck(null).appendField("opakovaně (smyčka)");
      this.setColour(RED);
      this.setDeletable(false);
      this.setMovable(false);
    },
  };

  Blockly.Blocks["shieldio_led"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("LED")
        .appendField(new Blockly.FieldDropdown([["červená", "LED_RED"], ["zelená", "LED_GREEN"]]), "COLOR")
        .appendField(new Blockly.FieldDropdown([["zapnout", "HIGH"], ["vypnout", "LOW"]]), "STATE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
      this.setTooltip("Rozsvítí nebo zhasne červenou/zelenou LED na desce.");
    },
  };

  Blockly.Blocks["shieldio_servo"] = {
    init: function () {
      this.appendValueInput("ANGLE").setCheck("Number").appendField("nastav servo na úhel");
      this.appendDummyInput().appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
      this.setInputsInline(true);
      this.setTooltip("Úhel 0–180°.");
    },
  };

  Blockly.Blocks["shieldio_buzzer"] = {
    init: function () {
      this.appendValueInput("FREQ").setCheck("Number").appendField("zahraj tón");
      this.appendDummyInput().appendField("Hz po dobu");
      this.appendValueInput("DURATION").setCheck("Number");
      this.appendDummyInput().appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
      this.setInputsInline(true);
      this.setTooltip("Přehraje tón na bzučáku danou frekvencí a délkou.");
    },
  };

  Blockly.Blocks["shieldio_button"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("tlačítko")
        .appendField(new Blockly.FieldDropdown([["1", "BUTTON1"], ["2", "BUTTON2"]]), "BTN")
        .appendField("je stisknuté");
      this.setOutput(true, "Boolean");
      this.setColour(RED);
      this.setTooltip("Pravda, pokud je dané tlačítko právě stisknuté.");
    },
  };

  Blockly.Blocks["shieldio_distance"] = {
    init: function () {
      this.appendDummyInput().appendField("vzdálenost (cm)");
      this.setOutput(true, "Number");
      this.setColour(RED);
      this.setTooltip("Aktuální vzdálenost naměřená ultrazvukovým senzorem.");
    },
  };

  Blockly.Blocks["shieldio_wait"] = {
    init: function () {
      this.appendValueInput("MS").setCheck("Number").appendField("počkej");
      this.appendDummyInput().appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
      this.setInputsInline(true);
    },
  };

  // ---------- Arduino generator ----------

  const arduino = new Blockly.Generator("Arduino");

  arduino.ORDER_ATOMIC = 0;
  arduino.ORDER_UNARY_POSTFIX = 1;
  arduino.ORDER_UNARY_PREFIX = 2;
  arduino.ORDER_MULTIPLICATIVE = 3;
  arduino.ORDER_ADDITIVE = 4;
  arduino.ORDER_RELATIONAL = 5;
  arduino.ORDER_LOGICAL_AND = 6;
  arduino.ORDER_LOGICAL_OR = 7;
  arduino.ORDER_NONE = 99;

  arduino.scrub_ = function (block, code, thisOnly) {
    const next = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = next && !thisOnly ? arduino.blockToCode(next) : "";
    return code + nextCode;
  };

  arduino.forBlock = arduino.forBlock || {};

  arduino.forBlock["shieldio_program"] = function (block) {
    // handled specially in generateSketch() below — the hat block itself emits nothing
    return "";
  };

  arduino.forBlock["shieldio_led"] = function (block) {
    const color = block.getFieldValue("COLOR");
    const state = block.getFieldValue("STATE");
    return `digitalWrite(${color}, ${state});\n`;
  };

  arduino.forBlock["shieldio_servo"] = function (block) {
    const angle = arduino.valueToCode(block, "ANGLE", arduino.ORDER_NONE) || "90";
    return `shieldioServo.write(${angle});\n`;
  };

  arduino.forBlock["shieldio_buzzer"] = function (block) {
    const freq = arduino.valueToCode(block, "FREQ", arduino.ORDER_NONE) || "440";
    const dur = arduino.valueToCode(block, "DURATION", arduino.ORDER_NONE) || "200";
    return `tone(BUZZER, ${freq}, ${dur});\n`;
  };

  arduino.forBlock["shieldio_button"] = function (block) {
    const btn = block.getFieldValue("BTN");
    return [`(digitalRead(${btn}) == LOW)`, arduino.ORDER_ATOMIC];
  };

  arduino.forBlock["shieldio_distance"] = function (block) {
    return ["shieldioDistance()", arduino.ORDER_ATOMIC];
  };

  arduino.forBlock["shieldio_wait"] = function (block) {
    const ms = arduino.valueToCode(block, "MS", arduino.ORDER_NONE) || "0";
    return `delay(${ms});\n`;
  };

  // -- standard blocks used from Blockly's core block library --

  arduino.forBlock["controls_if"] = function (block) {
    let n = 0;
    let code = "";
    do {
      const cond = arduino.valueToCode(block, "IF" + n, arduino.ORDER_NONE) || "false";
      const branch = arduino.statementToCode(block, "DO" + n);
      code += (n === 0 ? "if (" : "else if (") + cond + ") {\n" + branch + "}\n";
      n++;
    } while (block.getInput("IF" + n));
    if (block.getInput("ELSE")) {
      code += "else {\n" + arduino.statementToCode(block, "ELSE") + "}\n";
    }
    return code;
  };

  arduino.forBlock["logic_compare"] = function (block) {
    const OPERATORS = { EQ: "==", NEQ: "!=", LT: "<", LTE: "<=", GT: ">", GTE: ">=" };
    const op = OPERATORS[block.getFieldValue("OP")];
    const a = arduino.valueToCode(block, "A", arduino.ORDER_RELATIONAL) || "0";
    const b = arduino.valueToCode(block, "B", arduino.ORDER_RELATIONAL) || "0";
    return [`${a} ${op} ${b}`, arduino.ORDER_RELATIONAL];
  };

  arduino.forBlock["logic_operation"] = function (block) {
    const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
    const order = op === "&&" ? arduino.ORDER_LOGICAL_AND : arduino.ORDER_LOGICAL_OR;
    const a = arduino.valueToCode(block, "A", order) || "false";
    const b = arduino.valueToCode(block, "B", order) || "false";
    return [`${a} ${op} ${b}`, order];
  };

  arduino.forBlock["logic_negate"] = function (block) {
    const a = arduino.valueToCode(block, "BOOL", arduino.ORDER_UNARY_PREFIX) || "false";
    return [`!${a}`, arduino.ORDER_UNARY_PREFIX];
  };

  arduino.forBlock["logic_boolean"] = function (block) {
    return [block.getFieldValue("BOOL") === "TRUE" ? "true" : "false", arduino.ORDER_ATOMIC];
  };

  arduino.forBlock["math_number"] = function (block) {
    return [String(block.getFieldValue("NUM")), arduino.ORDER_ATOMIC];
  };

  arduino.forBlock["math_arithmetic"] = function (block) {
    const OPERATORS = { ADD: "+", MINUS: "-", MULTIPLY: "*", DIVIDE: "/" };
    const op = OPERATORS[block.getFieldValue("OP")] || "+";
    const a = arduino.valueToCode(block, "A", arduino.ORDER_ADDITIVE) || "0";
    const b = arduino.valueToCode(block, "B", arduino.ORDER_ADDITIVE) || "0";
    return [`${a} ${op} ${b}`, arduino.ORDER_ADDITIVE];
  };

  arduino.forBlock["controls_repeat_ext"] = function (block) {
    const times = arduino.valueToCode(block, "TIMES", arduino.ORDER_NONE) || "0";
    const branch = arduino.statementToCode(block, "DO");
    const i = "i_" + block.id.replace(/[^a-zA-Z0-9]/g, "");
    return `for (int ${i} = 0; ${i} < ${times}; ${i}++) {\n${branch}}\n`;
  };

  arduino.forBlock["controls_whileUntil"] = function (block) {
    const until = block.getFieldValue("MODE") === "UNTIL";
    let cond = arduino.valueToCode(block, "BOOL", arduino.ORDER_NONE) || "false";
    if (until) cond = `!(${cond})`;
    const branch = arduino.statementToCode(block, "DO");
    return `while (${cond}) {\n${branch}}\n`;
  };

  window.SHIELDIO_ARDUINO_GENERATOR = arduino;

  // ---------- toolbox ----------

  window.SHIELDIO_TOOLBOX = {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: "Shieldio RED",
        colour: RED,
        contents: [
          { kind: "block", type: "shieldio_led" },
          { kind: "block", type: "shieldio_servo" },
          { kind: "block", type: "shieldio_buzzer" },
          { kind: "block", type: "shieldio_button" },
          { kind: "block", type: "shieldio_distance" },
          { kind: "block", type: "shieldio_wait" },
        ],
      },
      {
        kind: "category",
        name: "Logika",
        colour: "%{BKY_LOGIC_HUE}",
        contents: [
          { kind: "block", type: "controls_if" },
          { kind: "block", type: "logic_compare" },
          { kind: "block", type: "logic_operation" },
          { kind: "block", type: "logic_negate" },
          { kind: "block", type: "logic_boolean" },
        ],
      },
      {
        kind: "category",
        name: "Cykly",
        colour: "%{BKY_LOOPS_HUE}",
        contents: [
          { kind: "block", type: "controls_repeat_ext" },
          { kind: "block", type: "controls_whileUntil" },
        ],
      },
      {
        kind: "category",
        name: "Matematika",
        colour: "%{BKY_MATH_HUE}",
        contents: [
          { kind: "block", type: "math_number" },
          { kind: "block", type: "math_arithmetic" },
        ],
      },
    ],
  };
})();
