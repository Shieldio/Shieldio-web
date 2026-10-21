import test from 'node:test';
import assert from 'node:assert/strict';
import {examples} from '../examples.mjs';
import {transient,diodeModel,catalog} from '../engine.mjs';
import {validateProject,automaticSettings,measurementSeries} from '../workbench-model.mjs';
import {xySeries,xyRange,xySamples} from '../xy-scope.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
const demos=examples.filter(e=>e.id.startsWith('diode-iv-'));
const results=new Map();
for(const e of demos)test(e.id+': current/voltage satisfy KVL, shunt measurement and diode model',()=>{
 const p=validateProject(copy(e.project)),r=transient({...p,probes:[]},automaticSettings(p)),series=xySeries(p,p.scopeSettings[0],r);results.set(e.id,{p,r,series});
 assert.equal(p.scopeSettings[0].mode,'xy');assert.equal(series.x.kind,'voltage');assert.equal(series.y.kind,'current');assert.ok(r.time.length>=3000);
 const diode=p.components.find(c=>c.id==='D1'),q={...catalog.find(c=>c.type===diode.type).defaults,...diode.params},resistance=p.components.find(c=>c.id==='R1').params.value;
 const shunt=measurementSeries(p,p.measurements.find(m=>m.id==='urs'),r),source=measurementSeries(p,{componentId:'V1',kind:'voltage'},r);
 for(let j=0;j<r.time.length;j++){
  const u=series.xValues[j],i=series.yValues[j];assert.ok(Number.isFinite(u)&&Number.isFinite(i));assert.ok(Math.abs(i-shunt[j]/100)<1e-8,'IR = UR / RS');assert.ok(Math.abs(source[j]-u-i*(resistance+100))<1e-7,'source = UD + I(R1+RS)');assert.ok(Math.abs(i-diodeModel(diode.type,q,u).i)<1e-9,'computed pair is on diode characteristic');
 }
 assert.ok(Math.max(...series.yValues)>.003,'visible forward conduction');assert.ok(Math.min(...series.xValues)<-1,'reverse sweep');
 if(diode.type==='zener'){const k=series.yValues.indexOf(Math.min(...series.yValues));assert.ok(series.xValues[k]<-5.1&&series.xValues[k]>-5.3);assert.ok(series.yValues[k]<-.003,'reverse breakdown current');}
});
test('Schottky forward voltage is lower than silicon at 1 mA',()=>{
 const at=id=>{const {series}=results.get(id);let best=0;for(let j=1;j<series.time.length;j++)if(Math.abs(series.yValues[j]-.001)<Math.abs(series.yValues[best]-.001))best=j;return series.xValues[best];};
 assert.ok(at('diode-iv-schottky')<at('diode-iv-silicon')-.2);
});
test('XY samples use simultaneous voltage/current, preserve reverse order and stop at cursor',()=>{
 const series={time:[0,1,2,3],xValues:[0,1,-1,0],yValues:[0,.01,-.02,0]};
 assert.deepEqual(xySamples(series,2).map(p=>[p.x,p.y]),[[0,0],[1,.01],[-1,-.02]]);assert.equal(xySamples(series,0).length,1);
});
test('XY invalid samples create gaps, not lines between unrelated channels',()=>{
 const series={time:[0,1,2,3],xValues:[0,NaN,2,3],yValues:[1,2,NaN,4]};assert.deepEqual(xySamples(series).map(p=>p&&p.index),[0,null,null,3]);
});
test('XY axes include zero, use independent dimensions and stable zoom',()=>{
 const x=xyRange([-5.2,.8]),y=xyRange([-.004,.008]),zoom=xyRange([-5.2,.8],2),shift=xyRange([-5.2,.8],1,2);
 assert.ok(x.min< -5.2&&x.max>.8);assert.ok(y.min<0&&y.max>0);assert.ok(Math.abs((x.max-x.min)/2-(zoom.max-zoom.min))<1e-12);assert.ok(Math.abs(shift.min-x.min-2)<1e-12);assert.equal(xyRange([NaN]),null);
});
test('Beam without persistence shows only a recent trail',()=>{
 const time=Array.from({length:1000},(_,i)=>i),s={time,xValues:time,yValues:time};assert.equal(xySamples(s,999,false).length,60);assert.equal(xySamples(s,999,true).length,1000);
});
test('File round-trip retains XY axes and rejects stale channel references',()=>{
 const p=validateProject(copy(demos[0].project)),again=validateProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(again.scopeSettings,p.scopeSettings);again.measurements=again.measurements.filter(m=>m.id!=='id');assert.equal(validateProject(again).scopeSettings[0].yId,null);
});
