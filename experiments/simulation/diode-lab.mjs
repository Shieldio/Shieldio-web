import {pinsFor} from './engine.mjs';
import {DIODES} from './diode-devices.mjs';

// This module only reads recorded solver samples. In particular, it never
// reconstructs I(U), interpolates two different acquisition instants or runs a
// second solver. All returned physical quantities use base SI units.
const key=p=>`${Math.round(p.x*1e6)/1e6},${Math.round(p.y*1e6)/1e6}`;
function parts(project){
 const d=project?.demo||{},all=project?.components||[];
 const find=(field,fallback)=>all.find(c=>c.id===(d[field]||fallback));
 return {diode:find('diodeComponent','D1'),source:find('sourceComponent','V1'),resistor:find('seriesResistor','R1'),shunt:find('shuntComponent','RS')};
}
export function diodeLabProfile(project){
 const {diode}=parts(project),id=diode?.params?.device||project?.demo?.device;
 return DIODES.find(p=>p.id===id&&(!diode||p.type===diode.type))||null;
}
function node(record,pin){return pin?record?.nodeMap?.[key(pin)]:undefined;}
function voltage(record,pin,index){
 const id=node(record,pin);
 if(id===undefined||id===null)return NaN;
 // An absent trace for the solver's reference is exactly zero, not a missing
 // measurement. Other missing nodes remain NaN and must never become zero.
 if(String(id)==='0')return 0;
 const value=record.nodeTraces?.[id]?.[index];
 return Number.isFinite(value)?value:NaN;
}
function terminals(component){const pins=component?pinsFor(component):[];return {a:pins.find(p=>p.id==='a'),b:pins.find(p=>p.id==='b')};}
function componentVoltage(record,component,index){const p=terminals(component);return voltage(record,p.a,index)-voltage(record,p.b,index);}

/** index is an acquired sample index, never seconds. */
export function diodeLabSample(project,record,index=record?.time?.length-1){
 if(!record?.time?.length||!Number.isInteger(index)||index<0||index>=record.time.length)return null;
 const {diode,source,resistor,shunt}=parts(project),d=terminals(diode),r=terminals(resistor),s=terminals(shunt);
 const VA=voltage(record,d.a,index),VK=voltage(record,d.b,index),UD=VA-VK;
 const US=componentVoltage(record,source,index),URS=componentVoltage(record,shunt,index);
 const branch=record.traces?.find(trace=>trace.id===`I:${diode?.id}`),ID=branch?.values?.[index]??NaN;
 const rb=node(record,r.b),anode=node(record,d.a),cathode=node(record,d.b);
 // Determine series polarity from connected nodes, not from the symbol's
 // rotation. This continues to work after moving or rotating a component.
 const direction=rb!==undefined&&rb===anode?1:rb!==undefined&&rb===cathode?-1:NaN;
 const afterDiode=direction===1?cathode:direction===-1?anode:undefined;
 const shuntDirection=afterDiode!==undefined&&node(record,s.a)===afterDiode?1:afterDiode!==undefined&&node(record,s.b)===afterDiode?-1:NaN;
 const R=Number(resistor?.params?.value),RS=Number(shunt?.params?.value),t=record.time[index];
 const shuntCurrent=RS>0?direction*shuntDirection*URS/RS:NaN;
 const kvlResidual=US-direction*(UD+ID*(R+RS));
 return {index,t,time:t,VA,VK,UD,URS,US,ID,power:UD*ID,direction,shuntDirection,shuntCurrent,kvlResidual,
  valid:[t,VA,VK,UD,URS,US,ID].every(Number.isFinite)};
}

/** The latest acquired sample at or before time. There is no interpolation. */
export function diodeLabSampleAt(project,record,time=record?.time?.at(-1)){
 const times=record?.time;
 if(!times?.length||typeof time!=='number'||Number.isNaN(time)||time<times[0])return null;
 let lo=0,hi=times.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid+1;else hi=mid;}
 return diodeLabSample(project,record,Math.max(0,lo-1));
}
export function diodeLabRows(project,record){return Array.from({length:record?.time?.length||0},(_,index)=>diodeLabSample(project,record,index));}

