/** Human-readable meters only. Values passed to tables, cursors and CSV stay in SI. */
const numberFormat=new Intl.NumberFormat('cs-CZ',{maximumSignificantDigits:4,useGrouping:false});
const scales={V:[[1e3,'kV'],[1,'V'],[1e-3,'mV'],[1e-6,'µV']],A:[[1e3,'kA'],[1,'A'],[1e-3,'mA'],[1e-6,'µA'],[1e-9,'nA']]};
const numericalFloor={V:1e-9,A:1e-12};
export function formatInstrument(value,unit='V'){
 if(!Number.isFinite(value))return {text:'—',unit};
 const list=scales[unit];if(!list)throw Error('Nepodporovaná veličina měřidla.');
 // Below these floors native Newton/GMIN residue is not a meaningful reading.
 if(Math.abs(value)<numericalFloor[unit])return {text:'0',unit};
 let index=list.findIndex(([scale])=>Math.abs(value)>=scale);if(index<0)index=list.length-1;
 // Rounding to four digits can cross a 1000:1 range boundary.
 let scaled=Number((value/list[index][0]).toPrecision(4));
 if(Math.abs(scaled)>=1000&&index>0){index--;scaled=Number((value/list[index][0]).toPrecision(4));}
 return {text:numberFormat.format(Object.is(scaled,-0)?0:scaled),unit:list[index][1]};
}

/** Presentation cadence, never an electrical low-pass filter or sample average. */
export function createReadoutClock(intervalMs=200){
 if(!(Number.isFinite(intervalMs)&&intervalMs>0))throw Error('Neplatná perioda odečtu.');
 let last=-Infinity,wasRunning=false;
 return {shouldUpdate({now,running=false,force=false}={}){
  if(!Number.isFinite(now))throw Error('Odečet potřebuje platný čas.');
  const update=force||!running||!wasRunning||now<last||now-last>=intervalMs;
  wasRunning=!!running;if(update)last=now;return update;
 }};
}
