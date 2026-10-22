import test from 'node:test';
import assert from 'node:assert/strict';
import {examples,exampleAliases} from '../examples.mjs';
import {DIODES} from '../diode-devices.mjs';
import {compile,pinsFor,transient,diodeModel,catalog} from '../engine.mjs';
import {measurementSeries} from '../workbench-model.mjs';

const configs=[
 ['diode-iv-silicon','1n4148',2,100,0],
 ['diode-iv-schottky','bat54',2,100,0],
 ['diode-iv-zener','bzx55c5v1',8,390,180],
 ['diode-iv-led','ls-p47k',3,220,0]
];
const near=(a,b,tolerance,message)=>assert.ok(Math.abs(a-b)<tolerance,`${message}: ${a} ≠ ${b}`);
const measure=(p,r,id,kind)=>measurementSeries(p,{componentId:id,kind},r);

for(const [id,device,amplitude,resistance,rotation] of configs){
 test(`${id}: named model, one series loop and separate Y–t / XY instruments`,()=>{
  const p=examples.find(e=>e.id===id).project,profile=DIODES.find(d=>d.id===device);
  assert.ok(profile);assert.equal(p.mode,'analog');assert.equal(p.settings.duration,.08);
  assert.equal(p.components.length,5);assert.equal(p.components.filter(c=>c.type==='gnd').length,1);
  const source=p.components.find(c=>c.id==='V1'),diode=p.components.find(c=>c.id==='D1');
  assert.equal(source.params.value,amplitude);assert.equal(source.params.frequency,25);
  assert.equal(source.params.waveform,'triangle');assert.equal(source.params.offset,0);
  assert.equal(p.components.find(c=>c.id==='R1').params.value,resistance);
  assert.equal(p.components.find(c=>c.id==='RS').params.value,100);
  assert.equal(diode.rotation,rotation);assert.equal(diode.type,profile.type);
  for(const [key,value] of Object.entries(profile.params))assert.equal(diode.params[key],value);
  assert.equal(p.demo.kind,'diode-iv');assert.equal(p.demo.device,device);assert.equal(p.demo.method,'scope');
  assert.equal(p.scopes,2);assert.equal(p.scopeSettings[0].mode,'time');
  assert.equal(p.scopeSettings[1].mode,'xy');assert.equal(p.scopeSettings[1].xId,'ud');assert.equal(p.scopeSettings[1].yId,'id');
  assert.deepEqual(p.measurements.map(m=>[m.id,m.kind,m.scope]),[['ud','voltage',0],['id','current',0]]);
  const compiled=compile(p),pins=pinsFor(diode),left=pins.find(pin=>pin.id===(rotation===180?'b':'a'));
  assert.equal(left.x,580);assert.equal(left.y,240);
  // Every wire is orthogonal; no two wire interiors cross anywhere in this loop.
  for(const w of p.wires)assert.ok(w.a.x===w.b.x||w.a.y===w.b.y);
  for(const w of p.wires)for(const v of p.wires){
   if(w.a.y!==w.b.y||v.a.x!==v.b.x)continue;
   assert.ok(!(v.a.x>Math.min(w.a.x,w.b.x)&&v.a.x<Math.max(w.a.x,w.b.x)&&w.a.y>Math.min(v.a.y,v.b.y)&&w.a.y<Math.max(v.a.y,v.b.y)),'unintended wire crossover');
  }
  assert.notEqual(compiled.nodeAt(580,240),compiled.nodeAt(660,240),'diode is not bypassed');
 });
 test(`${id}: simultaneous signed diode, shunt and source data obey KVL`,()=>{
  const p=examples.find(e=>e.id===id).project,r=transient(p,{duration:.08,step:.00002});
  const u=measure(p,r,'D1','voltage'),i=measure(p,r,'D1','current');
  const us=measure(p,r,'V1','voltage'),urs=measure(p,r,'RS','voltage');
  const diode=p.components.find(c=>c.id==='D1'),q={...catalog.find(c=>c.type===diode.type).defaults,...diode.params};
  const direction=rotation===180?-1:1;
  near(r.time.at(-1),.08,1e-12,'two periods recorded');
  assert.ok(Math.max(...us)>amplitude*.999&&Math.min(...us)<-amplitude*.999);
  for(let j=0;j<r.time.length;j++){
   assert.ok(Number.isFinite(u[j])&&Number.isFinite(i[j]));
   near(us[j],direction*(u[j]+i[j]*(resistance+100)),2e-7,'signed series KVL');
   near(urs[j]/100,direction*i[j],1e-8,'shunt current and diode polarity');
   near(i[j],diodeModel(diode.type,q,u[j]).i,1e-8,'same-time pair lies on device characteristic');
  }
  assert.ok(Math.max(...i)>.001,'forward branch present');
  assert.ok(Math.min(...u)<-1,'reverse branch present');
  if(device==='bzx55c5v1'){
   const index=us.indexOf(Math.max(...us));
   assert.ok(u[index]<-4.9&&u[index]>-5.4,'positive source drives reverse breakdown');
   assert.ok(i[index]<-.004,'reverse current has A→K sign');
  }
  if(device==='ls-p47k'){
   assert.ok(Math.max(...i)<.02,'series resistance limits LED current below 20 mA');
   assert.ok(Math.min(...u)>-12,'reverse bias remains below the requested 12 V bound');
  }
 });
}
test('Named diode aliases retain all four historical example URLs',()=>{
 assert.equal(Object.keys(exampleAliases).length,4);
 for(const canonical of Object.values(exampleAliases))assert.ok(examples.some(e=>e.id===canonical));
});
