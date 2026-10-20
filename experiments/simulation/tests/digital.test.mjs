import test from 'node:test';
import assert from 'node:assert/strict';
import { digitalGate, digitalOutputs, digitalCatalog, simulateDigital, digitalDC, digitalExamples } from '../digital.mjs';

test('všechna dvouvstupová hradla: úplné pravdivostní tabulky',()=>{
  const expected={and:[0,0,0,1],or:[0,1,1,1],nand:[1,1,1,0],nor:[1,0,0,0],xor:[0,1,1,0],xnor:[1,0,0,1]};
  for(const [type,values]of Object.entries(expected))for(let a=0;a<2;a++)for(let b=0;b<2;b++)assert.equal(digitalGate(type,[a,b]),values[a*2+b],`${type} ${a}${b}`);
  assert.equal(digitalGate('not',[0]),1);assert.equal(digitalGate('not',[1]),0);
});
test('čtyřstavová logika má řídicí hodnoty a nevnucuje nulu neurčenému vstupu',()=>{
  assert.equal(digitalGate('and',[0,'X']),0);assert.equal(digitalGate('and',[1,'X']),'X');
  assert.equal(digitalGate('or',[1,'Z']),1);assert.equal(digitalGate('xor',[0,'Z']),'X');
  assert.equal(digitalGate('not',['Z']),'X');
  assert.deepEqual(digitalOutputs('tristate',{a:1,en:0}),{out:'Z'});
  assert.deepEqual(digitalOutputs('tristate',{a:0,en:1}),{out:0});
  assert.deepEqual(digitalOutputs('tristate',{a:1,en:'X'}),{out:'X'});
});
test('multiplexer, demultiplexer a dekodér: úplné kombinace',()=>{
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let sel=0;sel<2;sel++)assert.equal(digitalOutputs('mux',{a,b,sel}).out,sel?b:a);
  assert.equal(digitalOutputs('mux',{a:1,b:1,sel:'X'}).out,1);
  assert.equal(digitalOutputs('mux',{a:0,b:1,sel:'X'}).out,'X');
  for(let a=0;a<2;a++)for(let sel=0;sel<2;sel++)assert.deepEqual(digitalOutputs('demux',{a,sel}),{y0:sel?0:a,y1:sel?a:0});
  for(let a=0;a<2;a++)for(let b=0;b<2;b++){const out=digitalOutputs('decoder',{a,b});assert.equal(Object.values(out).reduce((s,n)=>s+n,0),1);assert.equal(out[`y${a+2*b}`],1);}
});
test('poloviční a úplná sčítačka zachovají aritmetický součet',()=>{
  for(let a=0;a<2;a++)for(let b=0;b<2;b++){
    const h=digitalOutputs('halfadder',{a,b});assert.equal(h.sum+2*h.carry,a+b);
    for(let cin=0;cin<2;cin++){const f=digitalOutputs('fulladder',{a,b,cin});assert.equal(f.sum+2*f.carry,a+b+cin);}
  }
  assert.deepEqual(digitalOutputs('fulladder',{a:1,b:1,cin:'X'}),{sum:'X',carry:1});
});

