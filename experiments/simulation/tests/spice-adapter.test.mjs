import test from 'node:test';
import assert from 'node:assert/strict';
import {toSpice,transfer,runSpice,DEFAULT_ENGINE_URL} from '../spice-adapter.mjs';
import {examples} from '../examples.mjs';
test('SPICE používá lokální pevnou verzi jádra',()=>assert.match(DEFAULT_ENGINE_URL,/vendor\/eecircuit-engine-1\.8\.0\.mjs$/));
test('Všechna výuková analogová zapojení lze exportovat jako netlist',()=>{
 for(const e of examples){const plan=toSpice(e.project,{mode:'tran'});assert.match(plan.netlist,/\.tran/);assert.match(plan.netlist,/\.end\n$/);assert.ok(!/NaN|undefined|Infinity/.test(plan.netlist),e.id);assert.ok(plan.compiled.nodeMap);}
});
test('SPICE AC a DC mají odlišná zadání a chrání rozsah',()=>{
 const p=examples.find(e=>e.id==='rc-lowpass').project;
 assert.match(toSpice(p,{mode:'op'}).netlist,/\.op/);
 assert.doesNotMatch(toSpice(p,{mode:'op'}).netlist,/\.save all.*@/);
 assert.doesNotMatch(toSpice(p,{mode:'ac'}).netlist,/\.save all.*@/);
 assert.match(toSpice(p,{mode:'ac',start:10,stop:1e10,points:200}).netlist,/\.ac dec/);
 assert.throws(()=>toSpice(p,{mode:'ac',stop:1e11}),/Neplatný AC rozsah/);
 assert.throws(()=>toSpice(p,{mode:'tran',duration:1,step:1e-9}),/30 000/);
});
test('SPICE přenos počítá komplexní podíl vstupu a výstupu',()=>{
 const r=transfer({dataType:'complex',data:[{name:'frequency',type:'frequency',values:[{real:100,img:0}]},{name:'v(in)',values:[{real:2,img:0}]},{name:'v(out)',values:[{real:1,img:-1}]}]},'v(out)','v(in)')[0];
 assert.ok(Math.abs(r.gainDb+3.01029995664)<1e-8);assert.equal(r.phase,-45);
});

test('New diode models and external opamp supplies have SPICE representations',async()=>{const {examples}=await import('../examples.mjs');for(const id of ['zener','schottky','tunnel','opamp-noninverting']){const plan=toSpice(examples.find(e=>e.id===id).project,{mode:'op'});assert.ok(!plan.netlist.includes('undefined'),id);if(id==='zener')assert.match(plan.netlist,/Bbreak.*I=min/);if(id==='tunnel')assert.match(plan.netlist,/I=.*exp/);if(id==='opamp-noninverting')assert.match(plan.netlist,/Bdrv.*v\(n\d+\).*v\(n\d+\)/);}});


