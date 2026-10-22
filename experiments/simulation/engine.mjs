import {digitalCatalog,isDigital,digitalDC,simulateDigital} from './digital.mjs';
/* SHiELDiO Sim: lumped-element MNA solver. Educational device models, not vendor-accurate SPICE macromodels.
 * Transient: backward Euler, fixed integration step; AC: linear small-signal.
 * Wire crossings connect only at an explicit endpoint, pin or probe.
 */
const two = [{id:'a',x:-40,y:0},{id:'b',x:40,y:0}];
export const catalog = [
 {type:'resistor',label:'Rezistor',category:'Pasivní',pins:two,defaults:{value:1000}},
 {type:'capacitor',label:'Kondenzátor',category:'Pasivní',pins:two,defaults:{value:1e-6,initialVoltage:0}},
 {type:'inductor',label:'Cívka',category:'Pasivní',pins:two,defaults:{value:1e-3,initialCurrent:0}},
 {type:'vdc',label:'Stejnosměrný zdroj',category:'Zdroje',pins:two,defaults:{value:5}},
 {type:'vac',label:'Generátor signálu',category:'Zdroje',pins:two,defaults:{value:1,frequency:1000,offset:0,phase:0,duty:.5,waveform:'sine'}},
 {type:'idc',label:'Stejnosměrný proudový zdroj',category:'Zdroje',pins:two,defaults:{value:.001}},
 {type:'iac',label:'Střídavý proudový zdroj',category:'Zdroje',pins:two,defaults:{value:.001,frequency:1000,offset:0,phase:0,duty:.5,waveform:'sine'}},
 {type:'led',label:'LED dioda',category:'Polovodiče',pins:two,defaults:{value:1e-20,n:2,rs:0}},
 {type:'diode',label:'Dioda',category:'Polovodiče',pins:two,defaults:{value:1e-12,n:1.8,rs:0}},
 {type:'schottky',label:'Schottkyho dioda',category:'Polovodiče',pins:two,defaults:{value:1e-8,n:1.05,rs:0}},
 {type:'zener',label:'Zenerova dioda',category:'Polovodiče',pins:two,defaults:{value:1e-12,n:1.5,rs:0,breakdown:5.1,rz:10}},
 {type:'tunnel',label:'Tunelová dioda',category:'Polovodiče',pins:two,defaults:{value:1e-12,n:1.8,rs:0,peakCurrent:.005,peakVoltage:.07,valleyCurrent:.001,valleyVoltage:.35}},
 {type:'npn',label:'Tranzistor NPN',category:'Polovodiče',pins:[{id:'b',x:-40,y:0},{id:'c',x:40,y:-40},{id:'e',x:40,y:40}],defaults:{is:1e-14,beta:100,betaReverse:2,n:1}},
 {type:'pnp',label:'Tranzistor PNP',category:'Polovodiče',pins:[{id:'b',x:-40,y:0},{id:'c',x:40,y:-40},{id:'e',x:40,y:40}],defaults:{is:1e-14,beta:100,betaReverse:2,n:1}},
 {type:'opamp',label:'Operační zesilovač',category:'Polovodiče',pins:[{id:'plus',x:-40,y:-20},{id:'minus',x:-40,y:20},{id:'out',x:40,y:0},{id:'vcc',x:0,y:-60},{id:'vee',x:0,y:60}],defaults:{powered:true,gain:1e5,rail:15,slew:0.5e6,gbw:1e6,outputResistance:0,headroom:0,inputOffset:0}},
 {type:'switch',label:'Spínač',category:'Ostatní',pins:two,defaults:{closed:true,value:0.01}},
 {type:'gnd',label:'Zem / reference',category:'Ostatní',pins:[{id:'gnd',x:0,y:0}],defaults:{}},
 ...digitalCatalog
];
const kinds = Object.fromEntries(catalog.map(c=>[c.type,c]));
const key=(x,y)=>`${Math.round(x*1e6)/1e6},${Math.round(y*1e6)/1e6}`;
const finite=(v,label)=>{if(!Number.isFinite(Number(v)))throw Error(`Neplatná hodnota: ${label}.`);return Number(v)};
const positive=(v,label)=>{v=finite(v,label);if(v<=0)throw Error(`${label} musí být větší než nula.`);return v};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const isBJT=type=>type==='npn'||type==='pnp';
const isDiode=type=>['diode','led','schottky','zener','tunnel'].includes(type);
// Low-Is LED models need exponents above 40 at ordinary mA currents. Beyond
// exp(80), continue linearly to keep the Newton derivative consistent with I(V).
const exp80=Math.exp(80);
function junctionModel(type,q,v){const vt=.02585*q.n,zForward=v/vt,ev=zForward>80?exp80*(1+zForward-80):Math.exp(Math.max(-60,zForward)),dev=zForward>80?exp80:zForward < -60?0:ev;let i=q.value*(ev-1)+1e-12*v,g=q.value*dev/vt+1e-12;if(type==='zener'&&v < -q.breakdown){i+=(v+q.breakdown)/q.rz;g+=1/q.rz;}if(type==='tunnel'){const z=clamp(v/q.peakVoltage,-40,40),e=Math.exp(1-z),r=q.valleyCurrent/ q.valleyVoltage;i+=q.peakCurrent*z*e+r*v;g+=q.peakCurrent/q.peakVoltage*e*(1-z)+r;}return {i,g};}
/** Terminal I(V) with optional series resistance. The junction voltage u is
 * solved from u + rs*Ij(u) = V. Differential conductance follows the implicit
 * derivative gj/(1 + rs*gj), including reverse Zener breakdown.
 */
