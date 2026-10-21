import test from 'node:test';
import assert from 'node:assert/strict';
import {appendSimulationRecords,currentStateAt} from '../continuous.mjs';
import {transient} from '../engine.mjs';
import {digitalExamples,simulateDigital} from '../digital.mjs';
const p=()=>({version:1,components:[
 {id:'V','type':'vdc',x:100,y:200,rotation:90,params:{value:5}},
 {id:'R','type':'resistor',x:200,y:160,rotation:0,params:{value:1000}},
 {id:'C','type':'capacitor',x:240,y:200,rotation:90,params:{value:1e-6}},
 {id:'G','type':'gnd',x:100,y:240,rotation:0,params:{}}
],wires:[{a:{x:100,y:160},b:{x:160,y:160}},{a:{x:100,y:240},b:{x:240,y:240}}],probes:[{id:'out',x:240,y:160,label:'Uout'}]});
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('RC state continues at absolute time without restarting capacitor charge',()=>{
 const project=p(),first=transient(project,{duration:.001,step:1e-6}),state=currentStateAt(project,first,1000);
 near(state.parts.C.v,first.traces[0].values[1000]);near(state.time,.001);
 const tail=transient(project,{duration:.001,step:1e-6,startTime:state.time,initialState:state});
 const merged=appendSimulationRecords(first,tail),whole=transient(project,{duration:.002,step:1e-6});
 assert.equal(merged.time.length,2001);near(merged.time.at(-1),.002);near(merged.traces[0].values.at(-1),whole.traces[0].values.at(-1),1e-8);
 assert.ok(merged.time.every((t,i)=>!i||t>merged.time[i-1]));assert.ok(tail.traces[0].values[0]>3);
});
test('Replacing a tail at an earlier sample discards old predicted future',()=>{
 const project=p(),old=transient(project,{duration:.002,step:1e-6}),snapshot=old.time.slice(),state=currentStateAt(project,old,1000);
 project.components[0].params.value=0;
 const tail=transient(project,{duration:.001,step:1e-6,startTime:state.time,initialState:state}),r=appendSimulationRecords(old,tail);
 assert.equal(r.time.length,2001);assert.ok(r.traces[0].values.at(-1)<r.traces[0].values[1000]);assert.deepEqual(old.time,snapshot);
 near(r.traces[0].values[999],old.traces[0].values[999]);near(r.traces[0].values[1000],tail.traces[0].values[0]);
});
test('Rolling buffer deduplicates boundaries, aligns checkpoints and obeys sample/window limits',()=>{
 const record=(times,n)=>({time:times,nodeMap:{'0,0':'n1'},nodeTraces:{n1:times.map(t=>n+t)},traces:[{id:'p',values:times.map(t=>n+t)}],states:times.map(t=>({time:t,mem:{q:n}})),checkpoints:times.map(t=>({time:t,q:n}))});
 const a=record([0,1,2,3],0),b=record([2,3,4,5,5],10),r=appendSimulationRecords(a,b,{maxSamples:4,window:1});
 assert.deepEqual(r.time,[2,3,4,5]);assert.deepEqual(r.traces[0].values,[12,13,14,15]);assert.deepEqual(r.nodeTraces.n1,[12,13,14,15]);assert.equal(r.states.length,4);assert.equal(r.finalState.time,5);assert.equal(r.finalState.mem.q,10);assert.equal(r.checkpoints.length,4);
 r.states[0].mem.q=99;assert.equal(b.states[0].mem.q,10);
 const long=record(Array.from({length:20001},(_,i)=>i/100),0),bounded=appendSimulationRecords(null,long,{window:.1});
 assert.ok(bounded.time.length<=12000);assert.ok(bounded.time[0]>=199.59);assert.equal(bounded.time.at(-1),200);
});
test('Digital counter checkpoint and absolute clock phase continue across merged records',()=>{
 const project=JSON.parse(JSON.stringify(digitalExamples.find(e=>e.project.components.some(c=>c.type==='counter'))?.project||digitalExamples.find(e=>e.project.components.some(c=>c.type==='tff'))?.project));
 assert.ok(project);const options={duration:.03,step:.0001},a=simulateDigital(project,options),state=currentStateAt(project,a,a.time.length-1);
 const b=simulateDigital(project,{...options,startTime:state.time,initialState:state}),r=appendSimulationRecords(a,b),whole=simulateDigital(project,{duration:.06,step:.0001});
 assert.ok(r.time.every((t,i)=>!i||t>r.time[i-1]));assert.deepEqual(r.finalState.mem,whole.finalState.mem);near(r.time.at(-1),.06);assert.equal(r.states.length,r.time.length);
 for(const node of Object.keys(r.nodeTraces))near(r.nodeTraces[node].at(-1),whole.nodeTraces[node].at(-1));
});
test('Changed topology, malformed traces and missing digital checkpoints are rejected',()=>{
 const a={time:[0,1],nodeMap:{p:'n1'},nodeTraces:{n1:[0,1]},traces:[]};
 assert.throws(()=>appendSimulationRecords(a,{...a,nodeMap:{p:'n2'}}),/Zapojení se změnilo/);
 assert.throws(()=>appendSimulationRecords(null,{...a,traces:[{id:'x',values:[1]}]}),/počet vzorků/);
 assert.throws(()=>appendSimulationRecords(null,a,{maxSamples:1}),/dva vzorky/);
 const project=digitalExamples[0].project;assert.throws(()=>currentStateAt(project,a,0),/paměťový stav/);
});
