// Dimensions in millimetres. The D4.4 profile is measured from the reference STL.
export const defaults=Object.freeze({diameter:55,width:38,rim:2.7,hub:14,spokes:5,spokeWidth:5,recess:0,recessDiameter:27,shaft:4.4,flatCut:.65,hole:'D',style:'spokes'});
export function validate(p){
 const errors=[];
 const ranges={diameter:[20,200],width:[5,80],rim:[1,15],hub:[6,80],spokes:[3,12],spokeWidth:[2,30],recess:[0,75],recessDiameter:[10,160],shaft:[2,20],flatCut:[0,9]};
 for(const [key,[min,max]] of Object.entries(ranges))if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)errors.push(`Rozměr ${key} je mimo povolený rozsah.`);
 if(!['D','round'].includes(p.hole)||!['spokes','solid'].includes(p.style))errors.push('Neplatný typ kola nebo otvoru.');
 if(!Number.isInteger(p.spokes))errors.push('Počet paprsků musí být celé číslo.');
 if(p.hub>=p.diameter-2*p.rim-2)errors.push('Mezi nábojem a obručí musí zbýt alespoň 1 mm.');
 if(p.hub<p.shaft+4)errors.push('Stěna náboje kolem otvoru musí mít alespoň 2 mm.');
 if(p.recess>0&&(p.recessDiameter<=p.hub+2||p.recessDiameter>p.diameter-2*p.rim))errors.push('Průměr zapuštění musí být větší než náboj o více než 2 mm a nejvýše po vnitřní okraj obruče.');
 if(p.recess>p.width-3)errors.push('Po zapuštění musí zbýt alespoň 3 mm tloušťky náboje a paprsků.');
 if(p.hole==='D'&&p.flatCut>=p.shaft/2)errors.push('Seříznutí D-profilu musí být menší než poloměr otvoru.');
 if(p.style==='spokes'&&p.spokeWidth>=Math.PI*(p.diameter/2-p.rim)/p.spokes)errors.push('Paprsky jsou příliš široké; zmenši jejich šířku nebo počet.');
 return errors;
}
export function generateWheel(p){
 const errors=validate(p);if(errors.length)throw Error(errors.join(' '));
 const R=p.diameter/2,ri=R-p.rim,h=p.hub/2,s=p.shaft/2,flat=s-p.flatCut;
 const angles=Array.from({length:192},(_,i)=>i*2*Math.PI/192);
 const half=p.spokeWidth/(2*ri),tau=Math.PI*2;
 function angle(v){return (v%tau+tau)%tau;}
 for(let i=0;i<p.spokes;i++){angles.push(angle(i*tau/p.spokes-half),angle(i*tau/p.spokes+half));}
 if(p.hole==='D'&&p.flatCut>0){const a=Math.acos(flat/s);angles.push(a,tau-a);}
 const aa=angles.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>1e-8),N=aa.length;
 const zz=p.recess>0?[0,p.recess,p.width]:[0,p.width],L=zz.length-1;
 const support=i=>{if(p.style==='solid')return true;let mid=(aa[i]+(i===N-1?tau:aa[i+1]))/2;const step=tau/p.spokes;return Math.abs(((mid+step/2)%step)-step/2)<half+1e-9;};
 const radii=[s,h,ri,R];if(p.recess>0&&p.recessDiameter/2>h+1e-8&&p.recessDiameter/2<ri-1e-8)radii.push(p.recessDiameter/2);radii.sort((a,b)=>a-b);const K=radii.length-1;
 const occupied=(k,i,l)=>{if(k<0||k>=K||l<0||l>=L)return false;const r=(radii[k]+radii[k+1])/2;return (r>=ri||r<h||support((i+N)%N))&&(zz[l]>=p.recess-1e-8||r>=p.recessDiameter/2);};
 const point=(k,i,l)=>{const t=aa[(i+N)%N],c=Math.cos(t),r=k===0?(p.hole==='D'&&c>0?Math.min(s,flat/c):s):radii[k];return [r*c,r*Math.sin(t),zz[l]];};
 const triangles=[];
 const quad=(a,b,c,d)=>{triangles.push(a,b,c,a,c,d);};
 for(let l=0;l<L;l++)for(let k=0;k<K;k++)for(let i=0;i<N;i++){
  if(!occupied(k,i,l))continue;const j=(i+1)%N;
  const A=point(k,i,l),B=point(k+1,i,l),C=point(k+1,j,l),D=point(k,j,l),E=point(k,i,l+1),F=point(k+1,i,l+1),G=point(k+1,j,l+1),H=point(k,j,l+1);
  if(!occupied(k,i,l-1))quad(A,D,C,B);
  if(!occupied(k,i,l+1))quad(E,F,G,H);
  if(!occupied(k-1,i,l))quad(A,E,H,D);
  if(!occupied(k+1,i,l))quad(B,C,G,F);
  if(!occupied(k,i-1,l))quad(A,B,F,E);
  if(!occupied(k,j,l))quad(D,H,G,C);
 }
 let volume=0;
 for(let i=0;i<triangles.length;i+=3){const [a,b,c]=triangles.slice(i,i+3);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
 return {triangles,volume,triangleCount:triangles.length/3};
}
export function toSTL(model){
 const buffer=new ArrayBuffer(84+model.triangleCount*50),view=new DataView(buffer);
 const label=new TextEncoder().encode('Shieldio wheel configurator | mm');new Uint8Array(buffer).set(label);view.setUint32(80,model.triangleCount,true);
 for(let i=0;i<model.triangleCount;i++){
  const [a,b,c]=model.triangles.slice(i*3,i*3+3),u=b.map((v,j)=>v-a[j]),v=c.map((v,j)=>v-a[j]);
  let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal);normal=normal.map(v=>v/length);
  const values=[...normal,...a,...b,...c];values.forEach((v,j)=>view.setFloat32(84+i*50+j*4,v,true));
 }
 return buffer;
}