export function diodeModel(type,q,v){
 const rs=Number(q.rs??0);
 if(!Number.isFinite(rs)||rs<0)throw Error('Sériový odpor diody musí být konečný a nezáporný.');
 if(rs===0)return junctionModel(type,q,v);
 if(v===0){const r=junctionModel(type,q,0);return {i:r.i,g:r.g/(1+rs*r.g)};}
 let lo=Math.min(0,v),hi=Math.max(0,v);
 // A forward logarithmic seed avoids enormous exponential Newton iterates.
 let u=v>0?Math.min(v,.02585*q.n*Math.log1p(v/(rs*q.value))):v;
 const tolerance=2e-13*Math.max(1,Math.abs(v));
 for(let k=0;k<100;k++){
  const r=junctionModel(type,q,u),f=u+rs*r.i-v,d=1+rs*r.g;
  if(Math.abs(f)<=tolerance){
   if(Math.abs(d)<1e-14)throw Error('Pracovní bod diody se sériovým odporem je nestabilní.');
   return {i:r.i,g:r.g/d};
  }
  if(f>0)hi=u;else lo=u;
  const next=u-f/d;
  // Safeguard Newton against overshoot and the tunnel model's NDR region.
  u=Number.isFinite(next)&&next>lo&&next<hi?next:(lo+hi)/2;
 }
 throw Error('Model diody se sériovým odporem nekonvergoval. Zkontrolujte jeho parametry.');
}
/** Static coupled Ebers–Moll model at 300 K. Terminal currents enter C/B/E.
 * Transport Is is shared by both junctions; alpha_F*Is_BE=alpha_R*Is_BC.
 * No Early effect, charge storage, junction capacitance or self-heating.
 */
