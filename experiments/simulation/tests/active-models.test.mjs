import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,bjtModel,compile,dc,transient,ac,pinsFor} from '../engine.mjs';
import {toSpice} from '../spice-adapter.mjs';
const q=catalog.find(p=>p.type==='npn').defaults;
const component=(id,type,x,y,params={},rotation=0)=>({id,type,x,y,params,rotation});
const ground=(id,x,y)=>component(id,'gnd',x,y);
function transistor({type='npn',vb=.66,vcc=10,rc=1000,acInput=false}={}){
 const sign=type==='pnp'?-1:1;
 return {components:[component('Q1',type,0,0),component('VB',acInput?'vac':'vdc',-80,0,acInput?{value:.001,offset:sign*vb,frequency:1000,waveform:'sine'}:{value:sign*vb},180),ground('GB',-120,0),ground('GE',40,40),component('RC','resistor',80,-40,{value:rc}),component('VCC','vdc',160,-40,{value:sign*vcc}),ground('GC',200,-40)],wires:[],probes:[{id:'out',label:'Collector',x:40,y:-40}],settings:{duration:.002,step:1e-6}};
}
const vAt=(r,x,y)=>r.voltages[r.nodeMap[x+','+y]];
function follower({headroom=1.5,outputResistance=75,amplitude=5,frequency=5000,load=10000}={}){
 return {components:[component('U1','opamp',0,0,{powered:true,gain:2e5,gbw:1e6,slew:.5e6,headroom,outputResistance}),component('IN','vac',-80,-20,{value:amplitude,frequency,waveform:'square'},180),ground('GI',-120,-20),component('VP','vdc',0,-100,{value:15},270),ground('GP',0,-140),component('VN','vdc',0,100,{value:-15},90),ground('GN',0,140),component('RL','resistor',80,0,{value:load}),ground('GL',120,0)],wires:[{id:'fb1',a:{x:40,y:0},b:{x:40,y:20}},{id:'fb2',a:{x:40,y:20},b:{x:-40,y:20}}],probes:[{id:'out',x:40,y:0}],settings:{duration:.00015,step:1e-7}};
}
test('Ebers–Moll forward-active gain, opposite PNP polarity and terminal KCL',()=>{
 for(const type of ['npn','pnp']){const sign=type==='pnp'?-1:1,m=bjtModel(type,q,{b:sign*.68,c:sign*5,e:0});assert.ok(Math.abs(m.currents.c/m.currents.b-100)<1e-6);assert.ok(sign*m.currents.c>0);assert.ok(Math.abs(Object.values(m.currents).reduce((a,b)=>a+b,0))<1e-16);}
});
test('Ebers–Moll analytic Jacobian matches numerical partial derivatives in saturation',()=>{
 const voltage={b:.72,c:.15,e:0},model=bjtModel('npn',q,voltage),h=1e-7;
 for(const row of ['b','c','e'])for(const col of ['b','c','e']){const plus=bjtModel('npn',q,{...voltage,[col]:voltage[col]+h}).currents[row],minus=bjtModel('npn',q,{...voltage,[col]:voltage[col]-h}).currents[row],numeric=(plus-minus)/(2*h);assert.ok(Math.abs(numeric-model.jacobian[row][col])<1e-7*Math.max(1,Math.abs(numeric)),`${row}/${col}`);}
});
test('NPN and PNP collector load obey KCL and active-region beta',()=>{
 for(const type of ['npn','pnp']){const p=transistor({type}),r=dc(p),i=r.currents.Q1,term=r.terminalCurrents.Q1,sign=type==='pnp'?-1:1;assert.ok(sign*i>.001&&sign*i<.002);assert.ok(Math.abs(vAt(r,40,-40)-(sign*10-i*1000))<1e-7);assert.ok(Math.abs(i/term.b-100)<1e-5);assert.ok(Math.abs(term.b+term.c+term.e)<1e-15);}
});
test('Collector saturation limits current to the real resistor load',()=>{
 const r=dc(transistor({vb:.8})),vc=vAt(r,40,-40);assert.ok(vc>0&&vc<.3,`VCE=${vc}`);assert.ok(r.currents.Q1<.01&&r.currents.Q1>.009);assert.ok(r.currents.Q1/r.terminalCurrents.Q1.b<10);
});
test('Biased transistor transient and linearized AC have common-emitter inversion',()=>{
 const p=transistor({acInput:true}),r=transient(p),out=r.traces.find(t=>t.id==='out').values;assert.ok(out.every(Number.isFinite));assert.ok(r.traces.find(t=>t.id==='I:Q1:b'));const z=ac(p,{start:100,stop:10000,points:3,inputId:'VB'}),trace=z.traces.find(t=>t.id==='out');assert.ok(trace.magnitude.every(v=>v>20));assert.ok(trace.phase.every(v=>Math.abs(Math.abs(v)-180)<.01));
});
test('Powered amplifier follows a square wave at the configured 0.5 V/µs slew',()=>{
 const r=transient(follower({outputResistance:0})),out=r.traces.find(t=>t.id==='out').values;let rates=[];
 for(let i=1;i<out.length;i++){const rate=(out[i]-out[i-1])/(r.time[i]-r.time[i-1]);assert.ok(Math.abs(rate)<=.5e6*1.0001);if(out[i]>-3&&out[i]<3&&Math.abs(rate)>1e5)rates.push(Math.abs(rate));}
 assert.ok(rates.length>20);assert.ok(rates.every(v=>Math.abs(v/.5e6-1)<.002));assert.ok(Math.max(...out)>4.9&&Math.min(...out)<-4.9);
});
test('Powered amplifier output headroom clips without exceeding supply rails',()=>{
 const p=follower({amplitude:20,frequency:1000});p.settings.duration=.0007;p.settings.step=1e-6;const r=transient(p),out=r.traces.find(t=>t.id==='out').values;assert.ok(Math.max(...out)<=13.5+1e-8&&Math.min(...out)>=-13.5-1e-8);assert.ok(Math.max(...out)>13&&Math.min(...out)<-13);
});
test('Finite opamp output resistance causes measurable open-loop load droop',()=>{
 const p=follower();p.wires=[];p.components=p.components.filter(c=>c.id!=='IN');p.components.push(component('IN','vdc',-80,-20,{value:1},180),ground('GM',-40,20));const r=dc(p),v=vAt(r,40,0);assert.ok(Math.abs(v-13.5*10000/(10000+75))<1e-7);
});
test('SPICE exports BJT terminals, physical slew integrator and finite opamp output resistance',()=>{
 const b=toSpice(transistor()).netlist;assert.match(b,/\.model QM\d+ NPN\(IS=/);assert.match(b,/VsenseB\d+/);const a=toSpice(follower()).netlist;assert.match(a,/Rout\d+/);assert.match(a,/Bpole\d+.*I=min\(max/);assert.doesNotMatch(a,/Bdrv\d+.*min\(/);
});
test('Invalid active model parameters fail with the component reference',()=>{
 const p=transistor();p.components[0].params.beta=0;assert.throws(()=>dc(p),/Q1/);const o=follower();o.components[0].params.outputResistance=-1;assert.throws(()=>dc(o),/U1/);
});

test('BJT continuous chunks retain the same physical solution as one transient',()=>{
 const p=transistor({acInput:true}),whole=transient(p),first=transient(p,{duration:.001}),compiled=compile(p),solution=new Array(compiled.size).fill(0);for(const [node,index]of Object.entries(compiled.index))solution[index]=first.final.voltages[node];for(const part of compiled.parts)if(part.branch!==undefined)solution[part.branch]=first.final.currents[part.id];const resumed=transient(p,{duration:.001,startTime:.001,initialState:{parts:first.final.state,solution}});
 const expected=whole.traces.find(t=>t.id==='I:Q1').values.at(-1),actual=resumed.traces.find(t=>t.id==='I:Q1').values.at(-1);assert.ok(Math.abs(expected-actual)<1e-10);assert.ok(resumed.time.every((t,i,a)=>!i||t>a[i-1]));
});

test('Amplifier unity-gain bandwidth is a physical small-signal pole',()=>{
 const p=follower({outputResistance:0});p.components.find(c=>c.id==='IN').params.waveform='sine';const r=ac(p,{start:1e6,stop:2e6,points:2,inputId:'IN'}),trace=r.traces.find(t=>t.id==='out');assert.ok(Math.abs(trace.magnitude[0]+3.0103)<.01);assert.ok(Math.abs(trace.phase[0]+45)<.01);
});

test('Loaded slew-limited amplifier resumes from an acquired sample without a jump',async()=>{
 const {currentStateAt,appendSimulationRecords}=await import('../continuous.mjs');const p=follower(),whole=transient(p),first=transient(p,{duration:.000105}),state=currentStateAt(p,first),tail=transient(p,{startTime:state.time,duration:.000045,initialState:state}),joined=appendSimulationRecords(first,tail,{window:.0002});
 const expected=whole.traces.find(t=>t.id==='out').values,actual=joined.traces.find(t=>t.id==='out').values;assert.equal(actual.length,expected.length);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-expected[i])<1e-7,`sample ${i}`);
});
