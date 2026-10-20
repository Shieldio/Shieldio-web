import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {runSpice} from '../spice-adapter.mjs';
import {examples} from '../examples.mjs';
const available=existsSync(new URL('../vendor/eecircuit-engine-1.8.0.mjs',import.meta.url));
test('ngspice WASM: skutečný výpočet děliče a RC filtru',{skip:!available,timeout:45000},async()=>{
 const {Simulation}=await import('../vendor/eecircuit-engine-1.8.0.mjs');
 const sim=new Simulation();
 await sim.start();
 sim.setNetList('SHiELDiO reference divider\nV1 in 0 DC 10\nR1 in out 1000\nR2 out 0 1000\n.op\n.end\n');
 const op=await sim.runSim();
 const out=op.data.find(v=>v.name.toLowerCase()==='v(out)');
 assert.ok(out,'ngspice musí vrátit výstupní napětí');
 assert.ok(Math.abs(out.values[0]-5)<1e-7,'dělič 10 V musí mít výstup 5 V');
 sim.setNetList('SHiELDiO reference RC\nV1 in 0 AC 1\nR1 in out 1000\nC1 out 0 1e-6\n.ac lin 2 159.15494309189535 318.3098861837907\n.end\n');
 const ac=await sim.runSim();
 const v=ac.data.find(v=>v.name.toLowerCase()==='v(out)').values[0];
 assert.ok(Math.abs(20*Math.log10(Math.hypot(v.real,v.img))+3.01029995664)<1e-5);
 assert.ok(Math.abs(Math.atan2(v.img,v.real)*180/Math.PI+45)<1e-5);
 const adapterEngine={run:async netlist=>{sim.setNetList(netlist);const result=await sim.runSim();const errors=sim.getError().filter(s=>/error|fatal|unknown device|singular matrix/i.test(s));assert.deepEqual(errors,[]);return result;}};
 for(const id of ['rc-lowpass','rectifier','opamp-noninverting','zener','schottky','tunnel']){
  const p=examples.find(e=>e.id===id).project;
  const dcPoint=await runSpice(p,{mode:'op',engine:adapterEngine});assert.ok(Object.values(dcPoint.voltages).every(Number.isFinite),id+' DC');
  const result=await runSpice(p,{mode:'tran',duration:.001,step:.000005,engine:adapterEngine});
  assert.equal(result.time.length,201,id);
  for(const c of p.components.filter(c=>c.type!=='gnd'))assert.ok(result.traces.some(t=>t.id==='I:'+c.id),'Proudový kanál '+c.id+' musí být dostupný v '+id);assert.ok(result.traces.length>=p.probes.length,id);
  for(const trace of result.traces)assert.ok(trace.values.every(Number.isFinite),id+': '+trace.label);
 }
 const rc=examples.find(e=>e.id==='rc-lowpass').project,fc=1/(2*Math.PI*1000*100e-9);
 const result=await runSpice(rc,{mode:'ac',start:fc,stop:fc*2,points:20,engine:adapterEngine});
 assert.ok(Math.abs(result.traces[1].magnitude[0]+3.01029995664)<1e-5);
 assert.ok(Math.abs(result.traces[1].phase[0]+45)<1e-5);
});
