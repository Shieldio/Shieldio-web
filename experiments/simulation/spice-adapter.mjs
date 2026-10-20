import {compile} from './engine.mjs';
/** ngspice / EEcircuit-engine adapter. Computation is isolated from the UI. */
export const DEFAULT_ENGINE_URL = new URL('./vendor/eecircuit-engine-1.8.0.mjs',import.meta.url).href;

export class SpiceEngine {
  constructor({ engineURL = DEFAULT_ENGINE_URL } = {}) {
    this.engineURL = engineURL;
    this.worker = null;
    this.pending = null;
    this.sequence = 0;
  }

  run(netlist, { timeout = 45000 } = {}) {
    if (this.pending) return Promise.reject(new Error('Simulace již běží.'));
    if (typeof netlist !== 'string' || !/^\s*\.end\s*$/im.test(netlist)) {
      return Promise.reject(new Error('Neplatný SPICE netlist: chybí .end.'));
    }
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.stop('Překročen časový limit simulace.'), timeout);
      this.pending = { id, resolve, reject, timer };
      try {
        if (!this.worker) {
          this.worker = new Worker(new URL('./spice-worker.mjs', import.meta.url), { type: 'module' });
          this.worker.onmessage = ({ data }) => {
            if (!this.pending || data.id !== this.pending.id) return;
            const pending = this.pending;
            clearTimeout(pending.timer);
            this.pending = null;
            if (data.error) pending.reject(new Error(data.error));
            else pending.resolve(data.result);
          };
          this.worker.onerror = event => this.stop(event.message || 'Výpočetní jádro se nepodařilo načíst.');
        }
        this.worker.postMessage({ id, engineURL: this.engineURL, netlist });
      } catch (error) {
        this.stop(error.message);
      }
    });
  }

  stop(reason = 'Simulace byla zastavena.') {
    this.worker?.terminate();
    this.worker = null;
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject(new Error(reason));
      this.pending = null;
    }
  }

  dispose() { this.stop(); }
}

export function getVector(result, name) {
  const normalized = name.toLowerCase();
  return result.data.find(vector => vector.name.toLowerCase() === normalized);
}

/** Convert AC voltage/current vectors to gain and phase relative to an input. */
export function transfer(result, outputName, inputName) {
  if (result.dataType !== 'complex') throw new Error('Pro přenos je potřebná AC analýza.');
  const output = getVector(result, outputName);
  const input = getVector(result, inputName);
  const frequencies = result.data.find(vector => vector.type === 'frequency');
  if (!output || !input || !frequencies) throw new Error('Chybí měřený vstup nebo výstup.');
  return output.values.map((out, index) => {
    const source = input.values[index];
    const denominator = source.real ** 2 + source.img ** 2;
    const frequency = frequencies.values[index];
    if (denominator === 0) return { frequency: frequency.real ?? frequency, gain: NaN, gainDb: NaN, phase: NaN };
    const real = (out.real * source.real + out.img * source.img) / denominator;
    const img = (out.img * source.real - out.real * source.img) / denominator;
    const gain = Math.hypot(real, img);
    return { frequency: frequency.real ?? frequency, gain, gainDb: 20 * Math.log10(gain), phase: Math.atan2(img, real) * 180 / Math.PI };
  });
}

