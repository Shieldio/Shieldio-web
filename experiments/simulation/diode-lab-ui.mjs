import {formatInstrument,createReadoutClock} from './instrument-readout.mjs';
import {diodeLabProfile,diodeLabSample,diodeLabRows,diodeLabWarnings,diodeLabCSV} from './diode-lab.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=(value,digits=6)=>Number.isFinite(value)&&value!==0&&Math.abs(value)<1e-4?value.toExponential(3):Number.isFinite(value)?new Intl.NumberFormat('cs-CZ',{maximumSignificantDigits:digits}).format(Math.abs(value)<1e-15?0:value):'—';
const numeric=value=>Number(String(value).trim().replace(',','.'));
const tableLimit=2000;
const fields=['t','US','UD','URS','ID','VA','VK','power'];
const validPoint=p=>p&&['t','US','UD','URS','ID'].every(k=>Number.isFinite(p[k]));

/** Diode demonstration controls. Source/method changes are owned by the app; all currents are A internally.
 * onExportCSV receives {csv,filename,points}. Optional onTableChange is for project autosave.
 * isRunning throttles live presentation only; paused/DC and explicit render always show the exact point.
 */
export function createDiodeLabUI({getProject,getRecord,getIndex,onSourceChange,onMethodChange,onExportCSV,onTableChange=()=>{},isRunning=()=>false}){
  const host=document.getElementById('diodeLab'),dialog=document.getElementById('diodeTable');
  if(!host||!dialog)throw new Error('Chybí panel nebo tabulka měření diody.');
  let step=.1,busy=false,signature='',message='',lastDevice='';
  const readoutClock=createReadoutClock(200);
  const meterHTML=(value,unit)=>{const reading=formatInstrument(value,unit);return `${escape(reading.text)} <small>${escape(reading.unit)}</small>`;};
  const $=selector=>host.querySelector(selector),d$=selector=>dialog.querySelector(selector);
  const isLab=()=>getProject()?.demo?.kind==='diode-iv';
  const profile=()=>diodeLabProfile(getProject());
  const device=()=>profile()?.id||getProject()?.components?.find(c=>c.id===(getProject()?.demo?.diodeComponent||'D1'))?.type||'diode';
  const source=()=>getProject()?.components?.find(c=>c.id===(getProject()?.demo?.sourceComponent||'V1'));
  const current=()=>{
    try{return diodeLabSample(getProject(),getRecord(),getIndex());}catch{return null;}
  };
  const rows=()=>Array.isArray(getProject()?.demo?.table)?getProject().demo.table.filter(p=>validPoint(p)&&(!p.device||p.device===device())):[];
  const canonical=p=>Object.fromEntries([...fields.filter(k=>Number.isFinite(p[k])).map(k=>[k,p[k]]),['device',device()]]);
  function writeRows(next){
    const project=getProject();if(!project?.demo)return;
    const other=Array.isArray(project.demo.table)?project.demo.table.filter(p=>p.device&&p.device!==device()&&validPoint(p)):[];
    project.demo.table=[...other,...next].slice(-tableLimit);
    onTableChange(project.demo.table);
    refreshTable();update({force:true});
  }
  function setMessage(value,error=false){message=value;for(const el of [$('#diodeLabMessage'),d$('#diodeTableMessage')])if(el){el.textContent=value;el.hidden=!value;el.classList.toggle('error',error);}}
  function pending(value){busy=value;host.setAttribute('aria-busy',String(value));updateDisabled();}
  function updateDisabled(){
    const valid=validPoint(current()),record=getRecord(),hasRecord=!!record?.time?.length;
    for(const el of host.querySelectorAll('button,input,select'))el.disabled=busy;
    for(const el of dialog.querySelectorAll('[data-diode-action]'))el.disabled=busy;
    for(const el of [...host.querySelectorAll('[data-diode-action="capture"]'),...dialog.querySelectorAll('[data-diode-action="capture"]')])el.disabled=busy||!valid;
    d$('[data-diode-action="fill"]')?.toggleAttribute('disabled',busy||!hasRecord);
    d$('[data-diode-action="clear"]')?.toggleAttribute('disabled',busy||!rows().length);
    d$('[data-diode-action="csv"]')?.toggleAttribute('disabled',busy||!rows().length);
    if($('#diodeSourceValue'))$('#diodeSourceValue').disabled=busy||source()?.type!=='vdc';
    for(const el of host.querySelectorAll('[data-diode-step]'))el.disabled=busy||source()?.type!=='vdc';
  }
  async function changeSource(value){
    if(!Number.isFinite(value)||Math.abs(value)>10000){setMessage('Zadejte napětí zdroje od −10 000 do 10 000 V.',true);return;}
    pending(true);setMessage('');
    try{await onSourceChange(value);}catch(error){setMessage(error?.message||'Napětí se nepodařilo změnit.',true);}
    finally{pending(false);render();}
  }
  async function changeMethod(method){
    if(!['scope','meters'].includes(method))return;
    pending(true);setMessage('');
    try{await onMethodChange(method);}catch(error){setMessage(error?.message||'Metodu se nepodařilo změnit.',true);}
    finally{pending(false);render();}
  }
  function capture(){
    const point=current();if(!validPoint(point)){setMessage('Nejprve spusťte simulaci a vyberte platný bod.',true);return;}
    const saved=rows();if(saved.length>=tableLimit){setMessage(`Tabulka má limit ${tableLimit} bodů. Nejprve ji exportujte nebo vymažte.`,true);return;}
    writeRows([...saved,canonical(point)]);setMessage('Bod byl přidán do tabulky.');
  }
  function fill(){
    let samples;
    try{samples=diodeLabRows(getProject(),getRecord()).filter(validPoint);}catch(error){setMessage(error.message,true);return;}
    if(!samples.length){setMessage('Záznam zatím neobsahuje platné měření.',true);return;}
    const selected=[];
    const n=Math.min(201,samples.length);
    for(let i=0;i<n;i++)selected.push(canonical(samples[n===1?0:Math.round(i*(samples.length-1)/(n-1))]));
    const saved=rows(),seen=new Set(saved.map(p=>JSON.stringify(fields.map(k=>p[k]))));
    const added=selected.filter(p=>{const k=JSON.stringify(fields.map(k=>p[k]));if(seen.has(k))return false;seen.add(k);return true;});
    if(saved.length+added.length>tableLimit){setMessage(`Pro další body nestačí místo (limit ${tableLimit}). Exportujte nebo vymažte tabulku.`,true);return;}
    writeRows([...saved,...added]);setMessage(`Přidáno ${added.length} bodů ze záznamu${samples.length>201?' (rovnoměrný výběr, nejvýše 201)':''}.`);
  }
  function exportTable(){
    const points=rows();if(!points.length)return;
    try{
      const csv=diodeLabCSV(getProject(),getRecord(),{delimiter:';',rows:points});
      const filename=`VA-${device().replace(/[^a-zA-Z0-9_-]/g,'_')}.csv`;
      onExportCSV({csv,filename,points});setMessage('Tabulka byla exportována.');
    }catch(error){setMessage(error?.message||'Tabulku se nepodařilo exportovat.',true);}
  }
  function action(name){if(name==='capture')capture();if(name==='fill')fill();if(name==='clear'){writeRows([]);setMessage('Uložené body této diody byly vymazány.');}if(name==='csv')exportTable();}
  const pointCells=p=>[p?.t*1000,p?.US,p?.UD,p?.URS,p?.ID*1000].map(v=>`<td>${format(v)}</td>`).join('');
  function refreshTable(){
    if(!isLab()){if(dialog.open)dialog.close();return;}
    const saved=rows(),p=current(),name=profile()?.name||'Dioda';
    d$('#diodeTableDevice').textContent=name;
    d$('#diodeTableCount').textContent=`${saved.length} uložených bodů`;
    d$('#diodeCurrentRow').innerHTML=`<th scope="row">Aktuální bod</th>${pointCells(p)}`;
    d$('#diodeTableRows').innerHTML=saved.length?saved.map((p,i)=>`<tr><th scope="row">${i+1}</th>${pointCells(p)}</tr>`).join(''):'<tr><td colspan="6" class="diode-table-empty">Zvolte napětí zdroje a přidejte bod, nebo přidejte vzorky ze záznamu.</td></tr>';
    updateDisabled();
  }
  function render(){
    if(!isLab()){host.hidden=true;signature='';if(dialog.open)dialog.close();return;}
    host.hidden=false;
    const p=profile(),src=source(),method=getProject().demo.method==='meters'?'meters':'scope',name=p?.name||'Obecný model diody';
    const next=[device(),method,src?.type,p?.name].join('|');
    if(lastDevice&&lastDevice!==device())message='';lastDevice=device();
    if(signature!==next){
      signature=next;
      const limits=p?.limits||{},limitItems=[];
      if(Number.isFinite(limits.maxForwardCurrent))limitItems.push(`I<sub>F max</sub> ${format(limits.maxForwardCurrent*1000,4)} mA`);
      if(Number.isFinite(limits.maxReverseVoltage))limitItems.push(`U<sub>R max</sub> ${format(limits.maxReverseVoltage,4)} V`);
      if(Number.isFinite(limits.maxPower))limitItems.push(`P<sub>max</sub> ${format(limits.maxPower*1000,4)} mW`);
      host.innerHTML=`<div class="diode-lab-title"><h3>Měření diody</h3><span>${escape(name)}</span></div>
        <label class="field diode-method"><span>Metoda měření</span><select id="diodeMethod"><option value="scope" ${method==='scope'?'selected':''}>Osciloskop · charakteristika X–Y</option><option value="meters" ${method==='meters'?'selected':''}>Voltmetr a ampérmetr · DC body</option></select></label>
        <p class="diode-method-hint">${method==='scope'?'X = napětí na diodě, Y = proud. Zdroj prochází charakteristikou.':'Nastavte DC napětí, odečtěte hodnoty a uložte bod.'}</p>
        <div class="diode-source" ${method==='meters'?'':'hidden'}><label for="diodeSourceValue">Napětí zdroje U<sub>S</sub> [V]</label><div class="diode-source-value"><button data-diode-step="-1" aria-label="Snížit napětí zdroje">−</button><input id="diodeSourceValue" inputmode="decimal" type="number" step="any" aria-label="Napětí stejnosměrného zdroje ve voltech"><button data-diode-step="1" aria-label="Zvýšit napětí zdroje">+</button></div><label class="diode-source-step">Krok ΔU [V] <input id="diodeSourceStep" inputmode="decimal" type="number" min="0.000001" max="1000" step="any" value="${step}" aria-label="Krok napětí ve voltech"></label></div>
        <div class="diode-meter-values"><div><span>Voltmetr U<sub>D</sub></span><output id="diodeVoltage">— <small>V</small></output><small>V(A) − V(K)</small></div><div><span>Ampérmetr I<sub>D</sub></span><output id="diodeCurrent">— <small>mA</small></output><small>směr A → K</small></div></div>
        <div id="diodeLiveWarnings" class="diode-warnings" role="status" hidden></div>
        <div class="diode-lab-actions"><button data-diode-action="capture">Přidat bod</button><label class="diode-table-toggle"><input id="diodeShowTable" type="checkbox"> Tabulka <output id="diodeSavedCount">0</output></label></div>
        <p id="diodeLabMessage" class="diode-message" role="status" hidden></p>
        <details class="diode-profile"><summary>Model a mezní hodnoty</summary><p>Výuková aproximace při 25 °C. Nejde o naměřená data ani model výrobce.</p>${limitItems.length?`<p class="diode-limit-list">${limitItems.join('<br>')}</p>`:''}${limits.conditions?`<p>${escape(limits.conditions)}</p>`:''}<p>Bez samohřevu a poškození. Překročení limitů vyvolá upozornění; simulace proud neomezí podle katalogového maxima.</p>${p?.assumptions?.length?`<p>${escape(p.assumptions.at(-1))}</p>`:''}${p?.sourceURL?`<a href="${escape(p.sourceURL)}" target="_blank" rel="noopener noreferrer">Katalogový list ${escape(p.manufacturer||'výrobce')}</a>`:''}</details>`;
    }
    update({force:true});refreshTable();
  }
  function update({force=false}={}){
    if(!isLab()||host.hidden)return;
    if(!readoutClock.shouldUpdate({now:performance.now(),running:isRunning(),force}))return;
    const p=current();
    if($('#diodeVoltage'))$('#diodeVoltage').innerHTML=meterHTML(p?.UD,'V');
    if($('#diodeCurrent'))$('#diodeCurrent').innerHTML=meterHTML(p?.ID,'A');
    for(const id of ['diodeVoltage','diodeCurrent'])if($('#'+id))$('#'+id).title=Number.isFinite(p?.t)?`Odečet v t = ${format(p.t*1000)} ms; živé číslice 5× za sekundu`:'Bez platného vzorku';
    if($('#diodeSavedCount'))$('#diodeSavedCount').textContent=String(rows().length);
    const voltage=$('#diodeSourceValue');if(voltage&&document.activeElement!==voltage)voltage.value=String(source()?.type==='vdc'?source().params.value:0);
    const warnings=$('#diodeLiveWarnings');
    if(warnings){let notes=[];try{if(validPoint(p))notes=diodeLabWarnings(getProject(),p)||[];}catch{}warnings.innerHTML=notes.map(w=>`<p>${escape(w.message)}</p>`).join('');warnings.hidden=!notes.length;}
    if(dialog.open)d$('#diodeCurrentRow').innerHTML=`<th scope="row">Aktuální bod</th>${pointCells(p)}`;
    if(message&&$('#diodeLabMessage')){$('#diodeLabMessage').textContent=message;$('#diodeLabMessage').hidden=false;}
    updateDisabled();
  }
  host.addEventListener('change',e=>{
    if(e.target.id==='diodeMethod')changeMethod(e.target.value);
    if(e.target.id==='diodeSourceValue')changeSource(numeric(e.target.value));
    if(e.target.id==='diodeSourceStep'){const value=numeric(e.target.value);if(value>0&&value<=1000){step=value;setMessage('');}else{e.target.value=String(step);setMessage('Krok musí být kladný a nejvýše 1 000 V.',true);}}
    if(e.target.id==='diodeShowTable'){if(e.target.checked){refreshTable();dialog.showModal();}else dialog.close();}
  });
  host.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||busy)return;
    if(button.dataset.diodeStep){const value=numeric($('#diodeSourceValue')?.value);changeSource(Number((value+Number(button.dataset.diodeStep)*step).toPrecision(12)));}
    if(button.dataset.diodeAction)action(button.dataset.diodeAction);
  });
  dialog.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.diodeAction&&!busy)action(button.dataset.diodeAction);if(button.id==='diodeTableClose')dialog.close();});
  dialog.addEventListener('close',()=>{if($('#diodeShowTable'))$('#diodeShowTable').checked=false;});
  return {render,update};
}
