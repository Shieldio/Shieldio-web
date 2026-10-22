/** Oscilloscope geometry in SI units. Eight divisions on both axes. */
export const SCOPE_DIVISIONS=8;
export function niceSensitivity(value){
 if(!(value>0)||!Number.isFinite(value))return 1;
 const decade=10**Math.floor(Math.log10(value)),fraction=value/decade;
 return (fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*decade;
}
export function autoSensitivity(values,unit='V'){
 if(unit==='')return .2;
 let peak=0;for(const v of values||[])if(Number.isFinite(v))peak=Math.max(peak,Math.abs(v));
 return niceSensitivity(peak?peak/3.5:unit==='A'?1e-6:.1);
}
export function axisRange(sensitivity,zero=0,divisions=SCOPE_DIVISIONS){
 const half=divisions/2,s=Number(sensitivity)>0?Number(sensitivity):1,z=Number.isFinite(Number(zero))?Number(zero):0;
 return {min:(-half-z)*s,max:(half-z)*s,sensitivity:s,zero:z};
}
export function stableChannelScale(config,id,values,unit='V'){
 config.channels||={};let channel=config.channels[id];if(!channel||typeof channel!=='object')channel=config.channels[id]={};
 if(!(Number(channel.sensitivity)>0)||!Number.isFinite(Number(channel.sensitivity)))channel.sensitivity=autoSensitivity(values,unit);
 if(!Number.isFinite(Number(channel.zero)))channel.zero=unit===''?-2:0;
 channel.sensitivity=Number(channel.sensitivity);channel.zero=Number(channel.zero);
 return channel;
}
/** Select a fully acquired triggered sweep. The crossing is at 25% of screen. */
export function triggeredStart(time,values,until,span,level=0,edge='rising'){
 if(!Array.isArray(time)||!values||!['rising','falling'].includes(edge)||!(span>0))return null;
 const latest=until-span*.75;let crossing=null;
 for(let j=1;j<time.length&&time[j-1]<=latest;j++){
  const a=values[j-1],b=values[j];if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)continue;
  if(edge==='rising'?a<level&&b>=level:a>level&&b<=level){const t=time[j-1]+(level-a)/(b-a)*(time[j]-time[j-1]);if(t<=latest&&t-span*.25>=time[0])crossing=t;}
 }
 return crossing===null?null:crossing-span*.25;
}
/** Adjacent physical 1–2–5 setting; never accumulate wheel rounding errors. */
export function stepSensitivity(value,direction){if(!(value>0)||!Number.isFinite(value))value=1;const exponent=Math.floor(Math.log10(value));const choices=[];for(let e=exponent-1;e<=exponent+1;e++)for(const n of [1,2,5])choices.push(n*10**e);const eps=value*1e-10;return direction>0?choices.find(v=>v>value+eps)??value*2:[...choices].reverse().find(v=>v<value-eps)??value/2;}
export function zoomTimeWindow({start,span,anchor=.5,first=0,latest,step=0,direction=1}){const target=start+span*anchor,minSpan=Math.max(step*8,Number.MIN_VALUE),available=Math.max(minSpan,latest-first);const next=Math.max(minSpan,Math.min(available,stepSensitivity(span/8,direction)*8));return {span:next,start:Math.max(first,Math.min(Math.max(first,latest-next),target-next*anchor))};}
