import test from 'node:test';
import assert from 'node:assert/strict';
import {toSpice,transfer,DEFAULT_ENGINE_URL} from '../spice-adapter.mjs';
import {examples} from '../examples.mjs';
test('SPICE používá lokální pevnou verzi jádra',()=>assert.match(DEFAULT_ENGINE_URL,/vendor\/eecircuit-engine-1\.8\.0\.mjs$/));
test('Všechna výuková analogová zapojení lze exportovat jako netlist',()=>{
 for(const e of examples){const plan=toSpice(e.project,{mode:'tran'});assert.match(plan.netlist,/\.tran/);assert.match(plan.netlist,/\.end\n$/);assert.ok(!/NaN|undefined|Infinity/.test(plan.netlist),e.id);assert.ok(plan.compiled.nodeMap);}
});
test('SPICE AC a DC mají odlišná zadání a chrání rozsah',()=>{
 const p=examples.find(e=>e.id==='rc-lowpass').project;
 assert.match(toSpice(p,{mode:'op'}).netlist,/\.op/);
 assert.match(toSpice(p,{mode:'ac',start:10,stop:1e10,points:200}).netlist,/\.ac dec/);
 assert.throws(()=>toSpice(p,{mode:'ac',stop:1e11}),/Neplatný AC rozsah/);
 assert.throws(()=>toSpice(p,{mode:'tran',duration:1,step:1e-9}),/30 000/);
});
test('SPICE přenos počítá komplexní podíl vstupu a výstupu',()=>{
 const r=transfer({dataType:'complex',data:[{name:'frequency',type:'frequency',values:[{real:100,img:0}]},{name:'v(in)',values:[{real:2,img:0}]},{name:'v(out)',values:[{real:1,img:-1}]}]},'v(out)','v(in)')[0];
 assert.ok(Math.abs(r.gainDb+3.01029995664)<1e-8);assert.equal(r.phase,-45);
});
