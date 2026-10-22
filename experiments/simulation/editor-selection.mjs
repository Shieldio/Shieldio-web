import {pinsFor} from './engine.mjs';
import {connections,pointKey,modeOf,validateProject,moveEndpoint,replaceConnection} from './workbench-model.mjs';
const clone=value=>structuredClone(value);
const move=(p,dx,dy)=>({x:p.x+dx,y:p.y+dy});
const validModes=new Set(['analog','digital','fbd']);

/** Physical wire IDs are expanded to entire selectable bent connections. */
export function selectionIds(project,selected){
 const wantedComponents=new Set(selected?.kind==='component'?[selected.id]:selected?.kind==='group'?selected.componentIds||[]:[]);
 const wantedWires=new Set(selected?.kind==='wire'?[selected.id]:selected?.kind==='group'?selected.wireIds||[]:[]);
 const componentIds=project.components.filter(c=>wantedComponents.has(c.id)).map(c=>c.id),wireIds=[];
 for(const route of connections(project))if(route.ids.some(id=>wantedWires.has(id)))wireIds.push(...route.ids);
 return {componentIds,wireIds};
}

/** Copy explicitly selected wires plus complete routes between selected pins. */
export function makeFragment(project,selected){
 const ids=selectionIds(project,selected),componentIds=new Set(ids.componentIds),wireIds=new Set(ids.wireIds);
 const components=project.components.filter(c=>componentIds.has(c.id));
 const pins=new Set(components.flatMap(c=>pinsFor(c).map(pointKey)));
 for(const route of connections(project))if(pins.has(pointKey(route.points[0]))&&pins.has(pointKey(route.points.at(-1))))for(const id of route.ids)wireIds.add(id);
 const wires=project.wires.filter(w=>wireIds.has(w.id));
 if(!components.length&&!wires.length)throw Error('Nejprve vyberte součástky nebo vodiče.');
 const points=[...components,...wires.flatMap(w=>[w.a,w.b])],x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));
 return {type:'shieldio-selection',version:1,mode:modeOf(project),origin:{x,y},components:components.map(c=>({...clone(c),x:c.x-x,y:c.y-y})),wires:wires.map(w=>({...clone(w),a:move(w.a,-x,-y),b:move(w.b,-x,-y)}))};
}

/** Validate a detached clone; importing a clipboard never alters its source. */
export function validateFragment(payload,mode){
 if(typeof payload==='string'){if(payload.length>3000000)throw Error('Kopírovaný výběr je příliš velký.');try{payload=JSON.parse(payload);}catch{throw Error('Schránka neobsahuje výběr SHiELDiO Sim.');}}
 if(!payload||payload.type!=='shieldio-selection'||payload.version!==1||!Array.isArray(payload.components)||!Array.isArray(payload.wires))throw Error('Neplatný kopírovaný výběr SHiELDiO Sim.');
 if(!validModes.has(mode)||payload.mode!==mode)throw Error('Výběr patří do jiného pracovního prostředí.');
 if(!payload.components.length&&!payload.wires.length)throw Error('Kopírovaný výběr je prázdný.');
 const p=validateProject({version:1,mode,title:'Výběr',components:clone(payload.components),wires:clone(payload.wires),measurements:[],probes:[],scopes:0,settings:{duration:.01}}),wireIds=new Set();
 for(const w of p.wires){if(typeof w.id!=='string'||!w.id||wireIds.has(w.id))throw Error('Vodiče výběru musí mít jedinečné označení.');wireIds.add(w.id);if(w.a.x!==w.b.x&&w.a.y!==w.b.y)throw Error('Vodič výběru musí být pravoúhlý.');for(const q of [w.a,w.b])if(Math.abs(q.x)>1e5||Math.abs(q.y)>1e5)throw Error('Neplatná poloha vodiče.');}
 if(mode!=='analog'&&p.components.some(c=>(c.rotation||0)!==0))throw Error('Číslicové a FBD bloky se neotáčejí.');
 return {type:'shieldio-selection',version:1,mode,origin:payload.origin&&Number.isFinite(payload.origin.x)&&Number.isFinite(payload.origin.y)?clone(payload.origin):{x:0,y:0},components:p.components,wires:p.wires};
}
function rotate(p,degrees){switch(degrees){case 90:return {x:-p.y,y:p.x};case 180:return {x:-p.x,y:-p.y};case 270:return {x:p.y,y:-p.x};default:return {x:p.x,y:p.y};}}
function uniqueComponentId(original,used){if(!used.has(original)){used.add(original);return original;}const match=original.match(/^(.*?)(\d+)$/),stem=match?match[1]:original,suffix=match?Number(match[2]):0;let n=Number.isSafeInteger(suffix)&&suffix<1e9?suffix+1:1,candidate;do{candidate=stem+n++;}while(used.has(candidate));used.add(candidate);return candidate;}
function wireAllocator(project,factory){const used=new Set(project.wires.map(w=>w.id));let n=0;return ()=>{let id=String(factory?.()||`wCopy${++n}`),candidate=id;while(used.has(candidate))candidate=`${id}_copy${++n}`;used.add(candidate);return candidate;};}
function cap(project,parts,wires){if(project.components.length+parts>200||project.wires.length+wires>1000)throw Error('Výběr překračuje limit 200 součástek / 1000 úseků.');}