const si=x=>{if(!Number.isFinite(Number(x)))throw Error('Neplatný parametr SPICE.');return Number(x).toExponential(12)};
export function toSpice(project,options={}){
 const compiled=compile(project),mode=options.mode||'tran',duration=Number(options.duration??project.settings?.duration??.01),step=Number(options.step??project.settings?.step??5e-6);
 if(!['tran','ac','op'].includes(mode))throw Error('Nepodporovaná SPICE analýza.');
 if(mode==='tran'&&(!(duration>0)||!(step>0)||step>duration||duration/step>30000))throw Error('Časová SPICE analýza potřebuje kladnou délku a krok, nejvýše 30 000 výstupních bodů.');
 const input=compiled.parts.find(p=>p.type==='vac'&&(!options.inputId||p.id===options.inputId));
 if(mode==='ac'&&(!input||!input.params.value))throw Error('AC analýza potřebuje generátor s nenulovou amplitudou.');
 const lines=['SHiELDiO Sim - modelove zapojeni','.options reltol=1e-5 abstol=1e-10 vntol=1e-7'],currentVectors={};
 const names=new Map(compiled.parts.map((p,i)=>[p.id,`${({resistor:'R',capacitor:'C',inductor:'L',vdc:'V',vac:'V',diode:'D',switch:'R',opamp:'E'})[p.type]}${i+1}`]));
 for(const [index,p]of compiled.parts.entries()){
  const n=p.nodes,q=p.params,name=names.get(p.id);
  if(['resistor','capacitor','switch','diode'].includes(p.type)){
   const sense=`sense${index}`,ammeter=`Vsense${index}`;
   if(p.type==='diode')lines.push(`${name} ${n.a} ${sense} DM${index}`,`.model DM${index} D(IS=${si(q.value)} N=${si(q.n)} TNOM=27)`);
   else lines.push(`${name} ${n.a} ${sense} ${si(p.type==='switch'&&!q.closed?1e12:q.value)}`);
   lines.push(`${ammeter} ${sense} ${n.b} DC 0`);
   currentVectors[p.id]=`${ammeter.toLowerCase()}#branch`;
  }else if(p.type==='inductor'){lines.push(`${name} ${n.a} ${n.b} ${si(q.value)}`);currentVectors[p.id]=`${name.toLowerCase()}#branch`;}
  else if(p.type==='vdc'){lines.push(`${name} ${n.a} ${n.b} DC ${si(q.value)} AC 0`);currentVectors[p.id]=`${name.toLowerCase()}#branch`;}
  else if(p.type==='vac'){
   if(!(q.frequency>0))throw Error('Frekvence generátoru musí být kladná.');
   const T=1/q.frequency;let wave;
   if(q.waveform==='square'){const edge=Math.min(step/10,T/1e4);wave=`PULSE(${si(q.offset-q.value)} ${si(q.offset+q.value)} 0 ${si(edge)} ${si(edge)} ${si(T/2-edge)} ${si(T)})`;}
   else if(q.waveform==='triangle'){
    const cycles=Math.ceil(duration/T)+1;if(cycles*4>30000&&mode==='tran')throw Error('Trojúhelníkový zdroj vyžaduje příliš mnoho bodů. Zkraťte záznam.');
    const pairs=['0',si(q.offset)];if(mode==='tran')for(let k=0;k<cycles;k++)for(const [fraction,m]of [[.25,1],[.75,-1],[1,0]])pairs.push(si((k+fraction)*T),si(q.offset+m*q.value));
    else pairs.push(si(T/4),si(q.offset+q.value));wave=`PWL(${pairs.join(' ')})`;
   }else wave=`SIN(${si(q.offset)} ${si(q.value)} ${si(q.frequency)})`;
   lines.push(`${name} ${n.a} ${n.b} DC ${si(q.offset)} AC ${si(p.id===input?.id?q.value:0)} ${wave}`);currentVectors[p.id]=`${name.toLowerCase()}#branch`;
  }else if(p.type==='opamp'){
   const drive=`u${index}_drive`,state=`u${index}_state`,C=1e-6,R=q.gain/(2*Math.PI*q.gbw*C),limit=q.slew*C;
   lines.push(`Bdrv${index} ${drive} 0 V=min(max(${si(q.gain)}*(v(${n.plus})-v(${n.minus})),-${si(q.rail)}),${si(q.rail)})`,
    `Bpole${index} ${state} 0 I=min(max((v(${state})-v(${drive}))/${si(R)},-${si(limit)}),${si(limit)})`,
    `Cpole${index} ${state} 0 ${si(C)}`,`${name} ${n.out} 0 ${state} 0 1`);
   currentVectors[p.id]=`${name.toLowerCase()}#branch`;
  }else throw Error(`Součástka ${p.type} nemá SPICE model.`);
 }
 lines.push('.save all');
 if(mode==='op')lines.push('.op');
 if(mode==='tran')lines.push(`.tran ${si(step)} ${si(duration)} 0 ${si(step)} uic`);
 if(mode==='ac'){
  const start=Number(options.start??project.settings?.acStart??10),stop=Number(options.stop??project.settings?.acStop??1e6),points=Math.round(options.points??180);
  if(!(start>0&&stop>start&&stop<=1e10&&points>=2&&points<=1000))throw Error('Neplatný AC rozsah (nejvýše 10 GHz a 1 000 bodů).');
  const perDecade=Math.max(1,Math.ceil((points-1)/Math.log10(stop/start)));lines.push(`.ac dec ${perDecade} ${si(start)} ${si(stop)}`);
 }
 lines.push('.end');return {netlist:lines.join('\n')+'\n',compiled,currentVectors,input,mode,step};
}

