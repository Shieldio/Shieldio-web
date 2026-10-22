export const MIN_SPEED=1e-12,MAX_SPEED=100;
export function validateSpeed(value){const n=Number(String(value).replace(',','.'));if(!Number.isFinite(n)||n<MIN_SPEED||n>MAX_SPEED)throw Error('Rychlost musí být 1e−12 až 100 sekund simulace za sekundu.');return n;}
export function dominantFrequency(project){return Math.max(0,...project.components.filter(c=>['vac','iac','clock'].includes(c.type)).map(c=>Number(c.params.frequency)||0));}
export function adaptiveSpeed(project){const f=typeof project==='number'?project:dominantFrequency(project);return Math.max(MIN_SPEED,Math.min(MAX_SPEED,f>0?1/f:1));}
export function formatSpeed(speed){const pair=[[1,'s'],[1e-3,'ms'],[1e-6,'µs'],[1e-9,'ns'],[1e-12,'ps']].find(([s])=>speed>=s)||[1e-12,'ps'];return Number((speed/pair[0]).toPrecision(3))+' '+pair[1]+' / s';}
