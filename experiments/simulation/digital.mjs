/** Ideal, four-state educational digital/FBD simulator. Times and timer presets are seconds.
 * Gates have zero propagation delay. Sequential elements trigger on valid rising edges.
 * Clock starts low, with its first rising edge at half a period. No analog/digital bridge is implied.
 */
const pin = (id,x,y) => ({id,x,y});
const two = [pin('a',-40,-20),pin('b',-40,20),pin('out',40,0)];
const qPins = [pin('q',40,-20),pin('nq',40,20)];
const bits = [pin('q0',40,-40),pin('q1',40,-20),pin('q2',40,0),pin('q3',40,20)];
const sharedTypes=new Set(['input','clock','and','or','nand','nor','xor','xnor','not','buffer']);
const item = (type,label,pins,defaults={},category='Číslicové') => {
  const mode=category==='FBD'?'fbd':sharedTypes.has(type)?'shared':'digital';
  return {type,label,pins,defaults,category:mode==='shared'?'Logické funkce':category,mode,modes:mode==='shared'?['digital','fbd']:[mode]};
};
export const digitalCatalog = [
  item('input','Logický vstup',[pin('out',40,0)],{value:0}),
  item('clock','Hodinový signál',[pin('out',40,0)],{frequency:100}),
  ...['and','or','nand','nor','xor','xnor'].map(t=>item(t,t.toUpperCase(),two)),
  item('not','NOT',[pin('a',-40,0),pin('out',40,0)]),
  item('buffer','Oddělovač BUF',[pin('a',-40,0),pin('out',40,0)]),
  item('tristate','Třístavový výstup',[pin('a',-40,-20),pin('en',-40,20),pin('out',40,0)]),
  item('mux','Multiplexer 2 : 1',[pin('a',-40,-20),pin('b',-40,20),pin('sel',0,40),pin('out',40,0)]),
  item('demux','Demultiplexer 1 : 2',[pin('a',-40,-20),pin('sel',-40,20),pin('y0',40,-20),pin('y1',40,20)]),
  item('decoder','Dekodér 2 → 4',[pin('a',-40,-20),pin('b',-40,20),pin('y0',40,-40),pin('y1',40,-20),pin('y2',40,0),pin('y3',40,20)]),
  item('halfadder','Poloviční sčítačka',[pin('a',-40,-20),pin('b',-40,20),pin('sum',40,-20),pin('carry',40,20)]),
  item('fulladder','Úplná sčítačka',[pin('a',-40,-20),pin('b',-40,20),pin('cin',0,40),pin('sum',40,-20),pin('carry',40,20)]),
  item('rs','RS klopný obvod',[pin('s',-40,-20),pin('r',-40,20),...qPins],{initial:0}),
  item('sr','SR paměť (priorita S)',[pin('s',-40,-20),pin('r',-40,20),...qPins],{initial:0},'FBD'),
  item('fbd_rs','RS paměť (priorita R)',[pin('s',-40,-20),pin('r',-40,20),...qPins],{initial:0},'FBD'),
  item('dff','D klopný obvod',[pin('d',-40,-20),pin('clk',-40,20),...qPins],{initial:0}),
  item('jkff','JK klopný obvod',[pin('j',-40,-20),pin('k',-40,20),pin('clk',0,40),...qPins],{initial:0}),
  item('tff','T klopný obvod',[pin('t',-40,-20),pin('clk',-40,20),...qPins],{initial:0}),
  item('counter','Čítač 4 bit',[pin('clk',-40,-20),pin('reset',-40,20),...bits],{initial:0}),
  item('register','Posuvný registr 4 bit',[pin('d',-40,-20),pin('clk',-40,20),...bits],{initial:0}),
  ...['ton','tof','tp'].map(t=>item(t,t.toUpperCase(),[pin('in',-40,0),pin('out',40,0)],{preset:0.01},'FBD'))
];
const byType = new Map(digitalCatalog.map(c=>[c.type,c]));
export const isDigital = project => (project.components||[]).some(c=>byType.has(c.type));
const key = (x,y) => `${Math.round(x*1e6)/1e6},${Math.round(y*1e6)/1e6}`;
const logic = v => v===0||v==='0'||v===false ? 0 : v===1||v==='1'||v===true ? 1 : v==='Z' ? 'Z' : 'X';
const inv = v => v===0?1:v===1?0:'X';
export function digitalGate(type, inputs) {
  const a=logic(inputs[0]),b=logic(inputs[1]);
  if(type==='not') return inv(a);
  let out;
  if(type==='and'||type==='nand') out=a===0||b===0?0:a===1&&b===1?1:'X';
  else if(type==='or'||type==='nor') out=a===1||b===1?1:a===0&&b===0?0:'X';
  else if(type==='xor'||type==='xnor') out=(a===0||a===1)&&(b===0||b===1)?a^b:'X';
  else throw new Error(`Neznámý logický člen: ${type}`);
  return ['nand','nor','xnor'].includes(type)?inv(out):out;
}
const combinationalTypes=new Set(['and','or','nand','nor','xor','xnor','not','buffer','tristate','mux','demux','decoder','halfadder','fulladder']);
/** Combinational truth function with uncertainty propagated across all possible binary inputs. */
export function digitalOutputs(type,input) {
  const v=Object.fromEntries(Object.entries(input).map(([k,v])=>[k,logic(v)]));
  if(['and','or','nand','nor','xor','xnor','not'].includes(type))return {out:digitalGate(type,[v.a,v.b])};
  if(type==='buffer')return {out:v.a===0||v.a===1?v.a:'X'};
  if(type==='tristate')return {out:v.en===0?'Z':v.en===1?v.a:v.a==='Z'?'Z':'X'};
  let variants=[{}];
  for(const [k,value]of Object.entries(v)){const choices=typeof value==='number'?[value]:[0,1];variants=variants.flatMap(row=>choices.map(n=>({...row,[k]:n})));}
  const rows=variants.map(v=>{
    if(type==='mux')return {out:v.sel?v.b:v.a};
    if(type==='demux')return {y0:v.sel?0:v.a,y1:v.sel?v.a:0};
    if(type==='decoder'){const n=v.a+2*v.b;return Object.fromEntries([0,1,2,3].map(i=>[`y${i}`,Number(n===i)]));}
    if(type==='halfadder')return {sum:v.a^v.b,carry:v.a&v.b};
    if(type==='fulladder'){const n=v.a+v.b+v.cin;return {sum:n&1,carry:Number(n>=2)};}
    throw new Error(`Neznámý logický blok: ${type}`);
  });
  return Object.fromEntries(Object.keys(rows[0]).map(k=>[k,rows.every(r=>r[k]===rows[0][k])?rows[0][k]:'X']));
}

