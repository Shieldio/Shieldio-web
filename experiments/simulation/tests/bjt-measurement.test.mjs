import test from 'node:test';
import assert from 'node:assert/strict';
import {transient,pinsFor} from '../engine.mjs';
import {examples} from '../examples.mjs';
import {sampleMeasurement,measurementSeries,validateProject,pointKey} from '../workbench-model.mjs';
test('BJT scope measurements use VCE and signed collector/base/emitter currents from the same sample',()=>{
 const p=validateProject(structuredClone(examples.find(e=>e.id==='bjt-common-emitter').project)),r=transient(p,{duration:.001,step:2e-6}),q=p.components.find(c=>c.type==='npn'),ps=Object.fromEntries(pinsFor(q).map(p=>[p.id,p]));
 const voltage={componentId:q.id,kind:'voltage'},currents=[undefined,'b','e'].map(pin=>({componentId:q.id,kind:'current',pin}));
 for(const k of [100,250,500]){const vc=r.nodeTraces[r.nodeMap[pointKey(ps.c)]][k],ve=r.nodeTraces[r.nodeMap[pointKey(ps.e)]][k];assert.ok(Math.abs(sampleMeasurement(p,voltage,r,k)-(vc-ve))<1e-10);const values=currents.map(m=>sampleMeasurement(p,m,r,k));assert.ok(Math.abs(values.reduce((a,b)=>a+b,0))<1e-12,'terminal currents obey KCL');for(const m of currents)assert.equal(sampleMeasurement(p,m,r,k),measurementSeries(p,m,r)[k]);}
});
