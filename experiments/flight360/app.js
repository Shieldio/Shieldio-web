(() => {
"use strict";
const $ = id => document.getElementById(id);
const video = $("video"), canvas = $("view"), stage = $("stage");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const fmt = t => Number.isFinite(t) ? Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0") : "0:00";
const icon = (id, name) => $(id).setAttribute("href", "#i-" + name);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const embedPath = /^\/embed\/([a-zA-Z0-9_-]+)\/?$/.exec(location.pathname);
const embedMode = location.pathname === "/embed" || location.pathname.startsWith("/embed/") || new URLSearchParams(location.search).get("embed") === "1";
const embedScene = embedPath?.[1] || new URLSearchParams(location.hash.slice(1)).get("scene");
document.body.classList.toggle("embed", embedMode);
if(embedMode){$("autoplay").checked=false;$("autoplay").disabled=true;}
let scenes = [], active = null, gl = null, program = null, texture = null, uniforms = null;
const DEFAULT_FOV = 65;
let yaw = 0, pitch = -8, fov = DEFAULT_FOV, dirty = true, hasFrame = false, started = false, seeking = false;
let requestedTime = 0, pendingSharedView = false, fallback = false, waitingTimer, hintTimer, frameTime = -1;
let lastFocus = null, dialogKind = "share", loadingScene = false, loadTimer;
let presentedTime = null;
if(typeof video.requestVideoFrameCallback==="function"){
const onFrame=(_now,metadata)=>{presentedTime=metadata.mediaTime;dirty=true;video.requestVideoFrameCallback(onFrame);};
video.requestVideoFrameCallback(onFrame);
}
video.addEventListener("seeking",()=>{presentedTime=null;});
const pointers = new Map();
let pinchDistance = 0, pinchFov = DEFAULT_FOV;

// Tracked spherical points are measured in the source panorama, not screen pixels.
const hotspotLayer=document.createElement("div");
hotspotLayer.className="hotspot-layer";hotspotLayer.setAttribute("aria-label","Místa v záznamu");
stage.append(hotspotLayer);
const hotspotToggle=document.createElement("label");
hotspotToggle.className="autoplay-option hotspot-option";hotspotToggle.hidden=true;
const hotspotCheck=document.createElement("input");hotspotCheck.type="checkbox";hotspotCheck.checked=true;
const hotspotToggleText=document.createElement("span");hotspotToggleText.textContent="Zobrazit místa v záznamu";
hotspotToggle.append(hotspotCheck,hotspotToggleText);
$("autoplay").closest("label").after(hotspotToggle);
hotspotCheck.addEventListener("change",()=>{dirty=true;updateHotspots();});
let hotspotNodes=[], selectedPlace=null, placeTrigger=null;
const placesPanel=document.createElement("section");
placesPanel.className="places-panel";placesPanel.hidden=true;
const placesHeading=document.createElement("h4");placesHeading.textContent="Prozkoumejte místo";
const placesList=document.createElement("div");placesList.className="places-list";
const placesNote=document.createElement("p");placesNote.textContent="Vyberte bod v obrazu nebo název místa. Kliknutím se let pozastaví.";
placesPanel.append(placesHeading,placesList,placesNote);hotspotToggle.after(placesPanel);
const placeCard=document.createElement("section");placeCard.className="place-card";placeCard.hidden=true;
placeCard.setAttribute("role","dialog");placeCard.setAttribute("aria-modal","false");placeCard.setAttribute("aria-labelledby","place-card-title");
const placeClose=document.createElement("button");placeClose.type="button";placeClose.className="place-card-close";placeClose.textContent="×";placeClose.setAttribute("aria-label","Zavřít detail místa");
const placeCategory=document.createElement("span");placeCategory.className="eyebrow";
const placeTitle=document.createElement("h3");placeTitle.id="place-card-title";
const placeDescription=document.createElement("p");
const placeLinks=document.createElement("div");placeLinks.className="place-card-links";
placeCard.append(placeClose,placeCategory,placeTitle,placeDescription,placeLinks);stage.append(placeCard);
function closePlace(returnFocus=false){
placeCard.hidden=true;selectedPlace=null;
for(const {button} of hotspotNodes)button.setAttribute("aria-expanded","false");
if(returnFocus){if(placeTrigger&&!placeTrigger.closest("[hidden]"))placeTrigger.focus({preventScroll:true});else canvas.focus({preventScroll:true});}
}
placeClose.addEventListener("click",()=>closePlace(true));
placeCard.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();closePlace(true);}});
function openPlace(data,trigger,focusView=false){
if(video.readyState<2)return;
video.pause();placeTrigger=trigger;selectedPlace=data.id;
if(focusView){
const time=clamp(finite(data.focusTime,data.start+.5),data.start,data.end-.1),point=trackedPoint(data,time);
if(point){started=true;$("start-cover").hidden=true;video.currentTime=time;yaw=(point.u-.5)*360;pitch=(.5-point.v)*180;fov=70;updateView();}
}
placeTitle.textContent=data.title||data.label;placeCategory.textContent=data.category||"Štítná nad Vláří";
placeDescription.textContent=data.description||"";placeLinks.replaceChildren();
for(const link of data.links||[]){
let url;try{url=new URL(link.url);if(url.protocol!=="https:")continue;}catch(e){continue;}
const a=document.createElement("a");a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";a.textContent=link.label+" ↗";placeLinks.append(a);
}
placeCard.hidden=false;
for(const {data:point,button} of hotspotNodes)button.setAttribute("aria-expanded",String(point.id===selectedPlace));
placeClose.focus({preventScroll:true});$("status").textContent="Detail místa. Let je pozastavený; pokračujte tlačítkem Přehrát.";
}
function prepareHotspots(){
closePlace();hotspotLayer.replaceChildren();placesList.replaceChildren();hotspotNodes=[];
for(const data of active?.hotspots||[]){
if(!Array.isArray(data.keyframes)||data.keyframes.length<2)continue;
const node=document.createElement("div");node.className="place-hotspot";node.hidden=true;
const button=document.createElement("button");button.type="button";button.className="place-point";button.setAttribute("aria-label","Prozkoumat: "+data.label);button.setAttribute("aria-expanded","false");
const title=document.createElement("span");title.className="place-point-name";title.textContent=data.label;
button.append(title);button.addEventListener("click",()=>openPlace(data,button));
const stem=document.createElement("span");stem.className="place-hotspot-stem";
const anchor=document.createElement("span");anchor.className="place-hotspot-dot";
node.append(button,stem,anchor);hotspotLayer.append(node);hotspotNodes.push({data,node,button});
const item=document.createElement("button");item.type="button";item.textContent=data.label;item.addEventListener("click",()=>openPlace(data,item,true));placesList.append(item);
}
hotspotToggle.hidden=hotspotNodes.length===0;
placesPanel.hidden=hotspotNodes.length===0;
}
function trackedPoint(data,time){
const keys=data.keyframes;
if(time<data.start||time>data.end)return null;
let a=keys[0],b=keys[keys.length-1];
for(let i=1;i<keys.length;i++){if(time<=keys[i].time){a=keys[i-1];b=keys[i];break;}}
const mix=clamp((time-a.time)/(b.time-a.time),0,1);
const du=((b.u-a.u+.5)%1+1)%1-.5;
return {u:a.u+du*mix,v:a.v+(b.v-a.v)*mix};
}
function projectHotspot(point,width,height){
const longitude=(point.u-.5)*Math.PI*2,latitude=(.5-point.v)*Math.PI;
const x=Math.sin(longitude)*Math.cos(latitude),y=Math.sin(latitude),z=Math.cos(longitude)*Math.cos(latitude);
const yawRad=yaw*Math.PI/180,pitchRad=pitch*Math.PI/180;
const viewX=x*Math.cos(yawRad)-z*Math.sin(yawRad);
const yawZ=x*Math.sin(yawRad)+z*Math.cos(yawRad);
const viewY=y*Math.cos(pitchRad)-yawZ*Math.sin(pitchRad);
const viewZ=y*Math.sin(pitchRad)+yawZ*Math.cos(pitchRad);
if(viewZ<=0)return null;
const tan=Math.tan(fov*Math.PI/360);
return {x:width/2*(1+viewX/(viewZ*tan*width/height)),y:height/2*(1-viewY/(viewZ*tan))};
}
function updateHotspots(){
const width=canvas.clientWidth,height=canvas.clientHeight,time=frameTime>=0?frameTime:video.currentTime;
for(const {data,node} of hotspotNodes){
const point=(!fallback&&hasFrame&&started&&hotspotCheck.checked)?trackedPoint(data,time):null;
const screen=point?projectHotspot(point,width,height):null;
const visible=screen&&screen.x>44&&screen.x<width-44&&screen.y>76&&screen.y<height-42;
node.hidden=!visible;
if(visible){
const lift=finite(data.labelLift,34),offsetX=finite(data.labelOffsetX,0);
if(screen.y-lift<46){node.hidden=true;continue;}
node.style.setProperty("--lift",lift+"px");
node.style.setProperty("--label-x",offsetX+"px");
node.style.setProperty("--stem-length",Math.hypot(offsetX,lift-2)+"px");
node.style.setProperty("--stem-angle",Math.atan2(offsetX,lift-2)*180/Math.PI+"deg");
node.style.transform="translate("+screen.x.toFixed(2)+"px,"+screen.y.toFixed(2)+"px)";
const fadeIn=data.start===0?1:clamp((time-data.start)/.45,0,1);
node.style.opacity=String(Math.min(fadeIn,clamp((data.end-time)/.6,0,1)));
}
}
}