function topology(project) {
  const comps=project.components||[], wires=project.wires||[], probes=project.probes||[];
  if(comps.length>200||wires.length>1000)throw new Error('Digitální beta podporuje nejvýše 200 bloků a 1000 vodičů.');
  const bad=comps.find(c=>!byType.has(c.type)&&c.type!=='gnd');
  if(bad)throw new Error('Analogové a číslicové prvky zatím simulujte v samostatných schématech.');
  const coords=new Map(),parent=new Map(),pins=new Map();
  const add=(x,y)=>{const k=key(x,y);coords.set(k,{x,y});if(!parent.has(k))parent.set(k,k);return k;};
  const find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(k)!==k){const n=parent.get(k);parent.set(k,r);k=n;}return r;};
  const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(b,a);};
  for(const c of comps){
    const angle=(c.rotation||0)*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle);
    const cp={};
    for(const p of c.type==='gnd'?[pin('gnd',0,0)]:byType.get(c.type).pins)cp[p.id]=add(c.x+co*p.x-si*p.y,c.y+si*p.x+co*p.y);
    pins.set(c.id,cp);
  }
  for(const w of wires){add(w.a.x,w.a.y);add(w.b.x,w.b.y);}
  for(const p of probes)add(p.x,p.y);
  for(const w of wires){
    const a=add(w.a.x,w.a.y),b=add(w.b.x,w.b.y);union(a,b);
    const dx=w.b.x-w.a.x,dy=w.b.y-w.a.y,len2=dx*dx+dy*dy;
    if(len2===0)continue;
    for(const [k,p] of coords){const cross=(p.x-w.a.x)*dy-(p.y-w.a.y)*dx,dot=(p.x-w.a.x)*dx+(p.y-w.a.y)*dy;if(Math.abs(cross)<1e-6&&dot>=-1e-6&&dot<=len2+1e-6)union(a,k);}
  }
  const ids=new Map(),nodeMap={};
  for(const [k]of coords){const r=find(k);if(!ids.has(r))ids.set(r,`d${ids.size}`);nodeMap[k]=ids.get(r);}
  for(const cp of pins.values())for(const p of Object.keys(cp))cp[p]=nodeMap[cp[p]];
  return {pins,nodeMap,nodes:[...ids.values()]};
}
function resolve(values){const active=values.filter(v=>v!=='Z');if(!active.length)return 'Z';if(active.some(v=>v==='X'))return 'X';return active.every(v=>v===active[0])?active[0]:'X';}