export function bjtModel(type,q,voltage){
 const polarity=type==='pnp'?-1:1,af=q.beta/(1+q.beta),ar=q.betaReverse/(1+q.betaReverse),vt=.02585*q.n;
 const junction=v=>{const z=v/vt,e=z>80?exp80*(1+z-80):Math.exp(Math.max(-60,z)),d=z>80?exp80:z < -60?0:e;return {i:e-1,g:d/vt};};
 const f=junction(polarity*(voltage.b-voltage.e)),r=junction(polarity*(voltage.b-voltage.c)),ifor=q.is/af*f.i,irev=q.is/ar*r.i,gf=q.is/af*f.g,gr=q.is/ar*r.g;
 const c=polarity*(af*ifor-irev),e=polarity*(-ifor+ar*irev),b=-c-e;
 const jacobian={c:{b:af*gf-gr,c:gr,e:-af*gf},b:{b:(1-af)*gf+(1-ar)*gr,c:-(1-ar)*gr,e:-(1-af)*gf}};
 jacobian.e=Object.fromEntries(['b','c','e'].map(k=>[k,-jacobian.c[k]-jacobian.b[k]]));
 return {currents:{c,b,e},jacobian};
}
export function pinsFor(c){const type=kinds[c.type];if(!type)throw Error(`Neznámá součástka: ${c.type}`);const a=(c.rotation||0)*Math.PI/180;return type.pins.filter(p=>c.type!=='opamp'||c.params?.powered||!['vcc','vee'].includes(p.id)).map(p=>({id:p.id,x:Math.round((c.x+p.x*Math.cos(a)-p.y*Math.sin(a))*1e6)/1e6,y:Math.round((c.y+p.x*Math.sin(a)+p.y*Math.cos(a))*1e6)/1e6}));}
const on=(p,a,b)=>Math.abs((p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x))<1e-6 && p.x>=Math.min(a.x,b.x)-1e-6&&p.x<=Math.max(a.x,b.x)+1e-6&&p.y>=Math.min(a.y,b.y)-1e-6&&p.y<=Math.max(a.y,b.y)+1e-6;
export function compile(project){
 if(!project||!Array.isArray(project.components)||!Array.isArray(project.wires))throw Error('Soubor neobsahuje platný projekt.');
 if(project.components.length>250||project.wires.length>1500)throw Error('Beta podporuje nejvýše 250 součástek a 1 500 vodičů.');
 if(!project.components.length)throw Error('Vložte součástky a propojte obvod.');
 const points=new Map(), parent=new Map(), ids=new Set();
 const add=p=>{finite(p.x,'souřadnice x');finite(p.y,'souřadnice y');const k=key(p.x,p.y);points.set(k,{x:p.x,y:p.y});if(!parent.has(k))parent.set(k,k);return k};
 const find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);while(k!==r){const q=parent.get(k);parent.set(k,r);k=q}return r};
 const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(b,a)};
 const parts=project.components.map(c=>{
  if(typeof c.id!=='string'||ids.has(c.id))throw Error('Každá součástka musí mít jedinečné označení.');ids.add(c.id);
  if(!kinds[c.type])throw Error(`Nepodporovaná součástka ${c.type}.`);
  const params={...kinds[c.type].defaults,...(c.type==='opamp'?{powered:false}:{}),...c.params}, pins=pinsFor(c);pins.forEach(add);
  if(['resistor','capacitor','inductor'].includes(c.type))positive(params.value,`${c.id}: hodnota`);
  if(c.type==='capacitor')params.initialVoltage=finite(params.initialVoltage,`${c.id}: počáteční napětí`);
  if(c.type==='inductor')params.initialCurrent=finite(params.initialCurrent,`${c.id}: počáteční proud`);
  if(isDiode(c.type)){positive(params.value,`${c.id}: Is`);positive(params.n,`${c.id}: emisní koeficient`);params.rs=finite(params.rs,`${c.id}: sériový odpor`);if(params.rs<0)throw Error(`${c.id}: sériový odpor musí být nezáporný.`);}
  if(c.type==='zener'){positive(params.breakdown,c.id+': průrazné napětí');positive(params.rz,c.id+': dynamický odpor');}if(c.type==='tunnel')for(const k of ['peakCurrent','peakVoltage','valleyCurrent','valleyVoltage'])positive(params[k],c.id+': '+k);
  if(c.type==='switch')positive(params.value,`${c.id}: odpor sepnutí`);
  if(['vdc','vac','idc','iac'].includes(c.type))finite(params.value,`${c.id}: ${c.type==='idc'||c.type==='iac'?'proud':'napětí'}`);
  if(c.type==='vac'||c.type==='iac'){positive(params.frequency,`${c.id}: frekvence`);finite(params.offset,`${c.id}: offset`);finite(params.phase,`${c.id}: fáze`);if(!(params.duty>0&&params.duty<1))throw Error(`${c.id}: střída musí být mezi 0 a 1.`);if(!['sine','square','triangle'].includes(params.waveform))throw Error('Neznámý průběh zdroje.');}
  if(isBJT(c.type))for(const p of ['is','beta','betaReverse','n'])positive(params[p],`${c.id}: ${p}`);
  if(c.type==='opamp'){for(const p of ['outputResistance','headroom']){params[p]=finite(params[p],`${c.id}: ${p}`);if(params[p]<0)throw Error(`${c.id}: ${p} musí být nezáporný.`);}params.inputOffset=finite(params.inputOffset,`${c.id}: vstupní offset`);}
  if(c.type==='opamp')for(const p of ['gain','rail','slew','gbw'])positive(params[p],`${c.id}: ${p}`);
  return {...c,params,pins};
 });
 for(const w of project.wires){if(!w.a||!w.b)throw Error('Vodič nemá oba konce.');add(w.a);add(w.b)}
 for(const p of project.probes||[])add(p);
 for(const w of project.wires){const a=key(w.a.x,w.a.y);for(const [k,p]of points)if(on(p,w.a,w.b))union(a,k)}
 const grounds=parts.filter(c=>c.type==='gnd');
 // An electrical reference fixes the otherwise arbitrary common-mode voltage.
 // Explicit GND symbols retain their original shared-net behavior. With no GND,
 // reference only one terminal; do not silently ground disconnected islands.
 const referencePart=grounds[0]||parts.find(c=>c.type==='vdc'||c.type==='vac')||parts.find(c=>c.type==='idc'||c.type==='iac')||parts.find(c=>c.pins.some(p=>p.id==='b'))||parts[0];
 const referencePin=grounds.length?referencePart.pins[0]:referencePart.pins.find(p=>p.id==='b')||referencePart.pins[0];
 const g=key(referencePin.x,referencePin.y);for(const c of grounds)union(g,key(c.pins[0].x,c.pins[0].y));
 const reference={kind:grounds.length?'explicit':'automatic',automatic:!grounds.length,componentId:referencePart.id,pinId:referencePin.id,x:referencePin.x,y:referencePin.y,node:'0'};
 const roots=new Map([[find(g),'0']]), nodes=[],nodeMap={};let next=1;
 for(const [k,p]of points){const r=find(k);if(!roots.has(r))roots.set(r,`n${next++}`);const id=roots.get(r);nodeMap[k]=id;if(!nodes.some(n=>n.id===id))nodes.push({id,...p});}
 const nodeAt=(x,y)=>{const exact=nodeMap[key(x,y)];if(exact!==undefined)return exact;for(const w of project.wires)if(on({x,y},w.a,w.b))return nodeMap[key(w.a.x,w.a.y)];return undefined};
 for(const c of parts){c.nodes={};for(const p of c.pins)c.nodes[p.id]=nodeMap[key(p.x,p.y)];}
 const active=parts.filter(c=>c.type!=='gnd');const branches=active.filter(c=>['vdc','vac','inductor','opamp'].includes(c.type));
 const nodeIds=nodes.filter(n=>n.id!=='0').map(n=>n.id), index=Object.fromEntries(nodeIds.map((n,i)=>[n,i]));
 branches.forEach((c,i)=>c.branch=nodeIds.length+i);
 if(nodeIds.length+branches.length>200)throw Error('Beta podporuje nejvýše 200 nezávislých napětí a větvových proudů.');
 return {project,parts:active,nodes,nodeIds,nodeMap,nodeAt,index,size:nodeIds.length+branches.length,reference};
}
function matrix(n){return Array.from({length:n},()=>new Float64Array(n));}
function solve(A,b){
 const n=b.length;for(let k=0;k<n;k++){
  let best=k,score=0;for(let i=k;i<n;i++){let scale=0;for(let j=k;j<n;j++)scale=Math.max(scale,Math.abs(A[i][j]));const s=scale?Math.abs(A[i][k])/scale:0;if(s>score){score=s;best=i}}
  if(!score||Math.abs(A[best][k])<1e-24){const e=Error('Obvod nelze vyřešit: zkontrolujte nezapojené uzly, zem a ideální zdroje zapojené proti sobě.');e.nodeIndex=k;throw e;}
  [A[k],A[best]]=[A[best],A[k]];[b[k],b[best]]=[b[best],b[k]];
  for(let i=k+1;i<n;i++){const f=A[i][k]/A[k][k];if(f===0)continue;A[i][k]=0;for(let j=k+1;j<n;j++)A[i][j]-=f*A[k][j];b[i]-=f*b[k]}
 }
 const x=new Float64Array(n);for(let i=n-1;i>=0;i--){let v=b[i];for(let j=i+1;j<n;j++)v-=A[i][j]*x[j];x[i]=v/A[i][i];if(!Number.isFinite(x[i]))throw Error('Výpočet není konečný. Zkontrolujte hodnoty součástek.');}return x;
}
const getV=(c,x,n)=>n==='0'?0:x[c.index[n]]||0;
export const sourceValue=(p,t,dcMode=false)=>{if(p.type==='vdc'||p.type==='idc')return p.params.value;const q=p.params;if(dcMode)return q.offset;const phase=(q.phase||0)/360,cycles=q.frequency*t+phase,fraction=((cycles%1)+1)%1;const s=q.waveform==='square'?(fraction<(q.duty??.5)?1:-1):q.waveform==='triangle'?2/Math.PI*Math.asin(Math.sin(2*Math.PI*cycles)):Math.sin(2*Math.PI*cycles);return q.offset+q.value*s};
const source=sourceValue;

