// Shieldio — custom Blockly blocks + Arduino C++ generator, scoped to the real RED board pin map
// (read directly off the physical board silkscreen: D5 LED RED, D6 LED GREEN, D7 TRIG, D8 ECHO,
// D9 Servo, D10 Buzzer, D11 Button 1, D12 Button 2). OLED confirmed as a standard 0.96" SSD1306,
// I2C over the Nano's fixed hardware bus (SDA=A4, SCL=A5) — not something the board layout chooses,
// so it's safe to hardcode.

(function () {
  const RED = "#f72338";
  const GOLD = "#b7791f";
  const ORANGE = "#c05621";
  const SENSE_BLUE = "#2878a5";
  const OPERATOR_GREEN = "#21835a";

  // ---------- start blocks (two separate hats, not one combined block —
  // mirrors how Arduino itself splits setup()/loop(), and how Scratch uses
  // a distinct hat per entry point instead of one block with two slots) ----------

  Blockly.Blocks["shieldio_setup"] = {
    init: function () {
      this.appendDummyInput().appendField("▶ Když deska nastartuje");
      this.appendStatementInput("SETUP").setCheck(null);
      this.setColour(GOLD);
      this.hat = "cap";
      this.setDeletable(false);
      this.setTooltip("Proběhne jednou, hned po zapnutí desky.");
    },
  };

  Blockly.Blocks["shieldio_loop"] = {
    init: function () {
      this.appendDummyInput().appendField("↻ Opakuj pořád");
      this.appendStatementInput("LOOP").setCheck(null);
      this.setColour(ORANGE);
      this.hat = "cap";
      this.setDeletable(false);
      this.setTooltip("Opakuje se pořád dokola, dokud je deska zapnutá.");
    },
  };

  // ---------- Shieldio RED hardware blocks ----------

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
      this.setTooltip("Vzdálenost v cm ze společného vzorku. Bez echa je neplatná (NAN); ověř platnost měření.");
    },
  };

  Blockly.Blocks["shieldio_distance_valid"] = {
    init: function () {
      this.appendDummyInput().appendField(document.documentElement.lang === "en" ? "distance measurement is valid" : "měření vzdálenosti je platné");
      this.setOutput(true, "Boolean");
      this.setColour(RED);
      this.setTooltip(document.documentElement.lang === "en" ? "False when no echo is received. Distance is sampled once per loop." : "Nepravda, když senzor nevrátí echo. Vzdálenost se měří jednou pro celý průchod.");
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

  // Ready-made condition blocks replace Blockly's mutator gear. Pupils can
  // choose the shape they need directly instead of assembling it in a popup.
  function defineConditionBlock(type, withElseIf, withElse) {
    Blockly.Blocks[type] = {
      init: function () {
        this.appendValueInput("IF0").setCheck("Boolean").appendField("pokud");
        this.appendStatementInput("DO0").appendField("proveď");
        if (withElseIf) {
          this.appendValueInput("IF1").setCheck("Boolean").appendField("jinak pokud");
          this.appendStatementInput("DO1").appendField("proveď");
        }
        if (withElse) this.appendStatementInput("ELSE").appendField("jinak");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(SENSE_BLUE);
        this.setTooltip("Rozhodne, které příkazy se provedou podle zadané podmínky.");
      },
    };
  }
  defineConditionBlock("shieldio_if", false, false);
  defineConditionBlock("shieldio_if_else", false, true);
  defineConditionBlock("shieldio_if_elseif_else", true, true);

  // ---------- OLED (0.96", SSD1306, I2C over the Nano's fixed A4/A5 bus) ----------

  Blockly.Blocks["shieldio_oled_print"] = {
    init: function () {
      this.appendValueInput("TEXT").setCheck(null).appendField("napiš na displej");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
      this.setInputsInline(true);
      this.setTooltip("Vymaže displej a napíše na něj text nebo hodnotu.");
    },
  };

  Blockly.Blocks["shieldio_oled_clear"] = {
    init: function () {
      this.appendDummyInput().appendField("vymaž displej");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(RED);
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

  // the two hat blocks emit nothing themselves — generateSketch() in
  // blockly-editor.js reads their SETUP/LOOP statement inputs directly
  arduino.forBlock["shieldio_setup"] = function () { return ""; };
  arduino.forBlock["shieldio_loop"] = function () { return ""; };

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
    return ["shieldioDistanceCm", arduino.ORDER_ATOMIC];
  };

  arduino.forBlock["shieldio_distance_valid"] = () => ["!isnan(shieldioDistanceCm)", arduino.ORDER_UNARY_PREFIX];

  arduino.forBlock["shieldio_wait"] = function (block) {
    const ms = arduino.valueToCode(block, "MS", arduino.ORDER_NONE) || "0";
    return `delay(${ms});\n`;
  };

  arduino.forBlock["shieldio_oled_print"] = function (block) {
    const text = arduino.valueToCode(block, "TEXT", arduino.ORDER_NONE) || '\"\"';
    return `shieldioDisplay.clear();\nshieldioDisplay.text(0, 0, String(${text}).c_str());\nshieldioDisplay.render();\n`;
  };
  arduino.forBlock["shieldio_oled_clear"] = () => "shieldioDisplay.clear();\nshieldioDisplay.render();\n";

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
  ["shieldio_if", "shieldio_if_else", "shieldio_if_elseif_else"].forEach(type => {
    arduino.forBlock[type] = arduino.forBlock["controls_if"];
  });

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
    const op = block.getFieldValue("OP");
    if (op === "POWER") return [`pow(${arduino.valueToCode(block,"A",arduino.ORDER_NONE) || "0"}, ${arduino.valueToCode(block,"B",arduino.ORDER_NONE) || "0"})`, arduino.ORDER_ATOMIC];
    const order = ["MULTIPLY","DIVIDE"].includes(op) ? arduino.ORDER_MULTIPLICATIVE : arduino.ORDER_ADDITIVE;
    const a = arduino.valueToCode(block,"A",order) || "0", b = arduino.valueToCode(block,"B",order) || "0";
    if (op === "DIVIDE") return [`(double)(${a}) / (${b})`, order];
    return [`${a} ${{ADD:"+",MINUS:"-",MULTIPLY:"*",DIVIDE:"/"}[op] || "+"} ${b}`, order];
  };

  arduino.forBlock["text"] = function (block) {
    const raw = block.getFieldValue("TEXT") || "";
    const escaped = raw.replace(/[\\"\x00-\x1f\x7f]/g, c => c === "\\" || c === '\"' ? "\\"+c : "\\"+c.charCodeAt(0).toString(8).padStart(3,"0"));
    return [`"${escaped}"`, arduino.ORDER_ATOMIC];
  };

  const loopUsesDistance = block => block.getDescendants(false).some(child => ["shieldio_distance", "shieldio_distance_valid"].includes(child.type));
  arduino.forBlock["controls_repeat_ext"] = function (block) {
    const times = arduino.valueToCode(block, "TIMES", arduino.ORDER_NONE) || "0";
    const branch = arduino.statementToCode(block, "DO");
    const i = "i_" + block.id.replace(/[^a-zA-Z0-9]/g, "");
    const sample = loopUsesDistance(block) ? "  shieldioDistanceCm = shieldioReadDistance();\n" : "";
    return `for (int ${i} = 0; ${i} < ${times}; ${i}++) {\n${sample}${branch}}\n`;
  };

  arduino.forBlock["controls_whileUntil"] = function (block) {
    const until = block.getFieldValue("MODE") === "UNTIL";
    let cond = arduino.valueToCode(block, "BOOL", arduino.ORDER_NONE) || "false";
    if (until) cond = `!(${cond})`;
    if (loopUsesDistance(block)) cond = `(shieldioDistanceCm = shieldioReadDistance(), ${cond})`;
    const branch = arduino.statementToCode(block, "DO");
    return `while (${cond}) {\n${branch}}\n`;
  };

  const L = (cs, en) => document.documentElement.lang === "en" ? en : cs;
  Blockly.defineBlocksWithJsonArray([
    {type:"arduino_pin_mode",message0:L("nastav pin %1 jako %2","set pin %1 to %2"),args0:[{type:"input_value",name:"PIN",check:"Number"},{type:"field_dropdown",name:"MODE",options:[[L("výstup","output"),"OUTPUT"],[L("vstup","input"),"INPUT"],[L("vstup s pull-up","input pull-up"),"INPUT_PULLUP"]]}],previousStatement:null,nextStatement:null,colour:SENSE_BLUE},
    {type:"arduino_digital_write",message0:L("digitální pin %1 nastav %2","digital pin %1 write %2"),args0:[{type:"input_value",name:"PIN",check:"Number"},{type:"field_dropdown",name:"STATE",options:[["HIGH / 1","HIGH"],["LOW / 0","LOW"]]}],previousStatement:null,nextStatement:null,colour:SENSE_BLUE},
    {type:"arduino_digital_read",message0:L("pin %1 je HIGH","pin %1 is HIGH"),args0:[{type:"input_value",name:"PIN",check:"Number"}],output:"Boolean",colour:SENSE_BLUE},
    {type:"arduino_analog_read",message0:L("analogová hodnota pinu %1","analog value of pin %1"),args0:[{type:"input_value",name:"PIN",check:"Number"}],output:"Number",colour:SENSE_BLUE},
    {type:"arduino_pwm",message0:L("PWM na pinu %1 hodnota %2","PWM on pin %1 value %2"),args0:[{type:"input_value",name:"PIN",check:"Number"},{type:"input_value",name:"VALUE",check:"Number"}],inputsInline:true,previousStatement:null,nextStatement:null,colour:SENSE_BLUE,tooltip:L("Na Nano použij pin 3, 5, 6, 9, 10 nebo 11; hodnota 0–255.","On Nano use pin 3, 5, 6, 9, 10 or 11; value 0–255.")},
    {type:"arduino_pin",message0:L("označení pinu %1","pin label %1"),args0:[{type:"field_dropdown",name:"PIN",options:[...Array.from({length:8},(_,i)=>["A"+i,"A"+i]),["LED_BUILTIN","LED_BUILTIN"]]}],output:"Number",colour:SENSE_BLUE},
    {type:"arduino_serial_begin",message0:L("spusť sériovou linku %1 baud","start serial at %1 baud"),args0:[{type:"input_value",name:"BAUD",check:"Number"}],previousStatement:null,nextStatement:null,colour:GOLD},
    {type:"arduino_serial_print",message0:L("vypiš na sériovou linku %1","print to serial %1"),args0:[{type:"input_value",name:"TEXT"}],previousStatement:null,nextStatement:null,colour:GOLD},
    {type:"arduino_millis",message0:L("čas od startu (ms)","time since startup (ms)"),output:"Number",colour:ORANGE},
  ]);
  const value = (block,name,fallback) => arduino.valueToCode(block,name,arduino.ORDER_NONE) || fallback;
  arduino.forBlock.arduino_pin_mode = b => `pinMode(${value(b,"PIN","13")}, ${b.getFieldValue("MODE")});\n`;
  arduino.forBlock.arduino_digital_write = b => `digitalWrite(${value(b,"PIN","13")}, ${b.getFieldValue("STATE")});\n`;
  arduino.forBlock.arduino_digital_read = b => [`(digitalRead(${value(b,"PIN","2")}) == HIGH)`, arduino.ORDER_ATOMIC];
  arduino.forBlock.arduino_analog_read = b => [`analogRead(${value(b,"PIN","A0")})`, arduino.ORDER_ATOMIC];
  arduino.forBlock.arduino_pwm = b => `analogWrite(${value(b,"PIN","5")}, constrain(${value(b,"VALUE","128")}, 0, 255));\n`;
  arduino.forBlock.arduino_pin = b => [b.getFieldValue("PIN"), arduino.ORDER_ATOMIC];
  arduino.forBlock.arduino_serial_begin = b => `Serial.begin(${value(b,"BAUD","9600")});\n`;
  arduino.forBlock.arduino_serial_print = b => `Serial.println(${value(b,"TEXT",'""')});\n`;
  arduino.forBlock.arduino_millis = () => ["millis()", arduino.ORDER_ATOMIC];
  arduino.variableName = b => "v_" + b.workspace.getVariableMap().getAllVariables().findIndex(v => v.getId() === b.getFieldValue("VAR"));
  arduino.forBlock.variables_get = b => [arduino.variableName(b), arduino.ORDER_ATOMIC];
  arduino.forBlock.variables_set = b => `${arduino.variableName(b)} = ${value(b,"VALUE","0")};\n`;
  arduino.forBlock.math_change = b => `${arduino.variableName(b)} += ${value(b,"DELTA","1")};\n`;
  window.SHIELDIO_ARDUINO_GENERATOR = arduino;

  const number = n => ({type:"math_number",fields:{NUM:n}});
  const text = value => ({type:"text",fields:{TEXT:value}});
  const pinA0 = {type:"arduino_pin",fields:{PIN:"A0"}};
  const defaults = {
    shieldio_wait:{MS:number(500)}, shieldio_servo:{ANGLE:number(90)},
    shieldio_buzzer:{FREQ:number(440),DURATION:number(200)}, shieldio_oled_print:{TEXT:text("Ahoj!")},
    controls_repeat_ext:{TIMES:number(10)}, math_arithmetic:{A:number(1),B:number(1)},
    logic_compare:{A:number(0),B:number(10)}, math_change:{DELTA:number(1)}, variables_set:{VALUE:number(0)},
    arduino_pin_mode:{PIN:number(13)}, arduino_digital_write:{PIN:number(13)},
    arduino_digital_read:{PIN:number(2)}, arduino_analog_read:{PIN:pinA0},
    arduino_pwm:{PIN:number(5),VALUE:number(128)}, arduino_serial_begin:{BAUD:number(9600)},
    arduino_serial_print:{TEXT:text("Ahoj!")},
  };
  window.SHIELDIO_INPUT_DEFAULTS = defaults;
  const block = type => ({kind:"block",type,...(defaults[type] ? {inputs:Object.fromEntries(Object.entries(defaults[type]).map(([name,shadow])=>[name,{shadow}]))} : {})});
  const category = (name,colour,types) => ({kind:"category",name,colour,contents:types.map(block)});
  window.SHIELDIO_CREATE_TOOLBOX = ({profile="red",module="all",advanced=false} = {}) => {
    const modules = {led:["shieldio_led"],buttons:["shieldio_button"],distance:["shieldio_distance","shieldio_distance_valid"],servo:["shieldio_servo"],buzzer:["shieldio_buzzer"],oled:["shieldio_oled_print","shieldio_oled_clear"]};
    const contents = [category(L("Začátek","Start"),GOLD,["shieldio_setup","shieldio_loop"])];
    if(profile === "red") contents.push(category(L("Moduly RED","RED modules"),RED,module === "all" ? Object.values(modules).flat() : modules[module] || []));
    if(profile === "universal" || advanced) contents.push(category(L("Piny Arduino","Arduino pins"),SENSE_BLUE,["arduino_pin_mode","arduino_digital_write","arduino_digital_read","arduino_analog_read","arduino_pwm","arduino_pin"]));
    contents.push(category(L("Čas a cykly","Time and loops"),ORANGE,["shieldio_wait","controls_repeat_ext",...(advanced?["controls_whileUntil","arduino_millis"]:[])]));
    contents.push(category(L("Podmínky","Conditions"),SENSE_BLUE,["shieldio_if","shieldio_if_else","logic_compare",...(advanced?["shieldio_if_elseif_else","logic_operation","logic_negate","logic_boolean"]:[])]));
    contents.push(category(L("Hodnoty","Values"),OPERATOR_GREEN,["math_number","text",...(advanced?["math_arithmetic"]:[])]));
    if(advanced) {
      contents.push({kind:"category",name:L("Proměnné (čísla)","Variables (numbers)"),colour:OPERATOR_GREEN,custom:"VARIABLE"});
      contents.push(category(L("Sériová linka","Serial"),GOLD,["arduino_serial_begin","arduino_serial_print"]));
    }
    return {kind:"categoryToolbox",contents};
  };
  window.SHIELDIO_TOOLBOX = window.SHIELDIO_CREATE_TOOLBOX();
})();
