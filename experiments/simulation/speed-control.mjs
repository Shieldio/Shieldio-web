export const MIN_SPEED=1e-12,MAX_SPEED=100;
export function validateSpeed(value){const n=Number(String(value).replace(',','.'));if(!Number.isFinite(n)||n<MIN_SPEED||n>MAX_SPEED)throw Error('Rychlost musí být 1e−12 až 100 sekund simulace za sekundu.');return n;}
export function dominantFrequency(project){return Math.max(0,...project.components.filter(c=>['vac','iac','clock'].includes(c.type)).map(c=>Number(c.params.frequency)||0));}
export function adaptiveSpeed(project){const f=typeof project==='number'?project:dominantFrequency(project);return Math.max(MIN_SPEED,Math.min(MAX_SPEED,f>0?1/f:1));}
export function formatSpeed(speed){const pair=[[1,'s'],[1e-3,'ms'],[1e-6,'µs'],[1e-9,'ns'],[1e-12,'ps']].find(([s])=>speed>=s)||[1e-12,'ps'];return Number((speed/pair[0]).toPrecision(3))+' '+pair[1]+' / s';}
/** Main dial spans three useful decades around one source period per second.
 * Exact absolute rates remain available independently of the dial. */
export function speedFromSlider(project,position){const x=Math.max(-2,Math.min(1,Number(position)||0));return Math.max(MIN_SPEED,Math.min(MAX_SPEED,adaptiveSpeed(project)*10**x));}
export function sliderFromSpeed(project,speed){return Math.max(-2,Math.min(1,Math.log10(validateSpeed(speed)/adaptiveSpeed(project))));}
export function speedLabel(project,speed){const f=dominantFrequency(project);return f?Number((speed*f).toPrecision(3))+' period/s':formatSpeed(speed);}
