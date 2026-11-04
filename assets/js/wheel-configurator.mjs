import {defaults,validate,generateWheel,toSTL} from './wheel-geometry.mjs?v=20261104-4';
import {displayModel} from './3d-print.mjs?v=20261104-4';
const form=document.getElementById('wheel-form'),preset=document.getElementById('wheel-preset'),download=document.getElementById('download'),error=document.getElementById('wheel-error'),stats=document.getElementById('wheel-stats');
const en=()=>document.documentElement.lang==='en';
const storage='shieldio-wheel-v1';let current={...defaults},objectURL,timer,first=true,model,currentView='wheel';
try{const saved=JSON.parse(localStorage.getItem(storage));if(saved&&!validate({...defaults,...saved}).length)current={...defaults,...saved};}catch{}
function fill(p){for(const key of Object.keys(defaults))form.elements.namedItem(key).value=p[key];preset.value=Object.keys(defaults).every(k=>k==='diameter'||p[k]===defaults[k])&&[55,67].includes(p.diameter)?String(p.diameter):'custom';}
function read(){return Object.fromEntries(Object.keys(defaults).map(key=>[key,['hole','style'].includes(key)?form.elements.namedItem(key).value:form.elements.namedItem(key).value.trim()===''?NaN:Number(form.elements.namedItem(key).value)]));}
function disable(value){download.setAttribute('aria-disabled',String(value));if(value)download.removeAttribute('href');}
function name(p){return `kolo_${p.diameter}x${p.width}_${p.hole==='D'?'D':'O'}${p.shaft}_zapusteni${p.recess}x${p.recessDiameter}.stl`;}
function summary(p){if(!model||currentView!=='wheel')return;const number=v=>v.toLocaleString(en()?'en':'cs',{maximumFractionDigits:2});stats.textContent=en()?`Solid volume ${number(model.volume/1000)} cm³ · Hub length ${number(p.width-p.recess)} mm · ${p.hole==='D'?`Flat ${number(p.shaft/2-p.flatCut)} mm from axis`:'Round through-bore'}`:`Objem materiálu ${number(model.volume/1000)} cm³ · Délka náboje ${number(p.width-p.recess)} mm · ${p.hole==='D'?`Ploška ${number(p.shaft/2-p.flatCut)} mm od osy`:'Kruhový průchozí otvor'}`;}
function render(fit=first){
 clearTimeout(timer);const p=read();const errors=validate(p);
 form.elements.namedItem('spokes').disabled=p.style==='solid';form.elements.namedItem('spokeWidth').disabled=p.style==='solid';form.elements.namedItem('flatCut').disabled=p.hole==='round';form.elements.namedItem('recessDiameter').disabled=p.recess===0;
 if(errors.length){error.textContent=en()?'Check the dimensions. The hub needs a 2 mm wall, the remaining hub length must be at least 3 mm, and spokes must not overlap.':errors.join(' ');disable(true);return;}
 try{
  model=generateWheel(p);const buffer=toSTL(model);displayModel(buffer,name(p),fit);
  if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(new Blob([buffer],{type:'model/stl'}));download.href=objectURL;download.download=name(p);disable(false);error.textContent='';current=p;first=false;currentView='wheel';download.dataset.i18n='wheel.export';download.textContent=en()?'Download wheel STL':'Stáhnout kolo STL';summary(p);
  try{localStorage.setItem(storage,JSON.stringify(p));}catch{}
 }catch(e){error.textContent=en()?'Could not generate this wheel. Check the dimensions.':'Kolo se nepodařilo vytvořit. Zkontroluj rozměry.';disable(true);}
}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',e=>{if(e.target===preset)return;preset.value='custom';disable(true);clearTimeout(timer);timer=setTimeout(()=>render(false),120);});
form.addEventListener('change',e=>{if(e.target.id!=='wheel-preset')render(false);});
preset.addEventListener('change',()=>{if(preset.value==='custom')return;fill({...defaults,diameter:Number(preset.value)});render(true);});
document.getElementById('wheel-restore').addEventListener('click',()=>{fill({...defaults});render(true);});
download.addEventListener('click',e=>{if(download.getAttribute('aria-disabled')==='true')e.preventDefault();});
document.addEventListener('shieldio-lang-change',()=>summary(current));
document.addEventListener('shieldio-stl-opened',()=>{currentView='upload';stats.textContent='';download.dataset.i18n='print3d.download';download.textContent=en()?'Download STL':'Stáhnout STL';disable(false);});
fill(current);render();
