import {compile} from './engine.mjs';
import {isDigital} from './digital.mjs';

// Absolute simulation time remains untouched. A replacement tail may start at
// any retained sample, so changing an input discards the old predicted future.
const tolerance=(a,b)=>32*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b),1e-300);
const sameTime=(a,b)=>Math.abs(a-b)<=tolerance(a,b);
const copy=value=>Array.isArray(value)?value.map(copy):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,copy(v)])):value;
const mapKey=map=>JSON.stringify(Object.entries(map||{}).sort(([a],[b])=>a.localeCompare(b)));
function validRecord(record){
 if(!record||!Array.isArray(record.time))throw Error('Průběžný záznam nemá platnou časovou osu.');
 for(let i=0;i<record.time.length;i++)if(!Number.isFinite(record.time[i])||record.time[i]<0||(i&&record.time[i]<record.time[i-1]&&!sameTime(record.time[i],record.time[i-1])))throw Error('Čas simulace musí být konečný, nezáporný a vzestupný.');
 for(const t of record.traces||[])if(!t.id||!t.values||t.values.length!==record.time.length)throw Error('Kanál měření má jiný počet vzorků než časová osa.');
 for(const values of Object.values(record.nodeTraces||{}))if(values.length!==record.time.length)throw Error('Napětí uzlu má jiný počet vzorků než časová osa.');
 if(record.states&&record.states.length!==record.time.length)throw Error('Paměťové stavy neodpovídají časové ose.');
}

/**
 * Pure rolling-buffer merge. Keep old data before the tail's first timestamp;
 * the tail owns the boundary and everything after it. Near-identical boundary
 * times are deduplicated, never rebased to zero. Keeps at most four visible
 * windows (one extra boundary sample for interpolation) and 12,000 samples.
 * `states` stays sample-aligned; optional `checkpoints` is a timed sparse list.
 */
export function appendSimulationRecords(old,tail,{window,maxSamples=12000}={}){
 validRecord(tail);if(old)validRecord(old);
 if(old?.time.length&&tail.time.length&&mapKey(old.nodeMap)!==mapKey(tail.nodeMap))throw Error('Zapojení se změnilo. Průběžný záznam spusťte znovu.');
 if(!Number.isInteger(maxSamples)||maxSamples<2)throw Error('Průběžný záznam potřebuje nejméně dva vzorky.');
 maxSamples=Math.min(12000,maxSamples);
 if(window!==undefined&&!(Number.isFinite(window)&&window>0))throw Error('Časové okno musí být konečné a kladné.');
 const selected=[],append=(record,index)=>{
  const t=record.time[index],last=selected.at(-1);
  if(last&&sameTime(t,last.record.time[last.index]))selected[selected.length-1]={record,index};
  else selected.push({record,index});
 };
 const cut=tail.time[0];
 if(old)for(let i=0;i<old.time.length;i++){const t=old.time[i];if(cut!==undefined&&(t>cut||sameTime(t,cut)))break;append(old,i);}
 for(let i=0;i<tail.time.length;i++)append(tail,i);
 let first=Math.max(0,selected.length-maxSamples);
 if(window!==undefined&&selected.length){
  const end=selected.at(-1).record.time[selected.at(-1).index],cutoff=end-window*4;
  let at=0;while(at<selected.length&&selected[at].record.time[selected[at].index]<cutoff)at++;
  first=Math.max(first,Math.max(0,at-1));
 }
 const samples=selected.slice(first),metadata={...(old||{}),...tail},time=samples.map(s=>s.record.time[s.index]);
 const traceByRecord=new Map([old,tail].filter(Boolean).map(record=>[record,new Map((record.traces||[]).map(t=>[t.id,t]))]));
 const traceMetadata=new Map([...(old?.traces||[]),...(tail.traces||[])].map(t=>[t.id,t]));
 const traces=[...traceMetadata].map(([id,t])=>({...t,values:samples.map(s=>traceByRecord.get(s.record).get(id)?.values[s.index]??NaN)}));
 const nodeIds=[...new Set([...Object.keys(old?.nodeTraces||{}),...Object.keys(tail.nodeTraces||{})])];
 const nodeTraces=Object.fromEntries(nodeIds.map(id=>[id,samples.map(s=>s.record.nodeTraces?.[id]?.[s.index]??NaN)]));
 const result={...metadata,time,traces,nodeTraces,nodeMap:{...(tail.nodeMap||old?.nodeMap||{})}};
 if(old?.states||tail.states){result.states=samples.map(s=>copy(s.record.states?.[s.index]??null));result.finalState=copy(result.states.at(-1));}
 if(old?.checkpoints||tail.checkpoints){
  const all=[...(old?.checkpoints||[]).filter(c=>cut===undefined||c.time<cut&&!sameTime(c.time,cut)),...(tail.checkpoints||[])].sort((a,b)=>a.time-b.time),checkpoints=[];
  for(const c of all){if(!Number.isFinite(c.time)||!time.length||c.time<time[0]&&!sameTime(c.time,time[0])||c.time>time.at(-1)&&!sameTime(c.time,time.at(-1)))continue;const last=checkpoints.at(-1);if(last&&sameTime(last.time,c.time))checkpoints[checkpoints.length-1]=copy(c);else checkpoints.push(copy(c));}
  result.checkpoints=checkpoints.slice(-maxSamples);
 }
 return result;
}

/** Reconstruct the state at an actual retained sample, for the next segment.
 * Pass it as engine transient()/simulateDigital() `initialState`, together with
 * `startTime: state.time`. No capacitor, inductor, opamp or PLC state is reset.
 */
export function currentStateAt(project,record,index=record?.time?.length-1){
 validRecord(record);
 if(!Number.isInteger(index)||index<0||index>=record.time.length)throw Error('Požadovaný vzorek není v průběžném záznamu.');
 if(isDigital(project)){
  const state=record.states?.[index];if(!state||!sameTime(state.time,record.time[index]))throw Error('U číslicového vzorku chybí paměťový stav. Spusťte simulaci znovu.');
  return copy(state);
 }
 const compiled=compile(project),time=record.time[index],last=index===record.time.length-1;
 if(mapKey(compiled.nodeMap)!==mapKey(record.nodeMap))throw Error('Uložený stav patří jinému zapojení. Spusťte simulaci znovu.');
 const voltage=node=>{
  if(node==='0')return 0;
  const value=record.nodeTraces?.[node]?.[index]??(last?record.final?.voltages?.[node]??record.voltages?.[node]:undefined);
  if(!Number.isFinite(value))throw Error(`Chybí napětí uzlu ${node} pro navázání simulace.`);
  return value;
 };
 const currents=new Map((record.traces||[]).filter(t=>t.id.startsWith('I:')).map(t=>[t.id.slice(2),t.values[index]]));
 const parts={},solution=new Array(compiled.size).fill(0);
 for(const node of compiled.nodeIds)solution[compiled.index[node]]=voltage(node);
 for(const c of compiled.parts){
  const v=c.type==='opamp'?voltage(c.nodes.out):voltage(c.nodes.a)-voltage(c.nodes.b);
  let i=currents.get(c.id)??(last?record.final?.currents?.[c.id]??record.currents?.[c.id]:undefined);
  if(!Number.isFinite(i))throw Error(`Chybí proud součástky ${c.id} pro navázání simulace.`);
  parts[c.id]={v,i};if(c.branch!==undefined)solution[c.branch]=i;
 }
 return {version:1,time,parts,solution};
}