const block=(id,type,x,y,params={})=>({id,type,x,y,rotation:0,params});
const wire=(id,a,b)=>({id,a,b});
function fixture(type,inputs={},params={}){
  const d=digitalCatalog.find(c=>c.type===type),comp=block('U',type,400,200,params),components=[comp],wires=[];
  let i=0;
  for(const [name,val]of Object.entries(inputs)){
    const p=d.pins.find(p=>p.id===name),source=block(`I${i}`,'input',80,80+i*80,{value:val});components.push(source);
    const a={x:source.x+40,y:source.y},b={x:comp.x+p.x,y:comp.y+p.y};
    // Direct segments intentionally test the same explicit pin connectivity contract as the editor.
    wires.push(wire(`w${i++}`,a,b));
  }
  const outputPins=d.pins.filter(p=>['out','q','nq','q0','q1','q2','q3','sum','carry','y0','y1','y2','y3'].includes(p.id));
  return {version:1,title:type,components,wires,probes:outputPins.map(p=>({id:p.id,label:p.id,x:comp.x+p.x,y:comp.y+p.y})),settings:{duration:0.1,step:0.001}};
}
const last=(r,id)=>r.traces.find(t=>t.id===id).values.at(-1);
test('RS forbidden state and FBD set/reset priorities are explicit',()=>{
  assert.ok(Number.isNaN(last(digitalDC(fixture('rs',{s:1,r:1})),'q')));
  assert.equal(last(digitalDC(fixture('sr',{s:1,r:1})),'q'),1);
  assert.equal(last(digitalDC(fixture('fbd_rs',{s:1,r:1})),'q'),0);
  assert.equal(last(digitalDC(fixture('rs',{s:1,r:0})),'q'),1);
  assert.equal(last(digitalDC(fixture('rs',{s:0,r:1},{initial:1})),'q'),0);
});
test('D, JK and T flip flops change on rising edges and hold otherwise',()=>{
  for(const [type,inputs]of [['dff',{d:1,clk:0}],['jkff',{j:1,k:1,clk:0}],['tff',{t:1,clk:0}]]){
    const p=fixture(type,inputs),clock=p.components.find(c=>c.id==='I'+Object.keys(inputs).indexOf('clk'));clock.type='clock';clock.params={frequency:10};
    const r=simulateDigital(p,{duration:0.16,step:0.001});
    assert.equal(r.traces.find(t=>t.id==='q').values[0],0);
    assert.equal(r.traces.find(t=>t.id==='q').values[60],1);
    assert.equal(r.traces.find(t=>t.id==='q').values[140],1);
    assert.equal(last(r,'q'),type==='dff'?1:0);
  }
});
test('counter processes clock edges even when output sample is coarser than the clock',()=>{
  const p=structuredClone(digitalExamples.find(e=>e.id==='digital-counter').project);
  const r=simulateDigital(p,{duration:0.1,step:0.1});
  const count=[0,1,2,3].reduce((n,i)=>n+last(r,`q${i}`)*2**i,0);
  assert.equal(count,10);
  assert.equal(r.time.length,2);
  assert.equal(Object.values(r.nodeTraces)[0].length,2);
});
test('ripple flip flops propagate a generated clock edge in the same simulation instant',()=>{
  const p=fixture('tff',{t:1,clk:0});p.components.find(c=>c.id==='I1').type='clock';p.components.find(c=>c.id==='I1').params={frequency:10};
  p.components.push(block('U2','tff',700,200,{initial:0}));
  p.wires.push(wire('t2',{x:120,y:80},{x:660,y:180}),wire('clk2',{x:440,y:180},{x:660,y:220}));
  p.probes.push({id:'q2',x:740,y:180,label:'Druhý stupeň'});
  const r=simulateDigital(p,{duration:0.05001,step:0.05});
  assert.equal(r.traces.find(t=>t.id==='q').values[1],1);
  assert.equal(r.traces.find(t=>t.id==='q2').values[1],1);
});
test('shift register shifts serial data into Q0 at each rising edge',()=>{
  const p=fixture('register',{d:1,clk:0});p.components.find(c=>c.id==='I1').type='clock';p.components.find(c=>c.id==='I1').params={frequency:10};
  const r=simulateDigital(p,{duration:0.26,step:0.01});assert.equal(last(r,'q0'),1);assert.equal(last(r,'q1'),1);assert.equal(last(r,'q2'),1);assert.equal(last(r,'q3'),0);
});
test('FBD TON delays turn-on, TOF delays turn-off and TP produces a fixed pulse',()=>{
  for(const type of ['ton','tof','tp']){
    const p=fixture(type,{in:0},{preset:0.01});p.components.find(c=>c.id==='I0').type='clock';p.components.find(c=>c.id==='I0').params={frequency:20};
    const r=simulateDigital(p,{duration:0.08,step:0.001}),v=r.traces[0].values;
    assert.equal(v[24],0);
    assert.equal(v[26],type==='ton'?0:1);
    assert.equal(v[36],type==='tp'?0:1);
    assert.equal(v[51],type==='tof'?1:0);
    assert.equal(v[61],0);
  }
});
test('floating and conflicting drivers resolve X/Z rather than fabricating a value',()=>{
  const floating=fixture('not');const r=digitalDC(floating);assert.ok(Number.isNaN(last(r,'out')));assert.ok(Object.values(r.logicStates).includes('Z'));
  const p=fixture('buffer',{a:1});p.components.push(block('CONFLICT','input',80,300,{value:0}));p.wires.push(wire('conflict',{x:120,y:300},{x:360,y:200}));
  assert.ok(Number.isNaN(last(digitalDC(p),'out')));
});
test('event limits reject excessive clocks before attempting work',()=>{
  const p=structuredClone(digitalExamples[1].project);p.components.find(c=>c.type==='clock').params.frequency=1e9;
  assert.throws(()=>simulateDigital(p,{duration:1,step:0.001}),/hran/);
  assert.throws(()=>simulateDigital(p,{duration:1,step:1e-9}),/50 000/);
});
test('digital engine rejects analog mixture and gives pure digital DC a result',()=>{
  const p=fixture('and',{a:1,b:1});assert.equal(last(digitalDC(p),'out'),1);
  p.components.push(block('R','resistor',800,400,{value:1000}));assert.throws(()=>digitalDC(p),/samostatných/);
});
test('all supplied digital examples produce traces without mutating source projects',()=>{
  for(const e of digitalExamples){const before=JSON.stringify(e.project),r=simulateDigital(e.project);assert.ok(r.time.length>1);assert.equal(JSON.stringify(e.project),before);assert.equal(r.traces.length,e.project.probes.length);}
});
