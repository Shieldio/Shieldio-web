import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
export async function runBlockTests(blocklyDir,domPackage,{search="",expectedModule=null,initialStore={},expectedDelay=500}={}){
  const require=createRequire(import.meta.url);
  const {DOMImplementation,DOMParser,XMLSerializer}=require(domPackage);
  const xml=new DOMImplementation().createDocument(null,null,null);
  class Element {
    constructor(id){this.id=id;this.value='';this.textContent='';this.checked=false;this.hidden=false;this.listeners={};this.attributes={};this.style={setProperty(){}};const classes=new Set();this.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,force){const next=force??!classes.has(c);next?classes.add(c):classes.delete(c);return next;}};}
    addEventListener(name,fn){(this.listeners[name] ||= []).push(fn);}
    async emit(name,event={}){for(const fn of this.listeners[name] || []) await fn(event);}
    setAttribute(k,v){this.attributes[k]=v;}
    getAttribute(k){return this.attributes[k];}
    click(){} focus(){}
  }
  const html=await fs.readFile(new URL('../instructions/blokovy-editor.html',import.meta.url),'utf8');
  const els=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
  const get=id=>{assert.ok(els.has(id),'Missing element '+id);return els.get(id);};
  get('blockProfileSelect').value='red';get('moduleSelect').value='red';
  let ready,workspace,toolbox,theme;
  const windowEvents = {};
  const storage=new Map(Object.entries(initialStore)),storageReads=[];
  const context=vm.createContext({console,setTimeout,clearTimeout,structuredClone,URLSearchParams,location:{search},
    Event:class{constructor(type){this.type=type;}},ResizeObserver:class{observe(){}},
    localStorage:{getItem(key){storageReads.push(key);return storage.get(key)??null;},setItem(key,value){storage.set(key,value);}},window:{addEventListener(name,fn){windowEvents[name]=fn;},dispatchEvent(){}},
    document:{documentElement:{lang:'cs',dataset:{}},getElementById:get,addEventListener(name,fn){if(name==='DOMContentLoaded')ready=fn;},createElement:()=>new Element('temp'),createElementNS:(ns,name)=>xml.createElementNS(ns,name)},DOMParser,XMLSerializer});
  for(const file of ['blockly_compressed.js','blocks_compressed.js','msg/cs.js'])vm.runInContext(await fs.readFile(blocklyDir+'/'+file,'utf8'),context);
  vm.runInContext(await fs.readFile(new URL('../assets/js/shieldio-blocks.js',import.meta.url),'utf8'),context);
  vm.runInContext(await fs.readFile(new URL('../assets/js/block-project-validation.js',import.meta.url),'utf8'),context);
  const Blockly=context.Blockly, api=context.window;
  Blockly.Events.disable();
  Blockly.inject=(container,options)=>{toolbox=options.toolbox;theme=options.theme;workspace=new Blockly.Workspace();workspace.updateToolbox=value=>{toolbox=value;};workspace.setTheme=value=>{theme=value;};workspace.zoomToFit=()=>{};workspace.cleanUp=()=>{};return workspace;};
  Blockly.svgResize=()=>{};
  for(const method of ['initSvg','render','moveBy'])Blockly.Block.prototype[method]=function(){};
  vm.runInContext(await fs.readFile(new URL('../assets/js/blockly-editor.js',import.meta.url),'utf8'),context);ready();
  const make=(type,profile='red')=>{
    const config=api.SHIELDIO_CREATE_TOOLBOX({profile,advanced:true}).contents.flatMap(c=>c.contents||[]).find(b=>b.type===type) || {type};
    return Blockly.serialization.blocks.append(config,workspace);
  };
  for (const category of api.SHIELDIO_CREATE_TOOLBOX({advanced:true}).contents) {
    for (const item of category.contents || []) {
      const block=workspace.newBlock(item.type);
      assert.equal(theme.blockStyles[block.getStyleName()].colourPrimary,category.colour,`${item.type} matches its toolbox category`);
      block.dispose();
    }
  }
  // Dragging reapplies BlockSvg.setStyle; a manually assigned block.hat is lost.
  // Exercise that real Blockly method, then the theme-change path, for both roots.
  for (const isDark of [false, true]) {
    windowEvents["shieldio:theme-change"]({detail:{theme:isDark ? "dark" : "light"}});
    for (const [type,style] of [["shieldio_setup","shieldio_start"],["shieldio_loop","shieldio_forever"]]) {
      const root = workspace.newBlock(type);
      assert.equal(root.getStyleName(),style);
      const rendered = {
        workspace:{getRenderer:()=>({getConstants:()=>({getBlockStyle:name=>theme.blockStyles[name]})})},
        svgGroup:{classList:{contains(){return false;},add(){},remove(){}}},
        pathObject:{setStyle(){}},applyColour(){},
      };
      for (let refresh=0;refresh<2;refresh++) {
        Blockly.BlockSvg.prototype.setStyle.call(rendered,style);
        assert.equal(rendered.hat,"cap",type+" keeps its hat on style refresh");
      }
      assert.equal(root.previousConnection,null);
      assert.equal(root.nextConnection,null);
      root.dispose();
    }
    const control = toolbox.contents.find(category=>category.name==="Řízení");
    assert.ok(control.contents.some(item=>item.type==="shieldio_if"));
    assert.ok(control.contents.some(item=>item.type==="shieldio_loop"));
    assert.ok(!toolbox.contents.find(category=>category.name==="Operátory").contents.some(item=>item.type==="shieldio_if"));
  }
  const roots=()=>{workspace.clear();const setup=make('shieldio_setup'),loop=make('shieldio_loop');return {setup,loop};};
  const regenerate=()=>{workspace.fireChangeListener({isUiEvent:false});assert.equal(api.SHIELDIO_EDITOR.getError(),null);return api.SHIELDIO_EDITOR.getCode();};
  const fixtures={};
  if(search.includes('preset=zviratko')) {
    fixtures.animalStarter=api.SHIELDIO_EDITOR.getCode();
    assert.match(fixtures.animalStarter,/ShieldioDisplay shieldioDisplay;/);
    assert.ok(!fixtures.animalStarter.includes('ShieldioCanvas'));
    for (const expression of ['Animal::Dog, ShieldioDisplay::Mood::Surprised','Animal::Cat, ShieldioDisplay::Mood::Happy','Animal::Cat, ShieldioDisplay::Mood::Sleepy']) assert.ok(fixtures.animalStarter.includes(expression));
    assert.match(fixtures.animalStarter,/#define BUTTON1 11/);
    assert.match(fixtures.animalStarter,/#define BUTTON2 12/);
  }
  if(!search && !Object.keys(initialStore).length) {
    assert.equal(api.SHIELDIO_EDITOR.getPresetId(),'blikani','A new visitor gets an observable first program');
    assert.match(api.SHIELDIO_EDITOR.getCode(),/digitalWrite\(LED_GREEN, HIGH\)/);
  }
  if(!search && initialStore['shieldio-workspace-v1']) {
    assert.equal(api.SHIELDIO_EDITOR.getPresetId(),null,'Existing manual work takes precedence over a starter');
    assert.equal(storage.get('shieldio-workspace-v1'),initialStore['shieldio-workspace-v1']);
  }

  if(expectedModule)assert.equal(get('moduleSelect').value,expectedModule,'Guide links select the requested RED module');
  if(search.includes('preset=blikani')){
    fixtures.blinkStarter=api.SHIELDIO_EDITOR.getCode();assert.match(fixtures.blinkStarter,/#define LED_GREEN 6/);assert.equal((fixtures.blinkStarter.match(new RegExp('delay\\('+expectedDelay+'\\)','g'))||[]).length,2);
    fixtures.blinkProject={workspace:Blockly.serialization.workspaces.save(workspace),profile:'red',module:'led',advanced:false};
    assert.deepEqual(storageReads.filter(key=>key.startsWith('shieldio-workspace-v1')),['shieldio-workspace-v1:preset:blikani'],'Starter restores its own saved edits');
  }
  if(search.includes('preset=zavora')) {
    fixtures.barrierStarter=api.SHIELDIO_EDITOR.getCode();
    assert.match(fixtures.barrierStarter,/shieldioDistanceCm = shieldioReadDistance/);
    assert.match(fixtures.barrierStarter,/duration == 0 \? NAN/);
    assert.match(fixtures.barrierStarter,/!isnan\(shieldioDistanceCm\)/);
    assert.match(fixtures.barrierStarter,/else \{/);
    assert.equal((fixtures.barrierStarter.match(/pulseIn\(/g)||[]).length,1);
  }
  if(search.includes('preset=parkovani')) {
    fixtures.parkingStarter=api.SHIELDIO_EDITOR.getCode();
    assert.match(fixtures.parkingStarter,/#include <ShieldioDisplay.h>/);
    assert.match(fixtures.parkingStarter,/#define LED_RED 5/);
    assert.match(fixtures.parkingStarter,/#define LED_GREEN 6/);
    assert.match(fixtures.parkingStarter,/shieldioDistanceCm < 15/);
    assert.match(fixtures.parkingStarter,/shieldioDistanceCm < 30/);
    assert.match(fixtures.parkingStarter,/No echo/);
  }
  get('blockProfileSelect').value='red';get('moduleSelect').value='all';await get('moduleSelect').emit('change');
  let {setup,loop}=roots();
  const led=make('shieldio_led'),wait=make('shieldio_wait');loop.getInput('LOOP').connection.connect(led.previousConnection);led.nextConnection.connect(wait.previousConnection);
  const placeholder=wait.getInputTargetBlock('MS');assert.ok(placeholder.isShadow());placeholder.setFieldValue(1250,'NUM');
  assert.match(regenerate(),/delay\(1250\)/);fixtures.LED=regenerate();
  const count=workspace.getAllBlocks(false).length;get('moduleSelect').value='servo';await get('moduleSelect').emit('change');
  assert.equal(workspace.getAllBlocks(false).length,count,'Module selection preserves the program');
  assert.ok(toolbox.contents.find(c=>c.name==='Servo').contents.some(b=>b.type==='shieldio_servo'));
  assert.ok(!toolbox.contents.some(c=>c.name==='LED'));
  for (const unavailable of ['yellow','pro']) {get('moduleSelect').value=unavailable;await get('moduleSelect').emit('change');assert.equal(get('moduleSelect').value,'red');}
  get('blockProfileSelect').value='universal';await get('blockProfileSelect').emit('change');assert.equal(get('moduleField').hidden,true);assert.equal(workspace.getAllBlocks(false).length,count);
  assert.ok(!toolbox.contents.some(c=>c.name==='Servo'));
  const arithmetic=make('math_arithmetic');arithmetic.getInputTargetBlock('A').setFieldValue(1000,'NUM');arithmetic.getInputTargetBlock('B').setFieldValue(2,'NUM');wait.getInput('MS').connection.connect(arithmetic.outputConnection);
  assert.match(regenerate(),/delay\(1000 \+ 2\)/,'A formula can replace the editable placeholder');
  arithmetic.dispose();assert.ok(wait.getInputTargetBlock('MS').isShadow(),'Removing a formula restores direct entry');
  const saved=Blockly.serialization.workspaces.save(workspace);delete saved.blocks.blocks.find(b=>b.type==='shieldio_loop').inputs.LOOP.block.next.block.inputs;
  get('loadBlocksInput').files=[{text:async()=>JSON.stringify(saved)}];await get('loadBlocksInput').emit('change');assert.match(regenerate(),/delay\(500\)/,'Old blank value inputs receive editable defaults');
  // Block projects are untrusted files. Invalid imports must never replace
  // working blocks or silently become firmware for the user's Nano.
  const importInput=get('loadBlocksInput'), originalCode=api.SHIELDIO_EDITOR.getCode();
  importInput.files=[{size:400001,text:async()=>{throw Error('Oversized file should not be read');}}];
  await importInput.emit('change');
  assert.match(get('editorStatus').textContent,/příliš velký/);
  assert.equal(api.SHIELDIO_EDITOR.getCode(),originalCode,'Oversized project retains previous code');
  const malicious=structuredClone(saved);
  malicious.blocks.blocks.push({type:'definitely_not_supported'});
  importInput.files=[{size:1000,text:async()=>JSON.stringify(malicious)}];
  await importInput.emit('change');
  assert.match(get('editorStatus').textContent,/neznámý nebo nepodporovaný blok/);
  assert.equal(api.SHIELDIO_EDITOR.getCode(),originalCode,'Unknown block retains previous code');
  ({setup,loop}=roots());
  const mode=make('arduino_pin_mode','universal'),serial=make('arduino_serial_begin','universal'),write=make('arduino_digital_write','universal'),delay=make('shieldio_wait'),print=make('arduino_serial_print','universal');
  setup.getInput('SETUP').connection.connect(mode.previousConnection);mode.nextConnection.connect(serial.previousConnection);
  loop.getInput('LOOP').connection.connect(write.previousConnection);write.nextConnection.connect(delay.previousConnection);delay.nextConnection.connect(print.previousConnection);
  fixtures.universal=regenerate();assert.match(fixtures.universal,/pinMode\(13, OUTPUT\)/);assert.match(fixtures.universal,/Serial.begin\(9600\)/);assert.ok(!/#define (?:LED_|TRIG|ECHO)|ShieldioDisplay|Servo\.h/.test(fixtures.universal));
  const variable=workspace.getVariableMap().createVariable('napeti');const set=make('variables_set');set.setFieldValue(variable.getId(),'VAR');serial.nextConnection.connect(set.previousConnection);assert.match(regenerate(),/float v_0 = 0/);assert.match(regenerate(),/v_0 = 0/);
  ({setup,loop}=roots());const oled=make('shieldio_oled_print');loop.getInput('LOOP').connection.connect(oled.previousConnection);fixtures.OLED=regenerate();assert.match(fixtures.OLED,/#include <ShieldioDisplay.h>/);assert.match(fixtures.OLED,/shieldioDisplay.text/);
  ({setup,loop}=roots());
  const direct=make('shieldio_oled_text');direct.setFieldValue('A"\\\\B','TEXT');
  loop.getInput('LOOP').connection.connect(direct.previousConnection);
  const directCode=regenerate();assert.ok(directCode.includes('ShieldioDisplay shieldioDisplay;'));
  assert.ok(!directCode.includes('ShieldioCanvas'));
  assert.ok(!direct.getInput('TEXT'),'Text is edited on the command, without a nested block');
  assert.ok(directCode.includes(api.SHIELDIO_ARDUINO_GENERATOR.forBlock.text(direct)[0]));
  ({setup,loop}=roots());
  const face=make('shieldio_oled_face');
  face.setFieldValue('Lion','ANIMAL');face.setFieldValue('Angry','MOOD');face.setFieldValue('true','BLINK');
  loop.getInput('LOOP').connection.connect(face.previousConnection);
  const faceCode=regenerate();
  assert.match(faceCode,/face\(ShieldioDisplay::Animal::Lion, ShieldioDisplay::Mood::Angry, true\)/);
  assert.ok(!faceCode.includes('ShieldioCanvas'));
  assert.ok(!faceCode.includes('.render()'));
  const displayToolbox=api.SHIELDIO_CREATE_TOOLBOX({module:'oled'});
  assert.deepEqual(Array.from(displayToolbox.contents.filter(c=>c.name.startsWith('Displej')).map(c=>c.name)),['Displej · text','Displej · zvířátka','Displej · kreslení']);
  ({setup,loop}=roots());
  let last=null;
  for(const type of ['shieldio_oled_clear','shieldio_oled_pixel','shieldio_oled_line','shieldio_oled_square','shieldio_oled_rect','shieldio_oled_circle']){
    const shape=make(type);(last?last.nextConnection:loop.getInput('LOOP').connection).connect(shape.previousConnection);
    if(type==='shieldio_oled_circle')shape.setFieldValue('true','FILL');
    last=shape;
  }
  fixtures.graphics=regenerate();
  assert.match(fixtures.graphics,/ShieldioCanvas shieldioDisplay;/);
  for(const call of ['pixel(64, 32)','line(0, 0, 127, 63)','rect(8, 8, 20, 20, false)','rect(8, 8, 32, 16, false)','circle(64, 32, 12, true)'])assert.ok(fixtures.graphics.includes(call),call);
  ({setup,loop}=roots());const servo=make('shieldio_servo');loop.getInput('LOOP').connection.connect(servo.previousConnection);fixtures.servo=regenerate();assert.match(fixtures.servo,/attach\(SERVO_PIN\)/);
  ({setup,loop}=roots());
  const sensorLoop=make('controls_whileUntil'),distanceCheck=make('logic_compare'),distance=make('shieldio_distance'),limit=make('math_number'),pause=make('shieldio_wait');
  sensorLoop.setFieldValue('WHILE','MODE');distanceCheck.setFieldValue('LT','OP');limit.setFieldValue(15,'NUM');pause.getInputTargetBlock('MS').setFieldValue(60,'NUM');
  distanceCheck.getInput('A').connection.connect(distance.outputConnection);distanceCheck.getInput('B').connection.connect(limit.outputConnection);
  sensorLoop.getInput('BOOL').connection.connect(distanceCheck.outputConnection);sensorLoop.getInput('DO').connection.connect(pause.previousConnection);loop.getInput('LOOP').connection.connect(sensorLoop.previousConnection);
  fixtures.distanceLoop=regenerate();assert.match(fixtures.distanceLoop,/while \(\(shieldioDistanceCm = shieldioReadDistance\(\), shieldioDistanceCm < 15\)\)/);
  const multiply=make('math_arithmetic'),sum=make('math_arithmetic');multiply.setFieldValue('MULTIPLY','OP');sum.getInputTargetBlock('B').setFieldValue(2,'NUM');multiply.getInput('A').connection.connect(sum.outputConnection);multiply.getInputTargetBlock('B').setFieldValue(3,'NUM');
  assert.match(api.SHIELDIO_ARDUINO_GENERATOR.blockToCode(multiply)[0],/\(1 \+ 2\) \* 3/);
  sum.setFieldValue('POWER','OP');assert.match(api.SHIELDIO_ARDUINO_GENERATOR.blockToCode(sum)[0],/^pow\(1, 2\)/);
  const text=make('text');text.setFieldValue('a\nb"\\','TEXT');assert.equal(api.SHIELDIO_ARDUINO_GENERATOR.blockToCode(text)[0],'"a\\012b\\"\\\\"');
  assert.ok(api.SHIELDIO_EDITOR.hasContent());
  api.SHIELDIO_EDITOR.clear(true);
  assert.equal(api.SHIELDIO_EDITOR.hasContent(),false);
  assert.equal(api.SHIELDIO_EDITOR.getPresetId(),null);
  assert.equal(workspace.getAllBlocks(false).length,2,'Reset keeps both entry blocks');
  api.SHIELDIO_EDITOR.persist();
  assert.ok(storage.get('shieldio-workspace-v1').includes('shieldio_setup'));
  workspace.dispose();console.log('Blockly: editable inputs, formula replacement, old project migration, module filtering, universal pins, variables, OLED, servo, precedence and string escaping passed.');return fixtures;
}
if(typeof process !== "undefined" && process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const fixtures=await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE);
  const blink=await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=blikani&module=led',expectedModule:'led'});
  fixtures.blinkStarter=blink.blinkStarter;
  await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{initialStore:{'shieldio-workspace-v1':JSON.stringify(blink.blinkProject)}});
  const edited=JSON.stringify(blink.blinkProject).replaceAll('"NUM":500','"NUM":750');
  await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=blikani',expectedModule:'led',expectedDelay:750,initialStore:{'shieldio-workspace-v1:preset:blikani':edited,'shieldio-workspace-v1':'unrelated manual project'}});
  await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=constructor'});
  await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?module=buzzer',expectedModule:'buzzer'});
  const barrier=await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=zavora'});
  const parking=await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=parkovani'});
  const pet=await runBlockTests(process.env.BLOCKLY_TEST_DIR,process.env.XMLDOM_TEST_PACKAGE,{search:'?preset=zviratko'});
  fixtures.animalStarter=pet.animalStarter;
  fixtures.barrierStarter=barrier.barrierStarter;fixtures.parkingStarter=parking.parkingStarter;
  if(process.env.BLOCKLY_FIXTURES)await fs.writeFile(process.env.BLOCKLY_FIXTURES,JSON.stringify(fixtures));
}