const fragment = `precision highp float;
uniform sampler2D image;
uniform float aspect;
uniform float viewFov;
uniform float yaw;
uniform float pitch;
varying vec2 point;
const float PI=3.141592653589793;
void main(){
vec3 ray=normalize(vec3(point.x*aspect*viewFov,point.y*viewFov,1.0));
float y=ray.y*cos(pitch)+ray.z*sin(pitch);
float z=-ray.y*sin(pitch)+ray.z*cos(pitch);
ray=vec3(ray.x*cos(yaw)+z*sin(yaw),y,-ray.x*sin(yaw)+z*cos(yaw));
vec2 uv=vec2(atan(ray.x,ray.z)/(2.0*PI)+0.5,acos(clamp(ray.y,-1.0,1.0))/PI);
gl_FragColor=texture2D(image,uv);
}`;
const vertex = "attribute vec2 position;varying vec2 point;void main(){point=position;gl_Position=vec4(position,0.,1.);}";
function compile(type, source) {
const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error("Shader unavailable");
return shader;
}
function initGL() {
gl=canvas.getContext("webgl",{alpha:false,antialias:false,preserveDrawingBuffer:false});
if(!gl)throw new Error("WebGL unavailable");
if(gl.getParameter(gl.MAX_TEXTURE_SIZE)<3840)throw new Error("Texture size unavailable");
program=gl.createProgram();
gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Renderer unavailable");
gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const pos=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([23,39,31,255]));
uniforms={};["image","aspect","viewFov","yaw","pitch"].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));gl.uniform1i(uniforms.image,0);
dirty=true;frameTime=-1;
}
function nativeFallback() {
fallback=true;stage.classList.add("native-video");video.controls=true;
$("stage-label").textContent="Panoramatické video";
$("status").textContent="360° zobrazení není v tomto zařízení dostupné. Video lze přehrát v plochém zobrazení.";
$("reset").disabled=true;
}
try {initGL();} catch(e) {nativeFallback();}
function render() {
const mediaTime=presentedTime??video.currentTime;
if(gl&&!fallback&&!document.hidden&&hasFrame&&!video.seeking&&video.readyState>=2&&(dirty||(!video.paused&&mediaTime!==frameTime))){
try {
const dpr=Math.min(devicePixelRatio||1,2), w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
if(w&&h){
if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
gl.viewport(0,0,w,h);gl.useProgram(program);
gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
gl.uniform1f(uniforms.aspect,w/h);gl.uniform1f(uniforms.viewFov,Math.tan(fov*Math.PI/360));
gl.uniform1f(uniforms.yaw,yaw*Math.PI/180);gl.uniform1f(uniforms.pitch,pitch*Math.PI/180);
gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;frameTime=mediaTime;
}
} catch(e){nativeFallback();}
}
updateHotspots();
requestAnimationFrame(render);
}
requestAnimationFrame(render);
new ResizeObserver(()=>{dirty=true;}).observe(stage);
canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();video.pause();$("status").textContent="Zobrazení bylo přerušeno. Obnovuji prohlídku…";});
canvas.addEventListener("webglcontextrestored",()=>{try{initGL();hasFrame=video.readyState>=2;$("status").textContent="Zobrazení obnoveno. Pokračujte tlačítkem Přehrát.";}catch(e){nativeFallback();}});
function updateView() {
yaw=((yaw%360)+360)%360;pitch=clamp(pitch,-80,80);fov=clamp(fov,40,95);
dirty=true;
}
function dismissHint(){clearTimeout(hintTimer);$("view-hint").classList.remove("visible");}
canvas.addEventListener("pointerdown",e=>{
canvas.focus({preventScroll:true});dismissHint();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
if(pointers.size===2){const a=[...pointers.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);pinchFov=fov;}
});
canvas.addEventListener("pointermove",e=>{
const old=pointers.get(e.pointerId);if(!old)return;
pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(pointers.size===2){const a=[...pointers.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(distance>0)fov=pinchFov*pinchDistance/distance;}
else if(pointers.size===1){yaw-=(e.clientX-old.x)*.16;pitch+=(e.clientY-old.y)*.16;}
updateView();
});
["pointerup","pointercancel","lostpointercapture"].forEach(n=>canvas.addEventListener(n,e=>pointers.delete(e.pointerId)));
canvas.addEventListener("wheel",e=>{e.preventDefault();fov+=Math.sign(e.deltaY)*3;dismissHint();updateView();},{passive:false});
canvas.addEventListener("keydown",e=>{
if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","+","=","-"," ","Home"].includes(e.key)){
e.preventDefault();dismissHint();
if(e.key==="ArrowRight")yaw+=5;if(e.key==="ArrowLeft")yaw-=5;
if(e.key==="ArrowUp")pitch+=5;if(e.key==="ArrowDown")pitch-=5;
if(e.key==="+"||e.key==="=")fov-=5;if(e.key==="-")fov+=5;
if(e.key==="Home")reset();if(e.key===" ")togglePlay();updateView();
}
});
function reset(){const v=active?.initialView||{};yaw=finite(v.yaw,0);pitch=finite(v.pitch,-8);fov=finite(v.fov,DEFAULT_FOV);updateView();}
$("reset").addEventListener("click",reset);
function updateSpeed() {
const rate=clamp(finite($("speed").value,1),.5,1.5);
video.playbackRate=rate;
const label=rate===1?"Normální":rate.toLocaleString("cs-CZ",{maximumFractionDigits:2})+"×";
$("speed-value").value=label;
$("speed").setAttribute("aria-valuetext",rate===1?"Normální rychlost":label+" běžné rychlosti");
}
$("speed").addEventListener("input",updateSpeed);
function busy(show) {
clearTimeout(waitingTimer);
if(show)waitingTimer=setTimeout(()=>{if(started)$("loading").hidden=false;},650);
else $("loading").hidden=true;
}
function error(message) {
clearTimeout(loadTimer);busy(false);video.pause();$("player-error").hidden=false;$("start-cover").hidden=true;
$("error-copy").textContent=message;$("status").textContent="Prohlídka je dočasně nedostupná.";
}
function availableURL(raw) {
try{if(typeof raw!=="string")return null;const u=new URL(raw,location.origin+"/");const allowed=u.origin===location.origin||u.origin==="https://flight360-media.shieldio.cz";return allowed&&/^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:null;}catch(e){return null;}
}
async function loadGallery() {
loadingScene=true;
try{
const response=await fetch("/videos.json",{cache:"no-cache"});if(!response.ok)throw new Error("Gallery unavailable");
const data=await response.json();
scenes=Array.isArray(data)?data.filter(s=>s&&s.published!==false&&typeof s.title==="string"&&typeof s.id==="string"&&availableURL(s.url)):[];
if(!scenes.length)throw new Error("Empty gallery");
if(embedMode){
scenes=scenes.filter(s=>s.id===embedScene);
if(!scenes.length){error("Tato prohlídka zatím není zveřejněná nebo neexistuje. Zkontrolujte odkaz.");return;}
}
const list=$("scene-list");list.replaceChildren();
if(!embedMode)scenes.forEach((s,i)=>{
const b=document.createElement("button");b.type="button";b.className="scene-button";b.dataset.scene=s.id;
const thumb=document.createElement("span");thumb.className="scene-thumb";thumb.setAttribute("aria-hidden","true");
if(s.poster&&availableURL(s.poster)){const img=document.createElement("img");img.src=availableURL(s.poster);img.alt="";img.loading="lazy";img.width=640;img.height=360;thumb.append(img);}else{thumb.innerHTML='<svg><use href="#i-play"/></svg>';}
const detail=document.createElement("span"),title=document.createElement("span"),meta=document.createElement("span");
title.className="scene-title";title.textContent=s.title;meta.className="scene-meta";meta.textContent=fmt(finite(s.duration,0));
detail.append(title,meta);const arrow=document.createElementNS("http://www.w3.org/2000/svg","svg");arrow.classList.add("scene-arrow");
const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","#i-arrow");arrow.append(use);b.append(thumb,detail,arrow);
b.addEventListener("click",()=>{if(active?.id===s.id){video.currentTime=0;start();}else selectScene(s,true);if(!embedMode)$("prohlidka").scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});});
list.append(b);
});
$("scene-count").textContent=String(scenes.length)+(scenes.length===1?" záznam":scenes.length<5?" záznamy":" záznamů");
const params=new URLSearchParams(location.hash.slice(1));
selectScene(scenes.find(s=>s.id===params.get("scene"))||scenes[0],false,params);
} catch(e){error("Seznam prohlídek se nepodařilo načíst. Zkuste to prosím znovu.");}
finally{loadingScene=false;}
}
function selectScene(scene,play,params=null) {
if(embedMode&&scene.id!==embedScene)return;
video.pause();active=scene;stage.classList.remove("has-frame");const poster=availableURL(scene.poster);$("scene-poster").hidden=!poster;if(poster)$("scene-poster").src=poster;started=false;hasFrame=false;frameTime=-1;presentedTime=null;dirty=true;
prepareHotspots();
$("player-error").hidden=true;$("start-cover").hidden=false;$("start").disabled=true;
$("start-label").textContent="Načítám prohlídku";$("play").disabled=true;$("seek").disabled=true;
$("embed-brand").href=shareURL();
$("embed-brand").setAttribute("aria-label", "Otevřít na Flight360: "+scene.title);
if(embedMode)document.title=scene.title+" | Flight360";
$("tour-name").textContent=scene.title;$("scene-caption").textContent=scene.title;
$("place-title").textContent=scene.subtitle||scene.title;
$("scene-location").textContent=scene.location||"Štítná nad Vláří a okolí";
$("place-description").textContent=scene.description||"Rozhlédněte se ve 360° záznamu. Let můžete kdykoli zastavit.";
document.querySelectorAll(".scene-button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.scene===scene.id)));
reset();requestedTime=0;pendingSharedView=!!params?.has("scene");
if(params){yaw=finite(params.get("yaw")??yaw,yaw);pitch=finite(params.get("pitch")??pitch,pitch);fov=finite(params.get("fov")??fov,fov);requestedTime=Math.max(0,finite(params.get("t")??0,0));updateView();}
video.src=availableURL(scene.url);updateSpeed();video.load();
clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(!hasFrame)error("Načítání trvá příliš dlouho. Zkontrolujte připojení a zkuste to znovu.");},30000);
$("status").textContent="Načítám záznam…";if(play)start();
}
video.loop=false;
video.addEventListener("ended",()=>{
if(embedMode || !$("autoplay").checked || scenes.length<2){
$("status").textContent="Záznam skončil. Spusťte ho znovu tlačítkem Přehrát.";
return;
}
const next=(scenes.findIndex(scene=>scene.id===active?.id)+1)%scenes.length;
selectScene(scenes[next],true);
});
video.addEventListener("loadedmetadata",()=>{
if(Math.abs(video.videoWidth/video.videoHeight-2)>.12){error("Tento záznam nemá podporovaný panoramatický formát.");return;}
const duration=video.duration;
$("duration").textContent=fmt(duration);$("seek").disabled=false;$("play").disabled=false;$("start").disabled=false;
$("start-label").textContent="Spustit prohlídku";$("quality").textContent="Rozlišení "+(video.videoWidth>=3840?"4K":video.videoWidth+" px");
const target=clamp(requestedTime,0,Math.max(0,duration-.1));video.currentTime=target>0?target:.03;
if(!fallback)$("status").textContent=pendingSharedView?"Sdílený pohled je připravený.":"Táhněte obrazem a rozhlédněte se.";
});
function frameReady(){
if(video.readyState<2)return;hasFrame=true;stage.classList.add("has-frame");dirty=true;clearTimeout(loadTimer);
if(!started)$("start").disabled=false;
busy(false);
if(!fallback) {
try{
const preview=document.createElement("canvas");preview.width=192;preview.height=96;const ctx=preview.getContext("2d");ctx.drawImage(video,0,0,192,96);
const button=[...document.querySelectorAll(".scene-button")].find(b=>b.dataset.scene===active?.id),thumb=button?.querySelector(".scene-thumb");
if(thumb&&!thumb.querySelector("img")){const img=document.createElement("img");img.alt="";img.src=preview.toDataURL("image/jpeg",.75);thumb.replaceChildren(img);}
}catch(e){/* The panorama remains usable without a thumbnail. */}
}
}
video.addEventListener("loadeddata",frameReady);video.addEventListener("seeked",()=>{frameReady();seeking=false;});
video.addEventListener("canplay",()=>busy(false));
video.addEventListener("waiting",()=>busy(true));
video.addEventListener("playing",()=>{busy(false);clearTimeout(loadTimer);});
video.addEventListener("error",()=>{
const code=video.error?.code;
error(code===3||code===4?"Prohlížeč tento záznam nemůže přehrát. Zkuste aktuální Safari, Chrome, Firefox nebo Edge.":"Video se nepodařilo stáhnout. Zkontrolujte připojení a zkuste to znovu.");
});
async function start() {
if(!active)return;
closePlace();
started=true;$("start-cover").hidden=true;busy(true);
try{await video.play();if(!fallback){$("status").textContent="Přehrává se. Táhněte obrazem a rozhlédněte se.";if(!reduced){$("view-hint").classList.add("visible");hintTimer=setTimeout(dismissHint,3500);}}}
catch(e){busy(false);started=false;$("start-cover").hidden=false;$("start-label").textContent="Spustit prohlídku";$("status").textContent="Pro spuštění klepněte na Spustit prohlídku.";}
}
function togglePlay(){if(video.paused){if(video.ended)video.currentTime=0;start();}else{video.pause();$("status").textContent="Let je pozastavený. Můžete se dál rozhlížet.";}}
$("start").addEventListener("click",start);$("play").addEventListener("click",togglePlay);
video.addEventListener("play",()=>{icon("play-icon","pause");$("play").setAttribute("aria-label","Pozastavit");});
video.addEventListener("pause",()=>{icon("play-icon","play");$("play").setAttribute("aria-label","Přehrát");busy(false);dirty=true;});
video.addEventListener("timeupdate",()=>{
$("current").textContent=fmt(video.currentTime);
if(!seeking&&Number.isFinite(video.duration)&&video.duration>0)$("seek").value=String(Math.round(1000*video.currentTime/video.duration));
$("seek").setAttribute("aria-valuetext",fmt(video.currentTime)+" z "+fmt(video.duration));
});
$("seek").addEventListener("input",e=>{if(Number.isFinite(video.duration)){seeking=true;video.currentTime=video.duration*(+e.target.value)/1000;dirty=true;}});
$("mute").addEventListener("click",()=>{video.muted=!video.muted;icon("mute-icon",video.muted?"muted":"volume");const label=video.muted?"Zapnout zvuk":"Vypnout zvuk";$("mute").setAttribute("aria-label",label);$("mute").title=label;});
$("retry").addEventListener("click",()=>{if(active)selectScene(active,false);else loadGallery();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)video.pause();});
function closeExpanded(){stage.classList.remove("is-expanded");$("fullscreen").setAttribute("aria-label","Celá obrazovka");dirty=true;}
$("fullscreen").addEventListener("click",async()=>{
try{
if(document.fullscreenElement)await document.exitFullscreen();
else if(stage.classList.contains("is-expanded"))closeExpanded();
else if(stage.requestFullscreen){await stage.requestFullscreen();canvas.focus({preventScroll:true});}
else{stage.classList.add("is-expanded");$("fullscreen").setAttribute("aria-label","Zavřít celou obrazovku");canvas.focus({preventScroll:true});}
}catch(e){stage.classList.toggle("is-expanded");canvas.focus({preventScroll:true});}
dirty=true;
});
$("exit-fullscreen").addEventListener("click",()=>{if(document.fullscreenElement)document.exitFullscreen().catch(closeExpanded);else closeExpanded();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&stage.classList.contains("is-expanded"))closeExpanded();});
document.addEventListener("fullscreenchange",()=>{
const expanded=!!document.fullscreenElement;$("fullscreen").setAttribute("aria-label",expanded?"Zavřít celou obrazovku":"Celá obrazovka");dirty=true;
});
function shareURL() {
const url=new URL("/",location.origin);url.hash=new URLSearchParams({scene:active?.id||"",t:video.currentTime.toFixed(1),yaw:yaw.toFixed(1),pitch:pitch.toFixed(1),fov:fov.toFixed(0)}).toString();return url.href;
}
$("embed-brand").addEventListener("click",()=>{$("embed-brand").href=shareURL();});
function showDialog(kind) {
if(kind!=="help"&&!active)return;
dialogKind=kind;lastFocus=document.activeElement;$("copy-status").textContent="";
$("share-output").hidden=kind==="help";$("output-label").hidden=kind==="help";$("copy").hidden=kind==="help";
if(kind==="share"){
$("dialog-title").textContent="Sdílet tento pohled";
$("dialog-copy").textContent="Odkaz otevře stejný záznam ve stejném čase a směru pohledu.";
$("output-label").textContent="Odkaz na pohled";$("share-output").value=shareURL();
$("copy").innerHTML='Kopírovat odkaz <svg><use href="#i-share"/></svg>';
}else if(kind==="embed"){
$("dialog-title").textContent="Prohlídka na vašem webu";
$("dialog-copy").textContent="Vložte tento kód do HTML svého webu. Šířka se přizpůsobí prostoru, přehrávač zůstane pod značkou Flight360.";
const url=new URL(shareURL());url.pathname="/embed/"+encodeURIComponent(active.id);
$("output-label").textContent="HTML kód";
$("share-output").value='<iframe src="'+url.href.replace(/&/g,"&amp;")+'" title="Flight360 — interaktivní prohlídka" width="100%" height="500" loading="lazy" allow="fullscreen" allowfullscreen style="display:block;width:100%;height:auto;aspect-ratio:16/9;min-height:240px;border:0"></iframe>';
$("copy").innerHTML='Kopírovat kód <svg><use href="#i-code"/></svg>';
}else {
$("dialog-title").textContent="Rozhlédněte se po svém";
$("dialog-copy").textContent="Myš nebo prst: táhněte obrazem. Přiblížení: kolečko myši nebo dva prsty. Klávesnice v obrazu: šipky mění směr, + a − přiblížení, mezerník zastaví nebo spustí let, Home vrátí výchozí pohled. Při zapnutém postupném přehrávání po konci záznamu pokračuje další video. Pohled se otáčí v natočeném záznamu; trasu letu nelze změnit.";
}
$("dialog").showModal();
if(kind!=="help"){$("share-output").focus();$("share-output").select();}
}
$("share").addEventListener("click",()=>showDialog("share"));$("embed").addEventListener("click",()=>showDialog("embed"));$("help").addEventListener("click",()=>showDialog("help"));
$("close-dialog").addEventListener("click",()=>$("dialog").close());
$("dialog").addEventListener("click",e=>{const rect=$("dialog").getBoundingClientRect();if(e.target===$("dialog")&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))$("dialog").close();});
$("dialog").addEventListener("close",()=>lastFocus?.focus({preventScroll:true}));
$("copy").addEventListener("click",async()=>{
try{await navigator.clipboard.writeText($("share-output").value);$("copy-status").textContent=dialogKind==="embed"?"Kód zkopírován.":"Odkaz zkopírován.";}
catch(e){$("share-output").focus();$("share-output").select();$("copy-status").textContent="Použijte Ctrl+C nebo ⌘C.";}
});
window.addEventListener("hashchange",()=>{
const params=new URLSearchParams(location.hash.slice(1));if(!params.has("scene"))return;
const scene=scenes.find(s=>s.id===(embedMode?embedScene:params.get("scene")));if(scene)selectScene(scene,false,params);
});
updateView();updateSpeed();loadGallery();
})();