function currentSourceProject(type='idc',params={}){
 return {version:1,title:'Proudový zdroj',components:[
  {id:'I1',type,x:100,y:200,rotation:90,params:{value:.001,frequency:100,offset:.0002,phase:30,duty:.5,waveform:'sine',...params}},
  {id:'R1',type:'resistor',x:240,y:200,rotation:90,params:{value:1000}},
  {id:'G',type:'gnd',x:100,y:240,rotation:0,params:{}}
 ],wires:[{a:{x:100,y:160},b:{x:240,y:160}},{a:{x:100,y:240},b:{x:240,y:240}}],probes:[{id:'out',x:240,y:160,label:'U'}]};
}
test('DC current source uses a series ammeter with a-to-b polarity',async()=>{
 const p=currentSourceProject(),plan=toSpice(p,{mode:'op'}),part=plan.compiled.parts.find(c=>c.id==='I1');
 assert.ok(plan.netlist.includes(`I1 ${part.nodes.a} sense0 DC ${(.001).toExponential(12)} AC 0`));
 assert.match(plan.netlist,new RegExp(`Vsense0 sense0 ${part.nodes.b} DC 0`));
 assert.equal(plan.currentVectors.I1,'vsense0#branch');
 const engine={run:async()=>({dataType:'real',data:[{name:`v(${part.nodes.a})`,values:[-1]},{name:'vsense0#branch',values:[.001]},{name:'vsense1#branch',values:[-.001]}]})};
 const r=await runSpice(p,{mode:'op',engine});assert.equal(r.currents.I1,.001);assert.equal(r.currents.R1,-.001);
});
test('AC current generator waveform and measured current survive transient conversion',async()=>{
 const p=currentSourceProject('iac'),plan=toSpice(p,{mode:'tran',duration:.001,step:.0005}),part=plan.compiled.parts.find(c=>c.id==='I1');
 assert.match(plan.netlist,/I1 n[0-9]+ sense0 DC .* AC 0 SIN/);assert.match(plan.netlist,/Vsense0 sense0 0 DC 0/);
 assert.equal(plan.currentVectors.I1,'vsense0#branch');assert.notEqual(plan.currentVectors.I1,'i1#branch');
 const engine={run:async()=>({dataType:'real',data:[{name:'time',values:[0,.0005,.001]},{name:`v(${part.nodes.a})`,values:[-1,-2,-3]},{name:'vsense0#branch',values:[.001,.002,.003]},{name:'vsense1#branch',values:[-.001,-.002,-.003]}]})};
 const r=await runSpice(p,{mode:'tran',duration:.001,step:.0005,engine});
 assert.deepEqual(r.traces.find(t=>t.id==='I:I1').values,[.001,.002,.003]);assert.equal(r.final.currents.I1,.003);
});
test('Signed capacitor voltage and inductor current are preserved as SPICE initial conditions',()=>{
 for(const [type,param,value]of [['capacitor','initialVoltage',-2.5],['inductor','initialCurrent',-.003]]){
  const p=currentSourceProject();p.components[1]={...p.components[1],type,params:{value:type==='capacitor'?1e-6:.001,[param]:value}};
  const plan=toSpice(p,{mode:'tran'});assert.ok(plan.netlist.includes(`IC=${value.toExponential(12)}`));
  assert.equal(plan.compiled.parts.find(c=>c.id==='R1').params[param],value);
 }
});
test('Nonfinite initial conditions are rejected with the faulty component identified',()=>{
 for(const [type,param,label]of [['capacitor','initialVoltage','počáteční napětí'],['inductor','initialCurrent','počáteční proud']]){
  for(const value of [NaN,Infinity,-Infinity,'not-a-number']){
   const p=currentSourceProject();p.components[1]={...p.components[1],type,params:{value:type==='capacitor'?1e-6:.001,[param]:value}};
   assert.throws(()=>toSpice(p,{mode:'tran'}),new RegExp(`R1: ${label}`));
  }
 }
});
test('Numeric initial conditions normalize to finite numbers and current-source errors use amperes',()=>{
 const p=currentSourceProject();p.components[1]={...p.components[1],type:'capacitor',params:{value:1e-6,initialVoltage:'-1.25'}};
 assert.equal(toSpice(p,{mode:'tran'}).compiled.parts.find(c=>c.id==='R1').params.initialVoltage,-1.25);
 p.components[0].params.value=Infinity;assert.throws(()=>toSpice(p,{mode:'op'}),/I1: proud/);
});


import {DIODES} from '../diode-devices.mjs';
test('Named diode models carry physical rs as a separate series element in SPICE',()=>{
 for(const device of DIODES){
  const p=currentSourceProject();p.components[1]={...p.components[1],type:device.type,params:{...device.params}};
  const plan=toSpice(p,{mode:'op'}),part=plan.compiled.parts.find(c=>c.id==='R1');
  assert.ok(plan.netlist.includes(`Rseries1 ${part.nodes.a} junction1 ${device.params.rs.toExponential(12)}`),device.id);
  assert.ok(plan.netlist.includes('D2 junction1 sense1 DM1'),device.id);
  assert.equal(plan.currentVectors.R1,'vsense1#branch');assert.ok(!plan.netlist.includes('undefined'));
 }
});
test('Zener reverse slope remains rz and is not folded into forward rs',()=>{
 const d=DIODES.find(d=>d.type==='zener'),p=currentSourceProject();p.components[1]={...p.components[1],type:d.type,params:{...d.params}};
 const plan=toSpice(p,{mode:'op'});
 assert.ok(plan.netlist.includes(`Bbreak1 junction1 sense1 I=min((v(junction1,sense1)+${d.params.breakdown.toExponential(12)})/${d.params.rz.toExponential(12)},0)`));
 assert.ok(plan.netlist.includes('Rseries1 n1 junction1 2.000000000000e+0'));
 assert.doesNotMatch(plan.netlist,/RS=2.000000000000e\+1/);assert.doesNotMatch(plan.netlist,/BV=/);
});
test('Zero series resistance keeps the junction directly connected',()=>{
 const p=currentSourceProject();p.components[1]={...p.components[1],type:'diode',params:{value:1e-12,n:1.8,rs:0}};
 const plan=toSpice(p,{mode:'op'});assert.doesNotMatch(plan.netlist,/Rseries/);assert.match(plan.netlist,/D2 n[0-9]+ sense1 DM1/);
});
test('SPICE resampling avoids duplicate floating-point endpoint samples',async()=>{
 const p=currentSourceProject(),plan=toSpice(p,{mode:'tran',duration:.001,step:1e-6}),part=plan.compiled.parts.find(c=>c.id==='I1');
 const engine={run:async()=>({dataType:'real',data:[{name:'time',values:[0,.001]},{name:`v(${part.nodes.a})`,values:[-1,-1]},{name:'vsense0#branch',values:[.001,.001]},{name:'vsense1#branch',values:[-.001,-.001]}]})};
 const r=await runSpice(p,{mode:'tran',duration:.001,step:1e-6,engine});assert.equal(r.time.length,1001);assert.ok(r.time.every((t,i)=>!i||t>r.time[i-1]));assert.equal(r.time.at(-1),.001);
});
