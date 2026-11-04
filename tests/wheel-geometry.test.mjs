import assert from 'node:assert/strict';
import {defaults,generateWheel,toSTL,validate} from '../assets/js/wheel-geometry.mjs';
function inspect(p){
 const model=generateWheel(p),edges=new Map();
 const key=v=>v.map(x=>Math.round(x*1e6)).join(',');
 for(let i=0;i<model.triangles.length;i+=3){const v=model.triangles.slice(i,i+3).map(key);for(let j=0;j<3;j++){const a=v[j],b=v[(j+1)%3],id=[a,b].sort().join('|'),e=edges.get(id)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(id,e);}}
 for(const [edge,[count,balance]] of edges){assert.equal(count,2,`non-manifold edge ${edge}`);assert.equal(balance,0,'inconsistent winding');}
 assert.ok(model.volume>0);const data=toSTL(model);assert.equal(data.byteLength,84+model.triangleCount*50);
 const vertices=model.triangles;assert.ok(Math.abs(Math.max(...vertices.map(v=>v[0]))-p.diameter/2)<1e-5);assert.equal(Math.max(...vertices.map(v=>v[2])),p.width);
 if(p.hole==='D'){const inner=vertices.filter(v=>Math.hypot(v[0],v[1])<=p.shaft/2+1e-6);assert.ok(Math.abs(Math.max(...inner.map(v=>v[0]))-(p.shaft/2-p.flatCut))<1e-6);}
 return model;
}
inspect(defaults);
for(const diameter of [40,55,67,100])for(const recess of [0,10,30])for(const hole of ['D','round'])for(const style of ['spokes','solid'])inspect({...defaults,diameter,recess,hole,style});
for(const spokes of [3,4,5,6,8,10,12])for(const flatCut of [.1,.65,1.5])for(const recess of [0,20])inspect({...defaults,spokes,flatCut,recess});
for(const recessDiameter of [17,20,27,40,49.6])inspect({...defaults,recess:20,recessDiameter});
const round=inspect({...defaults,style:'solid',hole:'round'});const analytic=Math.PI*((defaults.diameter/2)**2-(defaults.shaft/2)**2)*defaults.width;assert.ok(Math.abs(round.volume/analytic-1)<.001);
assert.ok(validate({...defaults,recess:defaults.width}).length);assert.ok(validate({...defaults,shaft:NaN}).length);assert.ok(validate({...defaults,hub:3}).length);assert.ok(validate({...defaults,spokes:4.5}).length);
console.log('Wheel: 97 variants; closed manifold, winding, D flat, bounds, STL, volume and invalid input passed.');
