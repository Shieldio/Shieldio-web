const NS='http://www.w3.org/2000/svg', STEPS=20, WIDTH=1600, HEIGHT=900;
const $=(s)=>document.querySelector(s);
const esc=(s)=>String(s==null?'':s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATALOG=[
{id:'panel',name:'Ústředna PZTS',cat:'Ústředna a napájení',art:'<rect x="-39" y="-38" width="78" height="76"/><rect x="-30" y="-27" width="60" height="54"/><text x="0" y="5" text-anchor="middle" font-size="15">PZTS</text>'},
{id:'supply',name:'Napájecí zdroj',cat:'Ústředna a napájení',art:'<rect x="-36" y="-30" width="72" height="60"/><path d="M-29-15h58M-29 16h58"/><text x="0" y="7" text-anchor="middle" font-size="16">U</text>'},
{id:'rio',name:'Rozšiřovací modul RIO',cat:'Ústředna a napájení',art:'<rect x="-35" y="-30" width="70" height="60"/><text x="0" y="5" text-anchor="middle" font-size="17">RIO</text>'},
{id:'keypad',name:'Ovládací klávesnice',cat:'Ovládání a přístup',art:'<rect x="-31" y="-35" width="62" height="70"/><rect x="-22" y="-25" width="44" height="12"/><path d="M-19-2h5m9 0h5m9 0h5M-19 10h5m9 0h5m9 0h5M-19 22h5m9 0h5m9 0h5"/>'},
{id:'reader',name:'Čtečka karet',cat:'Ovládání a přístup',art:'<rect x="-30" y="-35" width="60" height="70"/><rect x="-19" y="-13" width="26" height="34"/><path d="M12-14q16 14 0 29M17-19q23 19 0 39"/>'},
{id:'interface',name:'Rozhraní čteček',cat:'Ovládání a přístup',art:'<rect x="-34" y="-30" width="68" height="60"/><rect x="-22" y="-16" width="44" height="32"/><text x="0" y="5" text-anchor="middle" font-size="12">BUS</text>'},
{id:'door',name:'Dveřní modul',cat:'Ovládání a přístup',art:'<rect x="-28" y="-36" width="56" height="72"/><path d="M-17-28v56l32-8v-41z"/><circle cx="8" cy="2" r="2"/>'},
{id:'pir',name:'PIR pohybový detektor',cat:'Detektory',art:'<circle r="30"/><path d="M-15 15q15-35 30 0M-21 22q21-49 42 0"/><text x="0" y="-16" text-anchor="middle" font-size="11">PIR</text>'},
{id:'glass',name:'Detektor tříštění skla',cat:'Detektory',art:'<rect x="-29" y="-30" width="58" height="60"/><path d="M-12-23L3-9-7 3 12 16M3-9L18-21M-7 3l-14 11M12 16l-4 8"/>'},
{id:'contact',name:'Magnetický kontakt',cat:'Detektory',art:'<rect x="-31" y="-24" width="20" height="48"/><rect x="-4" y="-24" width="27" height="48"/><path d="M-5-14h-6m6 28h-6"/>'},
{id:'smoke',name:'Opticko-kouřový hlásič',cat:'Detektory',art:'<circle r="30"/><path d="M-20 16h40M-16 4q-9-8 0-17t0-14M0 4q-9-8 0-17t0-14M16 4q-9-8 0-17t0-14"/>'},
{id:'heat',name:'Tepelný hlásič',cat:'Detektory',art:'<circle r="30"/><text x="0" y="11" text-anchor="middle" font-size="29">T</text>'},
{id:'flame',name:'Detektor plamene',cat:'Detektory',art:'<circle r="30"/><path d="M0-22q12 15 5 24q14-11 9-18q20 29-4 40q-17 7-25-6q-7-13 6-25q-3 12 9 13q-7-12 0-28z"/>'},
{id:'gas',name:'Detektor plynu',cat:'Detektory',art:'<circle r="30"/><text x="0" y="11" text-anchor="middle" font-size="27">G</text>'},
{id:'flood',name:'Detektor zaplavení',cat:'Detektory',art:'<rect x="-31" y="-30" width="62" height="60"/><path d="M-22 8q7-7 14 0t14 0t14 0M-22 19q7-7 14 0t14 0t14 0"/><path d="M0-24v21m-7-7l7 7 7-7"/>'},
{id:'panic',name:'Tísňové tlačítko',cat:'Signalizace a ochrana',art:'<rect x="-32" y="-32" width="64" height="64"/><circle r="20"/><path d="M0-12v17"/><circle cx="0" cy="12" r="2" fill="#111" stroke="none"/>'},
{id:'siren',name:'Poplachová siréna',cat:'Signalizace a ochrana',art:'<rect x="-32" y="-30" width="64" height="60"/><path d="M-17-10h7l13-11v42L-10 10h-7zM9-13q17 13 0 26M17-22q26 22 0 44"/>'},
{id:'beacon',name:'Výstražný maják',cat:'Signalizace a ochrana',art:'<path d="M-22 23h44v8h-44zM-16 20v-20q16-28 32 0v20zM0-35v-8M-25-24l-9-9M25-24l9-9M-28 0h-10M28 0h10"/>'},
{id:'tamper',name:'Sabotážní kontakt',cat:'Signalizace a ochrana',art:'<circle cx="-25" cy="10" r="3"/><circle cx="25" cy="10" r="3"/><path d="M-25 10L21-12M25-23v18"/>'},
{id:'network',name:'Komunikační modul IP',cat:'Ústředna a napájení',art:'<rect x="-34" y="-29" width="68" height="58"/><text x="0" y="6" text-anchor="middle" font-size="20">IP</text>'}
];
const BYID=new Map(CATALOG.map((c)=>[c.id,c]));
const canvas=$('#canvas'),nodes=$('#nodes'),wires=$('#wires'),preview=$('#preview');
let doc={version:1,title:'Nové schéma',nodes:[],wires:[]};
let selected=null,tool='select',pending=null,mouse={x:0,y:0},drag=null,uid=1;
let view={x:0,y:0,w:WIDTH,h:HEIGHT},undoStack=[],redoStack=[];
const snap=(v)=>Math.round(v/STEPS)*STEPS;
const newId=()=>String(Date.now().toString(36))+'-'+String(uid++);
const clone=(x)=>JSON.parse(JSON.stringify(x));
function status(s){$('#status').textContent=s;}
function persist(){try{localStorage.setItem('shieldio-ptzs-editor-v1',JSON.stringify(doc));}catch{}}
function checkpoint(){undoStack.push(JSON.stringify(doc));if(undoStack.length>60)undoStack.shift();redoStack=[];}
function changed(){persist();render();}
function itemPoint(n,port){const a=((n.rot||0)*Math.PI)/180,dx=port==='l'?-50:50;return{x:n.x+Math.cos(a)*dx,y:n.y+Math.sin(a)*dx};}
function endPoint(ep){if(ep.id){const n=doc.nodes.find((it)=>it.id===ep.id);return n?itemPoint(n,ep.port):null;}return{x:ep.x,y:ep.y};}
function pos(evt){const p=canvas.createSVGPoint();p.x=evt.clientX;p.y=evt.clientY;const matrix=canvas.getScreenCTM();if(!matrix)return{x:0,y:0};const a=p.matrixTransform(matrix.inverse());return{x:a.x,y:a.y};}
function wirePath(a,b){const mx=snap((a.x+b.x)/2);return'M'+a.x+' '+a.y+' H'+mx+' V'+b.y+' H'+b.x;}
function nodeHtml(n){const def=BYID.get(n.type);if(!def)return'';const rot=n.rot||0;return'<g class="node" data-node="'+esc(n.id)+'" transform="translate('+n.x+' '+n.y+')">'+(selected&&selected.kind==='node'&&selected.id===n.id?'<rect class="selected-outline" x="-56" y="-49" width="112" height="135"/>':'')+'<g transform="rotate('+rot+')"><g class="drawing">'+def.art+'</g><circle class="port" data-port="l" data-owner="'+esc(n.id)+'" cx="-50" cy="0" r="5.5"/><circle class="port" data-port="r" data-owner="'+esc(n.id)+'" cx="50" cy="0" r="5.5"/></g><text class="node-label" x="0" y="65" text-anchor="middle">'+esc(n.label)+'</text></g>';}
function draw(){const seen=new Set(doc.nodes.map((n)=>n.id));wires.innerHTML=doc.wires.map((w)=>{if((w.a.id&&!seen.has(w.a.id))||(w.b.id&&!seen.has(w.b.id)))return'';const a=endPoint(w.a),b=endPoint(w.b);if(!a||!b)return'';const d=wirePath(a,b),active=selected&&selected.kind==='wire'&&selected.id===w.id;return'<g data-wire="'+esc(w.id)+'"><path class="hit-link" d="'+d+'"/><path class="'+(active?'link selected-wire':'link')+'" d="'+d+'" pointer-events="none"/></g>';}).join('');
nodes.innerHTML=doc.nodes.map(nodeHtml).join('');
if(pending){const a=endPoint(pending),b=mouse;if(a)preview.innerHTML='<path class="ghost" d="'+wirePath(a,b)+'"/>';else preview.innerHTML='';}else preview.innerHTML='';
}
function renderProperties(){const el=$('#props');if(!selected){el.innerHTML='<p>Vyberte značku nebo čáru a upravte ji.</p><p>Vývody se zobrazují jako malé zelené kruhy. V režimu Vodič je postupně spojte.</p>';return;}
if(selected.kind==='wire'){el.innerHTML='<p>Vybraná spojovací čára. Čáry jsou ortogonální, krajní body připojené ke značce se při přesunu automaticky aktualizují.</p><div class="row"><button id="propDel">Odstranit čáru</button></div>';$('#propDel').onclick=removeSelected;return;}
const n=doc.nodes.find((x)=>x.id===selected.id);if(!n){selected=null;renderProperties();return;}const def=BYID.get(n.type);
el.innerHTML='<div class="muted">'+esc(def.name)+'</div><label for="labelEdit">Označení prvku / adresa</label><input id="labelEdit" maxlength="70" value="'+esc(n.label)+'"><div class="muted">Souřadnice: '+n.x+' × '+n.y+' · otočení: '+(n.rot||0)+'°</div><div class="row"><button id="propRot">Otočit o 90°</button><button id="propDel">Odstranit</button></div><div class="row"><button id="propSvg">Stáhnout značku SVG</button></div>';
$('#labelEdit').addEventListener('change',(e)=>{checkpoint();n.label=e.target.value.slice(0,70)||def.name;changed();});
$('#propRot').onclick=rotateSelected;$('#propDel').onclick=removeSelected;$('#propSvg').onclick=()=>download(def.id+'.svg',new Blob([singleSvg(def)],{type:'image/svg+xml'}));
}
function render(){draw();renderProperties();$('#projectTitle').value=doc.title;$('#canvas').setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));$('#zoom').textContent=Math.round(WIDTH/view.w*100)+' %';canvas.dataset.tool=tool;document.querySelectorAll('[data-tool]').forEach((b)=>b.classList.toggle('active',b.dataset.tool===tool));}
function select(kind,id){selected={kind,id};draw();renderProperties();}
function setTool(t){tool=t;pending=null;render();status(t==='wire'?'Klikněte na vývod první značky nebo volný bod, potom na cílový vývod. Esc zruší čáru.':t==='pan'?'Tažením prázdné plochy posunete pohled.':'Přesouvejte značky tažením. Knihovna je vlevo.');}
function addNode(type,at){const def=BYID.get(type);if(!def)return;checkpoint();const p=at||{x:view.x+view.w/2,y:view.y+view.h/2};const count=doc.nodes.filter((n)=>n.type===type).length+1;const n={id:newId(),type,x:snap(p.x),y:snap(p.y),rot:0,label:def.name+' '+count};doc.nodes.push(n);selected={kind:'node',id:n.id};setTool('select');changed();status('Značka vložena. Tažením ji přesuňte, ve Vlastnostech změňte označení.');}
function removeSelected(){if(!selected)return;checkpoint();if(selected.kind==='node'){doc.nodes=doc.nodes.filter((n)=>n.id!==selected.id);doc.wires=doc.wires.filter((w)=>w.a.id!==selected.id&&w.b.id!==selected.id);}else doc.wires=doc.wires.filter((w)=>w.id!==selected.id);selected=null;changed();}
function rotateSelected(){if(!selected||selected.kind!=='node')return;const n=doc.nodes.find((it)=>it.id===selected.id);if(!n)return;checkpoint();n.rot=((n.rot||0)+90)%360;changed();}
function getEndpoint(target,p){const pin=target.closest('[data-port]');if(pin)return{id:pin.dataset.owner,port:pin.dataset.port};return{x:snap(p.x),y:snap(p.y)};}
function sameEndpoint(a,b){return a.id===b.id&&a.port===b.port&&a.x===b.x&&a.y===b.y;}
canvas.addEventListener('pointerdown',(evt)=>{if(evt.button!==0)return;const p=pos(evt),target=evt.target;mouse={x:snap(p.x),y:snap(p.y)};
if(tool==='wire'){const ep=getEndpoint(target,p);if(!pending){pending=ep;status('Vyberte konec čáry. Esc zruší.');}else{if(!sameEndpoint(pending,ep)){checkpoint();doc.wires.push({id:newId(),a:pending,b:ep});changed();}pending=null;status('Čára vložena. Kliknutím můžete začít další.');}draw();evt.preventDefault();return;}
if(tool==='pan'){drag={kind:'pan',x:evt.clientX,y:evt.clientY,view:clone(view)};canvas.setPointerCapture(evt.pointerId);return;}
const wire=target.closest('[data-wire]');const node=target.closest('[data-node]');if(node){const n=doc.nodes.find((it)=>it.id===node.dataset.node);if(!n)return;select('node',n.id);checkpoint();drag={kind:'node',id:n.id,offsetX:p.x-n.x,offsetY:p.y-n.y,moved:false};canvas.setPointerCapture(evt.pointerId);}
else if(wire){select('wire',wire.dataset.wire);}else{selected=null;renderProperties();draw();}
});
canvas.addEventListener('pointermove',(evt)=>{const p=pos(evt);mouse={x:snap(p.x),y:snap(p.y)};if(drag&&drag.kind==='node'){const n=doc.nodes.find((it)=>it.id===drag.id);if(n){const nx=snap(p.x-drag.offsetX),ny=snap(p.y-drag.offsetY);if(nx!==n.x||ny!==n.y)drag.moved=true;n.x=nx;n.y=ny;draw();}return;}
if(drag&&drag.kind==='pan'){const box=canvas.getBoundingClientRect(),sx=view.w/box.width,sy=view.h/box.height;view.x=drag.view.x-(evt.clientX-drag.x)*sx;view.y=drag.view.y-(evt.clientY-drag.y)*sy;render();return;}if(pending)draw();});
canvas.addEventListener('pointerup',(evt)=>{if(drag){if(drag.kind==='node'){if(!drag.moved){undoStack.pop();}else persist();render();}drag=null;if(canvas.hasPointerCapture(evt.pointerId))canvas.releasePointerCapture(evt.pointerId);}});
canvas.addEventListener('pointercancel',()=>{drag=null;});
function zoom(factor,point){point=point||{x:view.x+view.w/2,y:view.y+view.h/2};const w=Math.min(5000,Math.max(300,view.w*factor)),h=w*HEIGHT/WIDTH;view.x=point.x-(point.x-view.x)*w/view.w;view.y=point.y-(point.y-view.y)*h/view.h;view.w=w;view.h=h;render();}
canvas.addEventListener('wheel',(evt)=>{if(!evt.ctrlKey&&!evt.metaKey&&evt.shiftKey){evt.preventDefault();view.x+=evt.deltaY;render();return;}evt.preventDefault();zoom(evt.deltaY>0?1.12:.89,pos(evt));},{passive:false});
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(doc));doc=JSON.parse(undoStack.pop());selected=null;changed();}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(doc));doc=JSON.parse(redoStack.pop());selected=null;changed();}
function saveFile(name,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function download(name,blob){saveFile(name,blob);}
function filename(){return(doc.title||'schema-ptzs').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-|-$/g,'')||'schema-ptzs';}
function singleSvg(def){return'<svg xmlns="'+NS+'" width="128" height="128" viewBox="-64 -64 128 128"><style>text{fill:#111;stroke:none;font-weight:600}</style><g stroke="#111" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" font-family="Arial,Helvetica,sans-serif">'+def.art+'</g></svg>';}
function exportBounds(){
 const pts=[];
 for(const n of doc.nodes){pts.push({x:n.x-90,y:n.y-75},{x:n.x+90,y:n.y+100});}
 for(const w of doc.wires){const p=endPoint(w.a),q=endPoint(w.b);if(p)pts.push(p);if(q)pts.push(q);}
 if(!pts.length)return{x:0,y:0,w:WIDTH,h:HEIGHT};
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
 const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
 const scale=Math.max((hiX-loX+100)/WIDTH,(hiY-loY+100)/HEIGHT,0.3);
 const w=WIDTH*scale,h=HEIGHT*scale;
 return{x:(loX+hiX-w)/2,y:(loY+hiY-h)/2,w,h};
}
function schematicSvg(){const box=exportBounds();const cloned=canvas.cloneNode(true);cloned.setAttribute('viewBox',[box.x,box.y,box.w,box.h].join(' '));cloned.setAttribute('width',String(WIDTH));cloned.setAttribute('height',String(HEIGHT));cloned.querySelector('#gridrect').remove();cloned.querySelector('#preview').remove();cloned.querySelectorAll('.port,.selected-outline,.hit-link').forEach((n)=>n.remove());cloned.querySelector('#background').setAttribute('fill','#fff');cloned.querySelector('#background').setAttribute('x',String(box.x));cloned.querySelector('#background').setAttribute('y',String(box.y));cloned.querySelector('#background').setAttribute('width',String(box.w));cloned.querySelector('#background').setAttribute('height',String(box.h));const style=document.createElementNS(NS,'style');style.textContent='.drawing{stroke:#111;stroke-width:2.1;fill:none;stroke-linejoin:round;stroke-linecap:round}.drawing text{stroke:none;fill:#111;font-family:Arial,Helvetica,sans-serif;font-weight:600}.link{stroke:#111;stroke-width:2.1;fill:none;stroke-linejoin:round;stroke-linecap:square}.node-label{font:15px Arial,Helvetica,sans-serif;fill:#111}';cloned.insertBefore(style,cloned.firstChild);cloned.removeAttribute('data-tool');cloned.removeAttribute('aria-label');cloned.querySelectorAll('.selected-wire').forEach((n)=>{n.classList.remove('selected-wire');});return new XMLSerializer().serializeToString(cloned);}
function svgBlob(){return new Blob([schematicSvg()],{type:'image/svg+xml;charset=utf-8'});}
async function pngExport(){const blob=svgBlob(),url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await img.decode();const out=document.createElement('canvas');out.width=WIDTH*2;out.height=HEIGHT*2;const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(img,0,0,out.width,out.height);const png=await new Promise((resolve)=>out.toBlob(resolve,'image/png'));if(!png)throw Error('Nelze vytvořit PNG.');download(filename()+'.png',png);}catch(e){status('Export PNG se nezdařil: '+e.message);}finally{URL.revokeObjectURL(url);}}
function validateProject(parsed){if(!parsed||!Array.isArray(parsed.nodes)||!Array.isArray(parsed.wires)||parsed.nodes.length>500||parsed.wires.length>1500)throw Error('Soubor nemá platný formát PZTS projektu.');
const ids=new Set(),cleanNodes=[];for(const n of parsed.nodes){if(!BYID.has(n.type)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>50000||Math.abs(n.y)>50000)throw Error('Neplatná značka nebo souřadnice.');const id=String(n.id||newId());if(ids.has(id))throw Error('Duplicitní ID.');ids.add(id);cleanNodes.push({id,type:n.type,x:snap(n.x),y:snap(n.y),rot:[0,90,180,270].includes(n.rot)?n.rot:0,label:String(n.label||BYID.get(n.type).name).slice(0,70)});}
const cleanEnd=(ep)=>{if(!ep||typeof ep!=='object')throw Error('Neplatný konec vedení.');if(ep.id){if(!ids.has(String(ep.id))||!['l','r'].includes(ep.port))throw Error('Vedení odkazuje na neexistující vývod.');return{id:String(ep.id),port:ep.port};}if(!Number.isFinite(ep.x)||!Number.isFinite(ep.y)||Math.abs(ep.x)>50000||Math.abs(ep.y)>50000)throw Error('Neplatný volný bod.');return{x:snap(ep.x),y:snap(ep.y)};};
const cleanWires=parsed.wires.map((w)=>({id:newId(),a:cleanEnd(w.a),b:cleanEnd(w.b)}));return{version:1,title:String(parsed.title||'Importovaný projekt').slice(0,100),nodes:cleanNodes,wires:cleanWires};}
function library(){const q=$('#filter').value.toLocaleLowerCase('cs');const cats=[...new Set(CATALOG.map((s)=>s.cat))];$('#parts').innerHTML=cats.map((cat)=>{const items=CATALOG.filter((s)=>s.cat===cat&&s.name.toLocaleLowerCase('cs').includes(q));if(!items.length)return'';return'<div class="group-title">'+esc(cat)+'</div>'+items.map((s)=>'<div class="symbol-card"><button class="symbol-add" data-add="'+s.id+'" title="Vložit '+esc(s.name)+'"><svg viewBox="-50 -50 100 100" aria-hidden="true"><g stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round" font-family="Arial,Helvetica,sans-serif">'+s.art+'</g></svg><span>'+esc(s.name)+'</span></button><button class="dl" data-download="'+s.id+'" title="Stáhnout SVG: '+esc(s.name)+'" aria-label="Stáhnout SVG '+esc(s.name)+'">↓</button></div>').join('');}).join('')||'<p class="muted">Žádný odpovídající prvek.</p>';
$('#parts').querySelectorAll('[data-add]').forEach((b)=>b.onclick=()=>addNode(b.dataset.add));
$('#parts').querySelectorAll('[data-download]').forEach((b)=>b.onclick=()=>{const d=BYID.get(b.dataset.download);download(d.id+'.svg',new Blob([singleSvg(d)],{type:'image/svg+xml'}));});}
function zipBytes(entries){const enc=new TextEncoder(),locals=[],central=[];let offset=0;const table=Array.from({length:256},(_,i)=>{let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);return v>>>0;});
const crc=(bytes)=>{let c=0xffffffff;for(const v of bytes)c=table[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
for(const [name,text] of entries){const n=enc.encode(name),b=enc.encode(text),c=crc(b);const local=new Uint8Array(30+n.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint32(14,c,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,n.length,true);local.set(n,30);locals.push(local,b);
const cd=new Uint8Array(46+n.length),dv=new DataView(cd.buffer);dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x0800,true);dv.setUint32(16,c,true);dv.setUint32(20,b.length,true);dv.setUint32(24,b.length,true);dv.setUint16(28,n.length,true);dv.setUint32(42,offset,true);cd.set(n,46);central.push(cd);offset+=local.length+b.length;}
const size=central.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);return new Blob([...locals,...central,end],{type:'application/zip'});}
function demo(){const n=(type,x,y,label)=>({id:newId(),type,x,y,rot:0,label}),a=n('panel',290,390,'PZTS · Galaxy GD48'),b=n('keypad',620,160,'Klávesnice · RS-485'),c=n('reader',960,160,'Čtečka karet'),d=n('pir',650,390,'PIR · zóna ?'),e=n('glass',1020,390,'Tříštění skla · zóna ?'),f=n('panic',420,700,'Tísňový hlásič · zóna ?'),g=n('siren',830,700,'Siréna / maják');
return{version:1,title:'PZTS – vzorové blokové schéma',nodes:[a,b,c,d,e,f,g],wires:[[a,b],[b,c],[a,d],[d,e],[a,f],[f,g]].map(([p,q])=>({id:newId(),a:{id:p.id,port:'r'},b:{id:q.id,port:'l'}}))};}
function replaceProject(next){checkpoint();doc=next;selected=null;pending=null;view={x:0,y:0,w:WIDTH,h:HEIGHT};changed();}
$('#filter').oninput=library;
document.querySelectorAll('[data-tool]').forEach((b)=>b.onclick=()=>setTool(b.dataset.tool));
$('#rotate').onclick=rotateSelected;$('#delete').onclick=removeSelected;$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#zoomIn').onclick=()=>zoom(.8);$('#zoomOut').onclick=()=>zoom(1.25);$('#zoomReset').onclick=()=>{view={x:0,y:0,w:WIDTH,h:HEIGHT};render();};
$('#exportSvg').onclick=()=>download(filename()+'.svg',svgBlob());$('#exportPng').onclick=pngExport;$('#printPdf').onclick=()=>{const before=clone(view);view=exportBounds();render();window.addEventListener('afterprint',()=>{view=before;render();},{once:true});window.print();};
$('#projectTitle').addEventListener('change',(e)=>{checkpoint();doc.title=e.target.value.trim().slice(0,100)||'Nové schéma';changed();});
$('#saveJson').onclick=()=>download(filename()+'.ptzs.json',new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));
$('#loadJson').onclick=()=>$('#fileInput').click();
$('#fileInput').addEventListener('change',async(e)=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());replaceProject(validateProject(parsed));status('Projekt načten: '+file.name);}catch(err){status('Projekt se nepodařilo načíst: '+err.message);}e.target.value='';});
$('#downloadZip').onclick=()=>{const entries=CATALOG.map((d)=>['ptzs/'+d.id+'.svg',singleSvg(d)]);entries.push(['README.txt','SHiELDiO Sim – PZTS / EZS vektorové značky\nAutorské výukové symboly. Nejde o ověřenou licenci či úplnou normovou databázi IEC/ČSN.\nFormát: SVG, upravitelný v Inkscape i dalších vektorových editorech.\n']);download('shieldio-ptzs-svg.zip',zipBytes(entries));status('Stažena knihovna '+CATALOG.length+' vektorových značek.');};
$('#example').onclick=()=>{if(doc.nodes.length&&!confirm('Nahradit současné schéma ukázkou?'))return;replaceProject(demo());status('Načteno vzorové blokové schéma. Adresy zón jsou pouze zástupné.');};
$('#new').onclick=()=>{if(doc.nodes.length&&!confirm('Vytvořit nové prázdné schéma?'))return;replaceProject({version:1,title:'Nové schéma',nodes:[],wires:[]});};
$('#theme').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('shieldio-ptzs-theme',document.body.classList.contains('dark')?'dark':'light');}catch{}};
window.addEventListener('keydown',(e)=>{const editing=['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);if((e.ctrlKey||e.metaKey)&&!editing){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}if(e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}}
if(editing)return;if(e.key==='Escape'){pending=null;draw();return;}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();return;}if(e.key.toLowerCase()==='r'){e.preventDefault();rotateSelected();}if(e.key.toLowerCase()==='w'){e.preventDefault();setTool('wire');}if(e.key.toLowerCase()==='v'){e.preventDefault();setTool('select');}});
try{if(localStorage.getItem('shieldio-ptzs-theme')==='dark')document.body.classList.add('dark');const saved=localStorage.getItem('shieldio-ptzs-editor-v1');if(saved)doc=validateProject(JSON.parse(saved));}catch{status('Předchozí místní projekt se nepodařilo načíst.');}
library();render();
