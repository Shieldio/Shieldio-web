import test from 'node:test';
import assert from 'node:assert/strict';
import {formatInstrument,createReadoutClock} from '../instrument-readout.mjs';
const reading=(v,u)=>formatInstrument(v,u);
test('Meters use four significant digits and engineering ranges without exponential jumps',()=>{
 assert.deepEqual(reading(.62345678,'V'),{text:'623,5',unit:'mV'});
 assert.deepEqual(reading(-.007891234,'A'),{text:'-7,891',unit:'mA'});
 assert.deepEqual(reading(2.341e-7,'A'),{text:'234,1',unit:'nA'});
 assert.deepEqual(reading(.000015627,'V'),{text:'15,63',unit:'µV'});
 assert.deepEqual(reading(.999999,'V'),{text:'1',unit:'V'});
 assert.deepEqual(reading(12.34567,'V'),{text:'12,35',unit:'V'});
});
test('Numerical residue is not displayed as a physical diode leakage, but nanoamps are retained',()=>{
 assert.deepEqual(reading(1.373e-14,'V'),{text:'0',unit:'V'});
 assert.deepEqual(reading(-7.589e-22,'A'),{text:'0',unit:'A'});
 assert.deepEqual(reading(2e-9,'A'),{text:'2',unit:'nA'});
 assert.deepEqual(reading(-0,'V'),{text:'0',unit:'V'});
 assert.deepEqual(reading(NaN,'V'),{text:'—',unit:'V'});
});
test('A live meter refreshes at five Hz without averaging the electrical samples',()=>{
 const clock=createReadoutClock();
 assert.equal(clock.shouldUpdate({now:0,running:true}),true);
 assert.equal(clock.shouldUpdate({now:50,running:true}),false);
 assert.equal(clock.shouldUpdate({now:199,running:true}),false);
 assert.equal(clock.shouldUpdate({now:200,running:true}),true);
 assert.equal(clock.shouldUpdate({now:201,running:true}),false);
 assert.equal(clock.shouldUpdate({now:205,running:false}),true,'pause must expose the exact last point immediately');
 assert.equal(clock.shouldUpdate({now:206,running:false}),true,'DC/cursor changes must not wait for the live timer');
 assert.equal(clock.shouldUpdate({now:207,running:true}),true,'resume updates at once');
 assert.equal(clock.shouldUpdate({now:208,running:true,force:true}),true,'capture and explicit render can force an exact point');
 assert.equal(clock.shouldUpdate({now:10,running:true}),true,'clock origin changes do not freeze the display');
});
