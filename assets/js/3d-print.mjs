import * as THREE from 'three';
import { OrbitControls } from '/assets/vendor/three/OrbitControls.js';
import { STLLoader } from '/assets/vendor/three/STLLoader.js';
const $=id=>document.getElementById(id), host=$('viewer'), status=$('status');
const en=()=>document.documentElement.lang==='en';
const message=key=>({error:en()?'Could not open the model. Choose a valid STL up to 30 MB.':'Model se nepodařilo otevřít. Vyber platný STL do 30 MB.',webgl:en()?'3D preview is unavailable. Try enabling hardware acceleration or using another browser.':'3D náhled není dostupný. Zkus zapnout hardwarovou akceleraci nebo jiný prohlížeč.'}[key]);
export let displayModel=()=>false;
let renderer, software=false;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); } catch {
 try { const {SVGRenderer}=await import('/assets/vendor/three/SVGRenderer.js'); renderer=new SVGRenderer();software=true; } catch { status.textContent=message('webgl'); }
}
if(renderer){
if(!software)renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(40,1,0.01,10000);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,3));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(2,4,3);scene.add(light);
const material=new THREE.MeshLambertMaterial({color:0x0d9488,side:THREE.DoubleSide});
let mesh, radius=20, url, sample=true, sequence=0;
function reset(){camera.position.set(radius*1.6,radius*1.2,radius*1.8);camera.near=radius/1000;camera.far=radius*100;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.minDistance=radius*.15;controls.maxDistance=radius*20;controls.update();}
function nameSample(){if(sample)$('model-name').textContent=en()?'Sample: 20 mm cube':'Ukázka: kostka 20 mm';}
function show(buffer,name,isSample,fit=true){
 const geometry=new STLLoader().parse(buffer), pos=geometry.getAttribute('position');
 if(!pos||!pos.count||pos.count>(software?90000:3000000)){geometry.dispose();throw Error('Invalid geometry');}
 for(const value of pos.array)if(!Number.isFinite(value)){geometry.dispose();throw Error('Nonfinite vertex');}
 geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new THREE.Vector3());radius=size.length()/2;
 if(!Number.isFinite(radius)||radius<=0){geometry.dispose();throw Error('Empty geometry');}
 geometry.center();geometry.rotateX(-Math.PI/2);geometry.computeVertexNormals();
 if(mesh){scene.remove(mesh);mesh.geometry.dispose();}mesh=new THREE.Mesh(geometry,material);scene.add(mesh);if(fit)reset();
 sample=isSample;$('model-name').textContent=name;nameSample();
 $('dimensions').textContent=[size.x,size.y,size.z].map(v=>v.toLocaleString(en()?'en':'cs',{maximumFractionDigits:2})).join(' × ')+' mm';
 if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([buffer],{type:'model/stl'}));$('download').href=url;$('download').download=name.endsWith('.stl')?name:'kostka-20mm.stl';status.textContent='';
}
async function demo(){const request=++sequence;try{const response=await fetch('/assets/models/kostka-20mm.stl');if(!response.ok)throw Error();const buffer=await response.arrayBuffer();if(request===sequence){show(buffer,'kostka-20mm.stl',true);document.dispatchEvent(new Event('shieldio-stl-opened'));}}catch{if(request===sequence)status.textContent=message('error');}}
async function open(file){if(!file)return;const request=++sequence;try{if(!/\.stl$/i.test(file.name)||file.size>30*1024*1024)throw Error();const buffer=await file.arrayBuffer();if(request===sequence){show(buffer,file.name,false);document.dispatchEvent(new Event("shieldio-stl-opened"));}}catch{if(request===sequence)status.textContent=software?(en()?'Could not open the model. Without WebGL the limit is 30,000 triangles.':'Model se nepodařilo otevřít. Bez WebGL je limit 30 000 trojúhelníků.'):message('error');}}
$('stl-file').addEventListener('change',e=>{open(e.target.files[0]);e.target.value='';});
$('demo').onclick=demo;$('reset').onclick=reset;$('wire').onchange=e=>{material.wireframe=e.target.checked;};
host.addEventListener('dragover',e=>{e.preventDefault();host.classList.add('dragging');});host.addEventListener('dragleave',()=>host.classList.remove('dragging'));host.addEventListener('drop',e=>{e.preventDefault();host.classList.remove('dragging');open(e.dataTransfer.files[0]);});
host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){reset();return;}if(e.key==='+'||e.key==='-')camera.position.multiplyScalar(e.key==='+'?.9:1.1);else{const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));spherical.theta+=e.key==='ArrowLeft'?.15:e.key==='ArrowRight'?-.15:0;spherical.phi+=e.key==='ArrowUp'?-.15:e.key==='ArrowDown'?.15:0;spherical.makeSafe();camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));}controls.update();});
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
document.addEventListener('shieldio-lang-change',nameSample);
displayModel=(buffer,name,fit=true)=>{++sequence;show(buffer,name,false,fit);return true;};
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();if(!document.getElementById("wheel-form"))demo();
}