export async function runSpice(project,options={}){
 const plan=toSpice(project,options),engine=options.engine||new SpiceEngine();
 try{
  const raw=await engine.run(plan.netlist);
  if(plan.mode==='tran'){
   const times=getVector(raw,'time')?.values;if(!times?.length)throw Error('SPICE nevrátil časovou osu.');
   const duration=Number(options.duration??project.settings?.duration??.01),count=Math.ceil(duration/plan.step),uniform=Array.from({length:count+1},(_,i)=>Math.min(i*plan.step,duration));
   for(const vector of raw.data){
    if(vector.name==='time'){vector.values=uniform;continue;}
    const source=vector.values;let cursor=0;
    vector.values=uniform.map(t=>{while(cursor+1<times.length&&times[cursor+1]<t)cursor++;if(t<=times[0])return source[0];if(cursor+1>=times.length)return source.at(-1);const ratio=(t-times[cursor])/(times[cursor+1]-times[cursor]||1);return source[cursor]+ratio*(source[cursor+1]-source[cursor]);});
   }
  }
  const get=name=>getVector(raw,name)?.values;
  const first=raw.data[0]?.values||[],length=first.length;if(length>200000)throw Error('SPICE vytvořil příliš velký záznam. Zkraťte délku simulace.');
  const voltage=n=>n==='0'?Array.from({length},()=>plan.mode==='ac'?{real:0,img:0}:0):get(`v(${n})`);
  const nodeTraces={};for(const node of plan.compiled.nodes){const v=voltage(node.id);if(v)nodeTraces[node.id]=v;}
  const probes=(project.probes||[]).length?project.probes:plan.compiled.nodes.filter(n=>n.id!=='0').map(n=>({id:n.id,label:`U(${n.id})`,x:n.x,y:n.y}));
  const traces=probes.map(p=>{const node=plan.compiled.nodeAt(p.x,p.y),values=voltage(node);if(!values)throw Error(`SPICE nevrátil napětí sondy ${p.label||p.id}.`);return {id:p.id,label:p.label||p.id,color:p.color,unit:'V',values};});
  if(plan.mode==='ac'){
   const vector=raw.data.find(v=>v.type==='frequency'||v.name==='frequency');if(!vector)throw Error('SPICE nevrátil frekvenční osu.');
   const frequency=vector.values.map(v=>typeof v==='number'?v:v.real);
   return {frequency,traces:traces.map(t=>({...t,magnitude:t.values.map(v=>20*Math.log10(Math.max(1e-15,Math.hypot(v.real,v.img)/Math.abs(plan.input.params.value)))),phase:t.values.map(v=>Math.atan2(v.img/plan.input.params.value,v.real/plan.input.params.value)*180/Math.PI)})),nodeMap:plan.compiled.nodeMap,engine:'ngspice',warnings:['AC je malá signálová analýza modelu. Ideální modely nejsou ověřeným RF návrhem.']};
  }
  const currents={},voltages={};for(const [id,name]of Object.entries(plan.currentVectors)){const values=get(name)||(name.endsWith('#branch')?get(`i(${name.replace('#branch','')})`):undefined);if(values){currents[id]=values.at(-1);if(plan.mode==='tran')traces.push({id:`I:${id}`,label:`I(${id})`,unit:'A',values});}}
  for(const [id,values]of Object.entries(nodeTraces))voltages[id]=values.at(-1);
  if(plan.mode==='op')for(const part of plan.compiled.parts){
   if(currents[part.id]!==undefined)continue;
   const voltage=(voltages[part.nodes.a]||0)-(voltages[part.nodes.b]||0);
   if(part.type==='resistor'||part.type==='switch')currents[part.id]=voltage/(part.type==='switch'&&!part.params.closed?1e12:part.params.value);
   else if(part.type==='capacitor')currents[part.id]=0;
   else if(part.type==='diode')currents[part.id]=part.params.value*(Math.exp(Math.min(40,voltage/(.02585*part.params.n)))-1);
  }
  if(plan.mode==='op')return {voltages,currents,nodeMap:plan.compiled.nodeMap,engine:'ngspice'};
  const time=get('time');if(!time?.length)throw Error('SPICE nevrátil časovou osu.');
  return {time,traces,nodeMap:plan.compiled.nodeMap,nodeTraces,step:plan.step,method:'ngspice adaptive transient',engine:'ngspice',final:{voltages,currents},warnings:['Časová simulace ngspice začíná nulovým stavem kondenzátorů a cívek.']};
 }finally{if(!options.engine)engine.dispose();}
}
