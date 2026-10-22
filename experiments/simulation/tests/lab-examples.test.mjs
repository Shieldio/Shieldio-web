import test from 'node:test';
import assert from 'node:assert/strict';
import {examples} from '../examples.mjs';
import {dc,transient,ac,compile,pinsFor} from '../engine.mjs';
import {validateProject,measurementSeries,automaticSettings} from '../workbench-model.mjs';
const get=id=>JSON.parse(JSON.stringify(examples.find(e=>e.id===id).project));
const near=(a,b,tol)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,`${a} != ${b} ± ${tol}`);
const benchIds=['measure-resistance','measure-inductance','measure-capacitance-small','measure-capacitance-large','load-light','load-heavy','bjt-common-emitter','bjt-common-collector','bjt-common-base','opamp-slew'];
function phasor(values,time,frequency,after){let sin=0,cos=0,n=0;for(let i=0;i<time.length;i++)if(time[i]>=after&&i<time.length-1){sin+=values[i]*Math.sin(2*Math.PI*frequency*time[i]);cos+=values[i]*Math.cos(2*Math.PI*frequency*time[i]);n++;}return {amplitude:2*Math.hypot(sin,cos)/n,phase:Math.atan2(cos,sin)*180/Math.PI};}
const delta=(a,b)=>((a-b+540)%360)-180;

test('New measurement benches are valid, connected and compatible with automatic timing',()=>{
 for(const id of benchIds){const p=validateProject(get(id)),settings=automaticSettings(p),model=compile(p);assert.equal(p.mode,'analog',id);assert.ok(settings.duration/settings.step<=28000,id);assert.ok(p.measurements.length>=2,id);assert.ok(p.measurements.every(m=>p.components.some(c=>c.id===m.componentId)),id);assert.ok(model.size>0,id);const r=dc(p);assert.ok(Object.values(r.voltages).every(Number.isFinite),id);}
});
test('Voltampere resistance bench recovers 470 ohms from the actual differential voltage and current',()=>{
 const p=get('measure-resistance'),r=transient(p,{duration:.0001,step:1e-6}),u=measurementSeries(p,p.measurements[0],r).at(-1),i=measurementSeries(p,p.measurements[1],r).at(-1);near(u/i,470,1e-8);near(i,5/570,1e-10);
});
test('Inductance bench recovers 10 mH and a 90-degree U-before-I phase after settling',()=>{
 const p=get('measure-inductance'),r=transient(p),u=phasor(measurementSeries(p,p.measurements[0],r),r.time,1000,.003),i=phasor(measurementSeries(p,p.measurements[1],r),r.time,1000,.003);near(u.amplitude/(2*Math.PI*1000*i.amplitude),.01,.0001);near(delta(u.phase,i.phase),90,1);
});
test('Small capacitance bench recovers 100 pF and a 90-degree I-before-U phase',()=>{
 const p=get('measure-capacitance-small'),r=transient(p),u=phasor(measurementSeries(p,p.measurements[0],r),r.time,10000,.0003),i=phasor(measurementSeries(p,p.measurements[1],r),r.time,10000,.0003);near(i.amplitude/(2*Math.PI*10000*u.amplitude),100e-12,1e-12);near(delta(i.phase,u.phase),90,1);
});
test('Large capacitor crosses 63.2 percent at tau and can discharge from the same initial energy',()=>{
 const p=get('measure-capacitance-large'),r=transient(p),u=measurementSeries(p,p.measurements[0],r);near(u[1000],5*(1-Math.exp(-1)),.003);near(u.at(-1),5*(1-Math.exp(-5)),.001);const q=get('measure-capacitance-large');q.components.find(c=>c.id==='V1').params.value=0;q.components.find(c=>c.id==='CX').params.initialVoltage=5;const d=transient(q),v=measurementSeries(q,q.measurements[0],d),i=measurementSeries(q,q.measurements[1],d);near(v[1000],5*Math.exp(-1),.003);assert.ok(i[1]<0,'capacitor current reverses on discharge');
});
test('Light and heavy loads show source sag and conserve power including internal resistance',()=>{
 for(const [id,rl,v] of [['load-light',10000,12*10000/10100],['load-heavy',100,6]]){const p=get(id),r=dc(p),compiled=compile(p),pins=pinsFor(p.components.find(c=>c.id==='RL')),u=r.voltages[compiled.nodeAt(pins[0].x,pins[0].y)]-r.voltages[compiled.nodeAt(pins[1].x,pins[1].y)],i=r.currents.RL;near(u,v,1e-9);near(u/i,rl,1e-7);near(12*i,i*i*(100+rl),1e-9);}
});
test('SE, SC and SB transistor examples have the expected voltage gain and phase',()=>{
 for(const [id,out,sign,min,max] of [['bjt-common-emitter','780,360',-1,10,30],['bjt-common-collector','640,440',1,.95,1],['bjt-common-base','780,360',1,10,20]]){const p=get(id),d=dc(p),r=ac(p,{inputId:'VIN',start:1000,stop:2000,points:2}),tr=r.traces.find(t=>t.id===r.nodeMap[out]),gain=tr.real[0];assert.ok(gain*sign>min&&gain*sign<max,`${id}: gain ${gain}`);near(tr.imag[0],0,1e-10);assert.ok(d.currents.Q1>0&&d.currents.Q1<.005,id);const q=p.components.find(c=>c.id==='Q1'),pins=Object.fromEntries(pinsFor(q).map(pin=>[pin.id,pin])),at=pin=>d.voltages[d.nodeMap[`${pins[pin].x},${pins[pin].y}`]];assert.ok(at('c')>at('b')&&at('b')>at('e'),`${id}: forward-active bias`);}
});
test('Powered finite-bandwidth opamp demo makes slew measurable in the actual output trace',()=>{
 const p=get('opamp-slew'),u=p.components.find(c=>c.id==='U1'),r=transient(p),out=measurementSeries(p,p.measurements[1],r),rates=out.slice(1).map((v,i)=>(v-out[i])/(r.time[i+1]-r.time[i])),expected=u.params.slew*10000/(10000+u.params.outputResistance);near(Math.max(...rates),expected,expected*.002);near(Math.min(...rates),-expected,expected*.002);assert.ok(Math.max(...out)>4.9&&Math.min(...out)<-4.9);assert.ok(out.every(v=>Math.abs(v)<15-u.params.headroom));assert.ok(u.params.powered&&u.params.gbw===1e6);
});