function stampReal(c,x,mode,t,dt,previous){
 const A=matrix(c.size),b=new Float64Array(c.size);
 const ix=n=>n==='0'?-1:c.index[n];
 const put=(r,s,v)=>{if(r>=0&&s>=0)A[r][s]+=v};
 const inject=(n,v)=>{const i=ix(n);if(i>=0)b[i]+=v};
 const conduct=(a,z,g)=>{a=ix(a);z=ix(z);put(a,a,g);put(z,z,g);put(a,z,-g);put(z,a,-g)};
 const branch=(p,a,z)=>{const k=p.branch,aI=ix(a),zI=ix(z);put(aI,k,1);put(zI,k,-1);put(k,aI,1);put(k,zI,-1);return k};
 for(const p of c.parts){const {type,params:q,nodes:n}=p;const v=getV(c,x,n.a)-getV(c,x,n.b),old=previous?.[p.id]||{};
  if(type==='resistor'||type==='switch')conduct(n.a,n.b,type==='switch'&&!q.closed?1e-12:1/q.value);
  else if(type==='capacitor'){if(mode==='transient'){const g=q.value/dt;conduct(n.a,n.b,g);const h=g*(old.v||0);inject(n.a,h);inject(n.b,-h)}}
  else if(type==='inductor'){const k=branch(p,n.a,n.b);if(mode==='transient'){A[k][k]-=q.value/dt;b[k]=-q.value/dt*(old.i||0)}}
  else if(type==='idc'||type==='iac'){const i=source(p,t,mode==='dc');inject(n.a,-i);inject(n.b,i);}
  else if(type==='vdc'||type==='vac'){const k=branch(p,n.a,n.b);b[k]=source(p,t,mode==='dc')}
  else if(isDiode(type)){const {i,g}=diodeModel(type,q,v);conduct(n.a,n.b,g);const h=i-g*v;inject(n.a,-h);inject(n.b,h)}
  else if(isBJT(type)){const volt=Object.fromEntries(['b','c','e'].map(k=>[k,getV(c,x,n[k])])),model=bjtModel(type,q,volt);for(const row of ['b','c','e']){let h=model.currents[row];for(const col of ['b','c','e']){put(ix(n[row]),ix(n[col]),model.jacobian[row][col]);h-=model.jacobian[row][col]*volt[col];}inject(n[row],-h);}}
  else if(type==='opamp'){
   const k=branch(p,n.out,'0'),diff=getV(c,x,n.plus)-getV(c,x,n.minus)+q.inputOffset;let a=q.gain,offset=0;
   if(mode==='transient'){const alpha=dt/(dt+q.gain/(2*Math.PI*q.gbw));a*=alpha;offset=(1-alpha)*(old.v||0)}
   let target=a*diff+offset,lo=q.powered?getV(c,x,n.vee):-q.rail,hi=q.powered?getV(c,x,n.vcc):q.rail;if(lo>hi)throw Error(`${p.id}: napájení V+ je nižší než V−. Opravte polaritu zdrojů.`);
   const middle=(lo+hi)/2;lo=Math.min(middle,lo+q.headroom);hi=Math.max(middle,hi-q.headroom);
   if(mode==='transient'){const previous=old.v||0,l=Math.max(lo,previous-q.slew*dt),h=Math.min(hi,previous+q.slew*dt);if(l>h)lo=hi=clamp(previous,lo,hi);else{lo=l;hi=h;}}
   if(target<lo||target>hi){target=clamp(target,lo,hi);a=0;offset=target}else offset+=a*q.inputOffset;
   put(k,k,-q.outputResistance);put(k,ix(n.plus),-a);put(k,ix(n.minus),a);b[k]=offset;
  }
 }
 return {A,b};
}
function diagnose(c){const connected=new Set(['0']);for(let pass=0;pass<c.parts.length+1;pass++)for(const p of c.parts){let ns=Object.values(p.nodes);if(ns.some(n=>connected.has(n)))for(let n of ns)connected.add(n);}const floating=c.parts.filter(p=>Object.values(p.nodes).some(n=>!connected.has(n)));if(floating.length)throw Error('Obvod nelze vyřešit: '+floating.map(p=>p.id).join(', ')+` nemá spojení s referenčním uzlem (${c.reference.componentId}.${c.reference.pinId}). Propojte izolovanou část se zbytkem obvodu.`);for(const p of c.parts){if(['vdc','vac'].includes(p.type)&&p.nodes.a===p.nodes.b&&(p.params.value||p.params.offset))throw Error(`Zdroj ${p.id} je zkratovaný: oba vývody jsou na stejném vodiči.`);if(p.type==='opamp'&&p.params.powered){for(const pin of ['vcc','vee']){const node=p.nodes[pin],shared=c.parts.some(q=>q!==p&&Object.values(q.nodes).includes(node));if(!shared&&node!=='0')throw Error(`${p.id}: napájecí vývod ${pin==='vcc'?'V+':'V−'} není zapojený.`);}}}}
function operating(c,mode='dc',t=0,dt=1e-6,previous={},guess){
 if(!guess)diagnose(c);let x=guess?Float64Array.from(guess):new Float64Array(c.size);const nonlinear=c.parts.some(p=>isDiode(p.type)||isBJT(p.type)||p.type==='opamp');
 for(let it=0;it<(nonlinear?240:1);it++){
  const {A,b}=stampReal(c,x,mode,t,dt,previous);let out;try{out=solve(A,b);}catch(e){const node=c.nodeIds[e.nodeIndex],parts=c.parts.filter(p=>Object.values(p.nodes).includes(node)||p.branch===e.nodeIndex);if(parts.length)e.message+=' Místo: '+parts.map(p=>p.id+' ('+Object.entries(p.nodes).filter(([pin,n])=>n===node).map(([pin])=>pin).join(', ')+')').join(', ')+'.';throw e;}let err=0,maxD=0;
  for(let i=0;i<c.nodeIds.length;i++)maxD=Math.max(maxD,Math.abs(out[i]-x[i]));
  // Voltage limiting keeps exponential diode models on a convergent Newton path.
  const damp=nonlinear&&c.parts.some(p=>isDiode(p.type)||isBJT(p.type))&&maxD>0.35?0.35/maxD:1;
  for(let i=0;i<x.length;i++){const next=x[i]+damp*(out[i]-x[i]);err=Math.max(err,Math.abs(next-x[i])/(1+Math.abs(next)));x[i]=next}
  if(!nonlinear||err<1e-9)return x;
 }
 throw Error('Nelineární výpočet nekonvergoval. Zkontrolujte zpětnou vazbu OZ a zapojení diod nebo zmenšete časový krok.');
}
function values(c,x,mode='dc',dt=1e-6,previous={},t=0){
 const voltages={'0':0},currents={},terminalCurrents={},state={};for(const id of c.nodeIds)voltages[id]=x[c.index[id]];
 for(const p of c.parts){const {nodes:n,params:q,type}=p;const v=getV(c,x,n.a)-getV(c,x,n.b);let i=0;
  if(p.branch!==undefined)i=x[p.branch];
  else if(type==='resistor'||type==='switch')i=v*(type==='switch'&&!q.closed?1e-12:1/q.value);
  else if(type==='capacitor'&&mode==='transient')i=q.value/dt*(v-(previous[p.id]?.v||0));
  else if(type==='idc'||type==='iac')i=source(p,t,mode==='dc');
  else if(isDiode(type))i=diodeModel(type,q,v).i;
  if(isBJT(type)){terminalCurrents[p.id]=bjtModel(type,q,Object.fromEntries(['b','c','e'].map(k=>[k,getV(c,x,n[k])]))).currents;i=terminalCurrents[p.id].c;}
  currents[p.id]=i;state[p.id]={v:type==='opamp'?getV(c,x,n.out)-q.outputResistance*i:isBJT(type)?getV(c,x,n.c)-getV(c,x,n.e):v,i};
 }return {voltages,currents,terminalCurrents,state};
}
export function dc(project){if(isDigital(project))return digitalDC(project);const c=compile(project),x=operating(c);return {...values(c,x),nodeMap:c.nodeMap,nodes:c.nodes,reference:c.reference,engine:'MNA / výukové modely'};}
function probeList(c){
 const ps=c.project.probes||[];
 return ps.length?ps.map(p=>{const node=c.nodeAt(p.x,p.y);if(node===undefined)throw Error(`Sonda ${p.label||p.id} není připojená k vodiči.`);return {id:p.id,label:p.label||p.id,node,color:p.color}}):c.nodes.filter(n=>n.id!=='0').map(n=>({id:n.id,label:`U(${n.id})`,node:n.id}));
}
export function transient(project,options={}){
 if(isDigital(project))return simulateDigital(project,options);
 const c=compile(project),duration=positive(options.duration??project.settings?.duration??0.01,'Doba simulace'),step=positive(options.step??project.settings?.step??duration/2000,'Časový krok');
 // Remove only floating-point roundoff at integral step boundaries. Otherwise
 // ceil(0.001 / 1e-6) creates a duplicate final time with dt=0.
 const ratio=duration/step,count=Math.max(1,Math.ceil(ratio-32*Number.EPSILON*Math.max(1,Math.abs(ratio))));if(count>30000)throw Error('Příliš mnoho kroků: zvyšte časový krok nebo zkraťte dobu (limit 30 000).');
 if(count*c.size*c.size>6e7)throw Error('Výpočet je pro interaktivní betu příliš rozsáhlý. Zkraťte záznam nebo zjednodušte obvod.');
 const maxFreq=Math.max(0,...c.parts.filter(p=>p.type==='vac'||p.type==='iac').map(p=>p.params.frequency));if(maxFreq*step>1/20)throw Error('Časový krok je příliš velký pro frekvenci zdroje. Použijte nejméně 20 kroků na periodu, pro přesnější výsledek 100 a více.');
 const ps=probeList(c),traces=ps.map(p=>({id:p.id,label:p.label,unit:'V',color:p.color,values:[]}));
 for(const p of c.parts)traces.push({id:`I:${p.id}`,label:isBJT(p.type)?`I_C(${p.id})`:`I(${p.id})`,unit:'A',values:[]});
 const terminalTraces=c.parts.filter(p=>isBJT(p.type)).flatMap(p=>['b','e'].map(pin=>({id:`I:${p.id}:${pin}`,componentId:p.id,pin,label:`I_${pin.toUpperCase()}(${p.id})`,unit:'A',values:[]})));traces.push(...terminalTraces);
 const startTime=Number(options.startTime)||0;
 const time=[],nodeTraces=Object.fromEntries(c.nodes.map(n=>[n.id,[]]));let previous=options.initialState?.parts||Object.fromEntries(c.parts.map(p=>[p.id,{v:p.type==='capacitor'?(p.params.initialVoltage||0):0,i:p.type==='inductor'?(p.params.initialCurrent||0):0}])),x,lastResult;
 // Initial sample uses zero capacitor voltage and inductor current. Compute the
 // initial algebraic constraints with a tiny step; state remains zero for t>0.
 x=operating(c,'transient',startTime,Math.min(step*1e-6,1e-12),previous,options.initialState?.solution);
 const initial=values(c,x,'transient',Math.min(step*1e-6,1e-12),previous,startTime);
 const record=(t,r)=>{lastResult=r;time.push(t);for(const id in nodeTraces)nodeTraces[id].push(r.voltages[id]);for(let i=0;i<ps.length;i++)traces[i].values.push(r.voltages[ps[i].node]);for(let i=0;i<c.parts.length;i++)traces[ps.length+i].values.push(r.currents[c.parts[i].id]);for(const tr of terminalTraces)tr.values.push(r.terminalCurrents[tr.componentId][tr.pin]);};
 record(startTime,initial);
 for(let k=1;k<=count;k++){const t=startTime+Math.min(k*step,duration),dt=t-time[time.length-1];if(!(dt>0))continue;x=operating(c,'transient',t,dt,previous,x);const r=values(c,x,'transient',dt,previous,t);record(t,r);previous=r.state;}
 return {time,traces,nodeTraces,nodeMap:c.nodeMap,reference:c.reference,step,method:'Backward Euler',initialConditions:'zero',warnings:maxFreq*step>1/100?['Pro přesnější tvar průběhu zmenšete časový krok alespoň na 1/100 periody.']:[],final:lastResult};
}
function complexSystem(c,frequency,dcResult,input){
 // Complex MNA expanded into a real 2N system, [Re(x), Im(x)].
 const N=c.size,A=matrix(2*N),b=new Float64Array(2*N),ix=n=>n==='0'?-1:c.index[n],w=2*Math.PI*frequency;
 const put=(r,s,re,im=0)=>{if(r<0||s<0)return;A[r][s]+=re;A[r][s+N]-=im;A[r+N][s]+=im;A[r+N][s+N]+=re};
 const conduct=(a,z,re,im=0)=>{a=ix(a);z=ix(z);put(a,a,re,im);put(z,z,re,im);put(a,z,-re,-im);put(z,a,-re,-im)};
 const branch=(p,a,z)=>{const k=p.branch;put(ix(a),k,1);put(ix(z),k,-1);put(k,ix(a),1);put(k,ix(z),-1);return k};
 for(const p of c.parts){const {type,params:q,nodes:n}=p;
  if(type==='resistor'||type==='switch')conduct(n.a,n.b,type==='switch'&&!q.closed?1e-12:1/q.value);
  else if(type==='capacitor')conduct(n.a,n.b,0,w*q.value);
  else if(type==='inductor'){const k=branch(p,n.a,n.b);put(k,k,0,-w*q.value)}
  else if(type==='idc'||type==='iac'){}
  else if(type==='vdc'||type==='vac'){const k=branch(p,n.a,n.b);b[k]=p.id===input.id?q.value:0;}
  else if(isDiode(type)){const v=(dcResult.voltages[n.a]||0)-(dcResult.voltages[n.b]||0);conduct(n.a,n.b,diodeModel(type,q,v).g)}
  else if(isBJT(type)){const model=bjtModel(type,q,Object.fromEntries(['b','c','e'].map(k=>[k,dcResult.voltages[n[k]]||0])));for(const row of ['b','c','e'])for(const col of ['b','c','e'])put(ix(n[row]),ix(n[col]),model.jacobian[row][col]);}
  else if(type==='opamp'){const k=branch(p,n.out,'0');put(k,k,-q.outputResistance);const s=frequency/(q.gbw/q.gain),re=q.gain/(1+s*s),im=-q.gain*s/(1+s*s);put(k,ix(n.plus),-re,-im);put(k,ix(n.minus),re,im)}
 }
 return solve(A,b);
}
export function ac(project,options={}){
 if(isDigital(project))throw Error('Frekvenční AC analýza je určena analogovým obvodům. Číslicové obvody použijte v časové simulaci.');
 const c=compile(project),start=positive(options.start??project.settings?.acStart??1,'Počáteční frekvence'),stop=positive(options.stop??project.settings?.acStop??1e6,'Konečná frekvence'),points=Math.round(positive(options.points??300,'Počet bodů'));
 if(stop<=start)throw Error('Konečná frekvence musí být vyšší než počáteční.');if(stop>1e10)throw Error('Frekvenční analýza podporuje nejvýše 10 GHz (ideální soustředěné modely).');if(points<2||points>1000)throw Error('Frekvenční analýza potřebuje 2 až 1 000 bodů.');
 const input=options.inputId?c.parts.find(p=>p.id===options.inputId&&p.type==='vac'):c.parts.find(p=>p.type==='vac');if(!input||!input.params.value)throw Error('AC analýza potřebuje generátor (VAC) s nenulovou amplitudou.');
 const bias=dc(project),ps=probeList(c),traces=ps.map(p=>({id:p.id,label:p.label,color:p.color,magnitude:[],phase:[],real:[],imag:[]})),frequency=[];
 for(let k=0;k<points;k++){
  const f=start*Math.pow(stop/start,k/(points-1)),x=complexSystem(c,f,bias,input);frequency.push(f);
  for(let j=0;j<ps.length;j++){const id=ps[j].node,i=c.index[id],re=id==='0'?0:x[i]/input.params.value,im=id==='0'?0:x[i+c.size]/input.params.value;traces[j].real.push(re);traces[j].imag.push(im);traces[j].magnitude.push(20*Math.log10(Math.max(1e-15,Math.hypot(re,im))));traces[j].phase.push(Math.atan2(im,re)*180/Math.PI);}
 }
 return {frequency,traces,nodeMap:c.nodeMap,referenceNode:c.reference,inputId:input.id,reference:'Vout / Vac',warnings:['AC je malý signál kolem DC pracovního bodu. Saturace a slew rate se vyhodnocují pouze v časové simulaci. Při GHz ideální model nezahrnuje parazitní jevy a šíření po vedení.']};
}