/** Preview/paste geometry. The caller decides when to append this result. */
export function materializeFragment(project,payload,anchor,rotation=0,wireId){
 const fragment=validateFragment(payload,modeOf(project));
 if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||!Number.isFinite(rotation)||rotation%90)throw Error('Neplatná poloha nebo otočení výběru.');
 const angle=((rotation%360)+360)%360;if(fragment.mode!=='analog'&&angle)throw Error('Číslicové a FBD bloky se neotáčejí.');cap(project,fragment.components.length,fragment.wires.length);
 const used=new Set(project.components.map(c=>c.id)),newWire=wireAllocator(project,wireId),transform=p=>{const q=rotate(p,angle),v=move(q,anchor.x,anchor.y);if(Math.abs(v.x)>1e5||Math.abs(v.y)>1e5)throw Error('Výběr je mimo pracovní plochu.');return v;};
 const components=fragment.components.map(c=>{const result={...clone(c),...transform(c),id:uniqueComponentId(c.id,used),rotation:((c.rotation||0)+angle)%360};if(result.params?.label===c.id)result.params.label=result.id;return result;}),wires=fragment.wires.map(w=>({...clone(w),id:newWire(),a:transform(w.a),b:transform(w.b)}));
 return {components,wires,componentIds:components.map(c=>c.id),wireIds:wires.map(w=>w.id)};
}

/** Move a group while stretching its external connections, without mutation. */
export function translatedSelection(project,selected,dx,dy,wireId){
 if(!Number.isFinite(dx)||!Number.isFinite(dy))throw Error('Neplatný posun výběru.');
 const next=clone(project),ids=selectionIds(project,selected),selectedParts=new Set(ids.componentIds),selectedWires=new Set(ids.wireIds),targets=new Map(),fixedPins=new Set(),newWire=wireAllocator(project,wireId),routes=connections(project);
 for(const c of project.components)for(const pin of pinsFor(c))if(selectedParts.has(c.id))targets.set(pointKey(pin),move(pin,dx,dy));else fixedPins.add(pointKey(pin));
 for(const route of routes)if(route.ids.some(id=>selectedWires.has(id)))for(const p of [route.points[0],route.points.at(-1)])if(!fixedPins.has(pointKey(p)))targets.set(pointKey(p),move(p,dx,dy));
 for(const c of next.components)if(selectedParts.has(c.id)){c.x+=dx;c.y+=dy;if(Math.abs(c.x)>1e5||Math.abs(c.y)>1e5)throw Error('Výběr je mimo pracovní plochu.');}
 for(const route of routes){const a=targets.get(pointKey(route.points[0])),b=targets.get(pointKey(route.points.at(-1))),explicit=route.ids.some(id=>selectedWires.has(id));if(!a&&!b&&!explicit)continue;let points;
  if(explicit||a&&b){points=route.points.map(p=>move(p,dx,dy));for(const [end,old]of [['a',route.points[0]],['b',route.points.at(-1)]]){const target=targets.get(pointKey(old))||(fixedPins.has(pointKey(old))?old:null);if(target)points=moveEndpoint(points,end,target);}}
  else{points=clone(route.points);if(a)points=moveEndpoint(points,'a',a);if(b)points=moveEndpoint(points,'b',b);}
  replaceConnection(next,route,points,newWire);
 }
 if(next.wires.length>1000)throw Error('Posun překračuje limit 1000 úseků vodičů.');for(const w of next.wires)for(const p of [w.a,w.b])if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e5||Math.abs(p.y)>1e5)throw Error('Výběr je mimo pracovní plochu.');
 return next;
}