export function simulateDigital(project,options={}) {
  const duration=Number(options.duration??project.settings?.duration??0.05),step=Number(options.step??project.settings?.step??0.0001);
  if(!(duration>=0&&duration<=1e5&&step>0&&Number.isFinite(step)))throw new Error('Zadejte konečný nezáporný čas a kladný krok simulace.');
  const count=Math.ceil(duration/step)+1;
  if(count>50001)throw new Error('Nejvýše 50 000 časových kroků. Zvětšete krok simulace.');
  const top=topology(project),comps=project.components||[],mem=new Map(),outputs=new Map();
  if(top.nodes.length*count>5000000)throw new Error('Příliš mnoho dat digitálních uzlů. Zvětšete časový krok nebo zkraťte simulaci.');
  const nodeValue={},read=(c,p)=>logic(nodeValue[top.pins.get(c.id)[p]]),write=(c,p,v)=>outputs.set(`${c.id}:${p}`,v);
  const stateful=new Set(['rs','sr','fbd_rs','dff','jkff','tff','counter','register','ton','tof','tp']);
  const clocks=comps.filter(c=>c.type==='clock');
  const params=new Map(comps.map(c=>[c.id,{...(byType.get(c.type)?.defaults||{}),...c.params}]));
  const clockEvents=clocks.reduce((sum,c)=>sum+Math.ceil(duration*Number(params.get(c.id).frequency)*2),0);
  if(clockEvents>150000)throw new Error('Příliš mnoho hodinových hran. Snižte frekvenci nebo délku simulace (limit 150 000 hran).');
  for(const c of comps){const p=params.get(c.id);if(c.type==='clock'&&!(Number(p.frequency)>0&&Number.isFinite(Number(p.frequency))))throw new Error(`Hodiny ${c.id}: frekvence musí být kladná.`);if(['ton','tof','tp'].includes(c.type)&&!(Number(p.preset)>=0&&Number.isFinite(Number(p.preset))))throw new Error(`Časovač ${c.id}: předvolba musí být nezáporná.`);mem.set(c.id,{q:['counter','register'].includes(c.type)?Number(p.initial||0)&15:logic(p.initial??0),prev:0,last:0,since:null,until:null});}
  const driveState=(c)=>{const m=mem.get(c.id);if(c.type==='counter'||c.type==='register'){for(let i=0;i<4;i++)write(c,`q${i}`,typeof m.q==='number'?(m.q>>i)&1:'X');}else if(['ton','tof','tp'].includes(c.type))write(c,'out',m.q);else {write(c,'q',m.q);write(c,'nq',inv(m.q));}};
  const refresh=()=>{const drivers=new Map(top.nodes.map(n=>[n,[]]));for(const c of comps){const cp=top.pins.get(c.id);if(c.type==='gnd'){drivers.get(cp.gnd).push(0);continue;}for(const p of byType.get(c.type).pins){const k=`${c.id}:${p.id}`;if(outputs.has(k))drivers.get(cp[p.id]).push(outputs.get(k));}}for(const [n,ds]of drivers)nodeValue[n]=resolve(ds);};
  const settle=()=>{for(let it=0;it<100;it++){refresh();let changed=false;for(const c of comps){
    if(['rs','sr','fbd_rs'].includes(c.type)){
      const s=read(c,'s'),r=read(c,'r'),m=mem.get(c.id);
      const v=c.type==='sr'&&s===1?1:c.type==='fbd_rs'&&r===1?0:s===1&&r===1?'X':s===1&&r===0?1:s===0&&r===1?0:s===0&&r===0?m.q:'X';
      if(v!==m.q){m.q=v;changed=true;}driveState(c);
    }else if(combinationalTypes.has(c.type)){
      const input=Object.fromEntries(byType.get(c.type).pins.filter(p=>!['out','sum','carry','y0','y1','y2','y3'].includes(p.id)).map(p=>[p.id,read(c,p.id)]));
      for(const [p,v]of Object.entries(digitalOutputs(c.type,input))){if(outputs.get(`${c.id}:${p}`)!==v)changed=true;write(c,p,v);}
    }
  }if(!changed){refresh();return;}}throw new Error('Číslicová síť se neustálila. Zkontrolujte kombinační zpětné vazby.');};
  let events=0,t=0;
  const evaluate=(now)=>{
    if(++events>200000)throw new Error('Příliš mnoho číslicových událostí. Snižte frekvenci nebo délku simulace.');
    for(const c of comps){if(c.type==='input')write(c,'out',logic(params.get(c.id).value));if(c.type==='clock')write(c,'out',Math.floor(now*Number(params.get(c.id).frequency)*2+1e-9)%2);if(stateful.has(c.type))driveState(c);}
    settle();
    for(let delta=0;delta<100;delta++){
    for(const c of comps){const m=mem.get(c.id),p=params.get(c.id);if(!stateful.has(c.type)||['rs','sr','fbd_rs'].includes(c.type))continue;
      if(['ton','tof','tp'].includes(c.type)){
        const v=read(c,'in'),pt=Number(p.preset),rising=m.last===0&&v===1,falling=m.last===1&&v===0;
        if(v==='X'||v==='Z'){m.q='X';m.since=null;m.until=null;}
        else if(c.type==='ton'){if(v===0){m.since=null;m.q=0;}else {if(m.since===null)m.since=now;m.q=now+1e-12>=m.since+pt?1:0;}}
        else if(c.type==='tof'){if(v===1){m.q=1;m.until=null;}else {if(falling)m.until=now+pt;m.q=m.until!==null&&now+1e-12<m.until?1:0;}}
        else {if(rising&&!(m.until!==null&&now<m.until))m.until=now+pt;m.q=m.until!==null&&now+1e-12<m.until?1:0;}
        m.last=v;
      }else {
        const clk=read(c,'clk'),rising=m.prev===0&&clk===1;
        if(c.type==='counter'&&read(c,'reset')===1)m.q=0;
        else if(c.type==='counter'&&read(c,'reset')!==(0))m.q='X';
        else if(rising){
          if(c.type==='dff'){const d=read(c,'d');m.q=typeof d==='number'?d:'X';}
          if(c.type==='tff'){const v=read(c,'t');m.q=v===1?inv(m.q):v===0?m.q:'X';}
          if(c.type==='jkff'){const j=read(c,'j'),k=read(c,'k');m.q=j===0&&k===0?m.q:j===1&&k===0?1:j===0&&k===1?0:j===1&&k===1?inv(m.q):'X';}
          if(c.type==='counter')m.q=typeof m.q==='number'?(m.q+1)&15:'X';
          if(c.type==='register'){const v=read(c,'d');m.q=typeof m.q==='number'&&typeof v==='number'?((m.q<<1)|v)&15:'X';}
        }
        m.prev=clk;
      }
      driveState(c);
    }
    settle();
    const pending=comps.some(c=>{const m=mem.get(c.id);if(['ton','tof','tp'].includes(c.type))return read(c,'in')!==m.last;if(['dff','jkff','tff','counter','register'].includes(c.type))return read(c,'clk')!==m.prev||(c.type==='counter'&&read(c,'reset')===1&&m.q!==0);return false;});
    if(!pending)break;
    if(delta===99)throw new Error('Sekvenční zpětná vazba se neustálila v jednom okamžiku.');
    }
  };
  const traces=(project.probes||[]).map(p=>({id:p.id,label:p.label||p.id,unit:'logic',values:[]})),time=[];
  const nodeTraces=Object.fromEntries(top.nodes.map(n=>[n,[]]));
  evaluate(0);
  for(let i=0;i<count;i++){
    const sample=Math.min(i*step,duration);
    while(t<sample-1e-13){
      let next=sample;
      for(const c of clocks){const half=1/(2*Number(params.get(c.id).frequency)),edge=(Math.floor(t/half+1e-8)+1)*half;if(edge<next)next=edge;}
      for(const c of comps){if(!['ton','tof','tp'].includes(c.type))continue;const m=mem.get(c.id),deadline=c.type==='ton'&&m.since!==null?m.since+Number(params.get(c.id).preset):m.until;if(deadline!==null&&deadline>t+1e-12&&deadline<next)next=deadline;}
      t=next;evaluate(t);
    }
    time.push(sample);
    for(const n of top.nodes)nodeTraces[n].push(typeof nodeValue[n]==='number'?nodeValue[n]:NaN);
    traces.forEach((tr,j)=>{const p=project.probes[j],v=nodeValue[top.nodeMap[key(p.x,p.y)]];tr.values.push(typeof v==='number'?v:NaN);});
  }
  const voltages=Object.fromEntries(Object.entries(nodeValue).map(([n,v])=>[n,typeof v==='number'?v:NaN]));
  return {time,traces,nodeTraces,nodeMap:top.nodeMap,voltages,currents:{},logicStates:{...nodeValue},method:'Ideal digital event simulation; four-state logic; zero-delay gates',warnings:['Ideální číslicové bloky bez fyzikálních napěťových úrovní a zpoždění. X/Z se v grafu zobrazují jako mezera.']};
}
export function digitalDC(project){return simulateDigital(project,{duration:0,step:1});}

