import {measurementSeries} from './workbench-model.mjs';
// Pair simultaneous samples. Never sort by voltage: a real XY scope preserves
// the acquisition order, including return sweeps and Lissajous trajectories.
export function xySeries(project,config,record){
 const x=project.measurements.find(m=>m.id===config.xId),y=project.measurements.find(m=>m.id===config.yId);
 if(!x||!y||!record?.time)return null;
 return {x,y,time:record.time,xValues:measurementSeries(project,x,record),yValues:measurementSeries(project,y,record)};
}
export function xyRange(values,scale=1,shift=0){
 let min=0,max=0,found=false;
 for(const v of values)if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);found=true;}
 if(!found)return null;
 const pad=(max-min)*.08||Math.max(Math.abs(max)*.1,1e-6),center=(max+min)/2+shift,half=((max-min)/2+pad)/Math.max(.001,Math.min(1e6,scale));
 return {min:center-half,max:center+half};
}
export function xySamples(series,until=Infinity,persistence=true){
 const out=[];let from=0;
 if(!persistence){let end=series.time.findIndex(t=>t>until+32*Number.EPSILON*Math.max(Math.abs(until),1e-300));if(end<0)end=series.time.length;from=Math.max(0,end-60);}
 for(let i=from;i<series.time.length&&series.time[i]<=until+32*Number.EPSILON*Math.max(Math.abs(until),1e-300);i++){
  const x=series.xValues[i],y=series.yValues[i];
  out.push(Number.isFinite(x)&&Number.isFinite(y)?{x,y,t:series.time[i],index:i}:null);
 }
 return out;
}
