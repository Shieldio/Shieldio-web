import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../assets/js/block-project-validation.js", import.meta.url), "utf8");
const context = {window: {}};
vm.runInNewContext(code, context);
const {validateProject, LIMITS} = context.window.SHIELDIO_BLOCK_PROJECT;

const allowed = new Set(["shieldio_setup","shieldio_loop","shieldio_wait","math_number","variables_get"]);
const validate = project => validateProject(project, type => allowed.has(type));
const fresh = () => ({
  blocks: {languageVersion:0, blocks:[
    {type:"shieldio_setup",x:30,y:30},
    {type:"shieldio_loop",x:30,y:220,
      inputs:{LOOP:{block:{type:"shieldio_wait", inputs:{MS:{shadow:{type:"math_number",fields:{NUM:500}}}}}}}}
  ]},
});

test("accepts raw Blockly workspaces and Shieldio wrapper format", () => {
  const workspace = fresh();
  assert.ok(validate(workspace).workspace);
  const saved = {format:"shieldio-blocks-v1",workspace,profile:"universal",advanced:true};
  const result=validate(saved);
  assert.equal(result.workspace,workspace);
  assert.equal(result.profile,"universal");
  assert.equal(result.advanced,true);
  const legacy = {workspace:fresh(),profile:"red",module:"led",advanced:false};
  assert.ok(validate(legacy).workspace,"Older project exports must still load");
});

test("rejects unknown block types, duplicate roots and unsupported files", () => {
  const unknown=fresh();
  unknown.blocks.blocks.push({type:"arbitrary_js",x:0,y:0});
  assert.throws(()=>validate(unknown),/neznámý nebo nepodporovaný blok/);
  const root=fresh();
  root.blocks.blocks.push({type:"shieldio_loop"});
  assert.throws(()=>validate(root),/Při spuštění a jeden Opakuj stále/);
  assert.throws(()=>validate({format:"experimental",workspace:fresh()}),/nepodporovaný formát/);
  assert.throws(()=>validate({blocks:{blocks:[]}}),/neplatný počet bloků/);
});

test("rejects deep or oversized JSON objects before Blockly sees them", () => {
  const deep=fresh();
  let current=deep.blocks.blocks[1];
  for(let i=0;i<LIMITS.depth;i++){current.next={block:{type:"shieldio_wait"}};current=current.next.block;}
  assert.throws(()=>validate(deep),/příliš složitá struktura/);
  const huge=fresh();
  huge.variables=[{name:"a".repeat(LIMITS.text+1)}];
  assert.throws(()=>validate(huge),/příliš dlouhý text/);
  const crowded=fresh();
  crowded.blocks.blocks.push(...Array.from({length:LIMITS.blocks},()=>({type:"shieldio_wait"})));
  assert.throws(()=>validate(crowded),/neplatný počet bloků|příliš mnoho bloků/);
});

test("rejects prototype poisoning keys anywhere in project data", () => {
  const base=JSON.stringify(fresh());
  const polluted=JSON.parse(base);
  polluted.blocks.blocks[0].extraState=JSON.parse('{"__proto__":{"isAdmin":true}}');
  assert.throws(()=>validate(polluted),/nepovolený název položky/);
  const mutated=JSON.parse(base);
  mutated.blocks.blocks[1].inputs.LOOP.block.extraState=JSON.parse('{"constructor":{"prototype":{"x":true}}}');
  assert.throws(()=>validate(mutated),/nepovolený název položky/);
});

test("rejects malformed inputs and raw projects without both roots", () => {
  const broken=fresh();
  broken.blocks.blocks[1].inputs.LOOP.block.inputs={MS:{block:42}};
  assert.throws(()=>validate(broken),/neznámý nebo nepodporovaný blok/);
  const noSetup=fresh();noSetup.blocks.blocks.shift();
  assert.throws(()=>validate(noSetup),/Při spuštění a jeden Opakuj stále/);
});