const c=(id,type,x,y,params={})=>({id,type,x,y,rotation:0,params});
const w=(id,x1,y1,x2,y2)=>({id,a:{x:x1,y:y1},b:{x:x2,y:y2}});
const project=(mode,title,components,wires,probes,settings={})=>({version:1,mode,title,components,wires,probes,settings:{duration:0.1,step:0.0001,acStart:10,acStop:1e6,...settings}});
const probe=(id,label,x,y,color)=>({id,label,x,y,color});
const logicInputWires=()=>[w('w1',200,180,280,180),w('w2',280,180,280,200),w('w3',280,200,360,200),w('w4',200,260,280,260),w('w5',280,260,280,240),w('w6',280,240,360,240)];
export const digitalExamples=[
 {id:'digital-nand',mode:'digital',title:'NAND a pravdivostní tabulka',description:'Dvojklikem přepínejte vstupy A a B. Výstup NAND je 0 pouze pro A = B = 1.',project:project('digital','NAND',[
   c('A','input',160,180,{value:1}),c('B','input',160,260,{value:1}),c('G1','nand',400,220)
 ],logicInputWires(),[probe('Q','NAND Q',440,220,'#d77a20')],{duration:0.05})},
 {id:'digital-counter',mode:'digital',title:'Čítač 4 bit',description:'Čítač přičítá při náběžné hraně hodin. Dvojklikem přepněte RESET; aktivní je v logické 1.',project:project('digital','Čítač 4 bit',[
   c('CLK','clock',160,180,{frequency:100}),c('RESET','input',160,260,{value:0}),c('C1','counter',400,220,{initial:0})
 ],logicInputWires(),[probe('clk','CLK',200,180,'#4b9fda'),...Array.from({length:4},(_,i)=>probe(`q${i}`,`Q${i}`,440,180+i*20,['#d77a20','#c45188','#8f77cf','#3aab89'][i]))])},
 {id:'digital-dff',mode:'digital',title:'D klopný obvod',description:'D se přenese na Q pouze na náběžné hraně CLK. Změňte D dvojklikem a sledujte Q a negovaný výstup.',project:project('digital','D klopný obvod',[
   c('D','input',160,180,{value:1}),c('CLK','clock',160,260,{frequency:20}),c('D1','dff',400,220,{initial:0})
 ],logicInputWires(),[probe('d','D',200,180,'#4b9fda'),probe('clk','CLK',200,260,'#8f77cf'),probe('q','Q',440,200,'#d77a20'),probe('nq','Negované Q',440,240,'#3aab89')])},
 {id:'digital-tff',mode:'digital',title:'T klopný obvod: dělič dvěma',description:'Při T = 1 se Q překlopí na každé náběžné hraně CLK. Jeho frekvence je poloviční; při T = 0 stav drží.',project:project('digital','T klopný obvod',[
   c('T','input',160,180,{value:1}),c('CLK','clock',160,260,{frequency:100}),c('T1','tff',400,220,{initial:0})
 ],logicInputWires(),[probe('clk','CLK',200,260,'#4b9fda'),probe('q','Q = CLK / 2',440,200,'#d77a20')])}
];
const timerInfo={ton:['Zpožděné zapnutí TON','Zapnutí Q po nepřerušené době PT = 10 ms. Vstup 0 výstup ihned vypne.'],tof:['Zpožděné vypnutí TOF','Q se zapne ihned se vstupem. Po vypnutí vstupu zůstane ještě PT = 10 ms zapnutý.'],tp:['Impuls TP','Náběžná hrana vytvoří impuls Q délky PT = 10 ms. Nové hrany během impulsu jej neprodlužují.']};
export const fbdExamples=Object.entries(timerInfo).map(([type,[title,description]])=>({
 id:`fbd-${type}`,mode:'fbd',title,description,
 project:project('fbd',title,[c('CLK','clock',160,220,{frequency:20}),c(type.toUpperCase()+'1',type,400,220,{preset:0.01})],[w('w1',200,220,360,220)],
 [probe('in','Vstup',200,220,'#4b9fda'),probe('q',type.toUpperCase()+' Q',440,220,'#d77a20')])
}));
