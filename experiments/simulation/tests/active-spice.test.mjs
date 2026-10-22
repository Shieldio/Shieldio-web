import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {runSpice} from '../spice-adapter.mjs';
import {dc} from '../engine.mjs';
import {examples} from '../examples.mjs';
const available=existsSync(new URL('../vendor/eecircuit-engine-1.8.0.mjs',import.meta.url));
test('ngspice executes all three transistor stages and the finite-slew amplifier',{skip:!available,timeout:45000},async()=>{
 const {Simulation}=await import('../vendor/eecircuit-engine-1.8.0.mjs');const sim=new Simulation();await sim.start();
 const engine={run:async netlist=>{sim.setNetList(netlist);const result=await sim.runSim();assert.deepEqual(sim.getError().filter(s=>/error|fatal|unknown device|singular matrix/i.test(s)),[]);return result;}};
 for(const id of ['bjt-common-emitter','bjt-common-collector','bjt-common-base']){
  const p=examples.find(e=>e.id===id).project,reference=dc(p),op=await runSpice(p,{mode:'op',engine});assert.ok(op.currents.Q1>0,id+' collector current');assert.ok(Math.abs(op.currents.Q1/reference.currents.Q1-1)<.04,id+' independent MNA/ngspice bias agreement');assert.ok(Math.abs(op.currents.Q1+op.currents['Q1:b']+op.currents['Q1:e'])<1e-10,id+' terminal KCL');
  const r=await runSpice(p,{mode:'tran',duration:.0001,step:1e-6,engine});assert.ok(r.traces.every(t=>t.values.every(Number.isFinite)),id+' finite transient');assert.ok(r.traces.find(t=>t.id==='I:Q1:b'));
 }
 const p=examples.find(e=>e.id==='opamp-slew').project,r=await runSpice(p,{mode:'tran',duration:.00015,step:1e-7,engine}),out=r.nodeTraces[r.nodeMap['640,300']];assert.ok(out.every(Number.isFinite));const slopes=[];
 for(let i=1;i<out.length;i++)if(Math.abs(out[i])<3&&r.time[i]>1e-6){const rate=Math.abs((out[i]-out[i-1])/(r.time[i]-r.time[i-1]));if(rate>1e5)slopes.push(rate);}
 assert.ok(slopes.length>10);const peak=Math.max(...slopes);assert.ok(peak>4.8e5&&peak<5.1e5,'SR must be ~0.5 V/us, not the old ~1 kV/s pole/rail bug');assert.ok(Math.max(...out)>4.9&&Math.min(...out)<-4.9);
});