/** Compare recorded operation with catalogue ratings. Never clamp the curve.
 * A row checks instantaneous current / reverse voltage / power. Passing an
 * array additionally checks time-weighted average forward current, if rated.
 */
export function diodeLabWarnings(project,sampleOrRows){
 const profile=diodeLabProfile(project);
 if(!profile)return [];
 const rows=(Array.isArray(sampleOrRows)?sampleOrRows:[sampleOrRows]).filter(Boolean);
 if(!rows.length)return [];
 const warnings=[],limits=profile.limits||{},finite=rows.filter(r=>[r.UD,r.ID].every(Number.isFinite));
 if(finite.length!==rows.length)warnings.push({code:'missing-sample',message:'Část měření chybí; tyto body nelze použít k posouzení mezních hodnot.'});
 if(!finite.length)return warnings;
 const max=fn=>finite.reduce((value,row)=>Math.max(value,fn(row)),0);
 const check=(field,value,code,unit,message)=>{const limit=limits[field];if(Number.isFinite(limit)&&value>limit*(1+1e-9))warnings.push({code,message,value,limit,unit});};
 check('maxForwardCurrent',max(r=>r.ID),'forward-current','A',`${profile.name}: překročen mezní propustný proud.`);
 check('maxReverseVoltage',max(r=>-r.UD),'reverse-voltage','V',`${profile.name}: překročeno mezní závěrné napětí.`);
 check('maxPower',max(r=>r.UD*r.ID),'power','W',`${profile.name}: překročena mezní výkonová ztráta za katalogových podmínek.`);
 // Average ratings refer to an interval, not a single instantaneous peak.
 if(Array.isArray(sampleOrRows)&&finite.length>1){
  let integral=0,duration=0;
  for(let j=1;j<finite.length;j++){
   const dt=(finite[j].t??finite[j].time)-(finite[j-1].t??finite[j-1].time);
   if(Number.isFinite(dt)&&dt>0){integral+=dt*(Math.max(0,finite[j-1].ID)+Math.max(0,finite[j].ID))/2;duration+=dt;}
  }
  if(duration>0)check('maxAverageCurrent',integral/duration,'average-current','A',`${profile.name}: překročen mezní průměrný propustný proud v zaznamenaném intervalu.`);
 }
 return warnings;
}
const columns=[['t_ms',r=>(r.t??r.time)*1000],['US_V',r=>r.US],['UD_V',r=>r.UD],['URS_V',r=>r.URS],['ID_mA',r=>r.ID*1000],['VA_V',r=>r.VA],['VK_V',r=>r.VK]];
const numeric=value=>Number.isFinite(value)?String(Number(value.toPrecision(12))):'';
export function tableCSV(rows,{delimiter=';'}={}){
 if(![';',',','\t'].includes(delimiter))throw Error('Nepodporovaný oddělovač CSV.');
 return [columns.map(([name])=>name).join(delimiter),...(rows||[]).filter(Boolean).map(row=>columns.map(([,value])=>numeric(value(row))).join(delimiter))].join('\r\n')+'\r\n';
}
export function diodeLabCSV(project,record,options={}){return tableCSV(options.rows??diodeLabRows(project,record),options);}

// Small aliases for consumers that only need the table / current-point view.
export const diodeProfile=diodeLabProfile;
export const diodePoint=diodeLabSample;
export function diodePoints(project,record,{maxPoints=Infinity}={}){
 const rows=diodeLabRows(project,record);
 if(!Number.isFinite(maxPoints)||rows.length<=maxPoints)return rows;
 const n=Math.max(1,Math.floor(maxPoints));
 if(n===1)return rows.length?[rows.at(-1)]:[];
 return Array.from({length:n},(_,i)=>rows[Math.round(i*(rows.length-1)/(n-1))]);
}
