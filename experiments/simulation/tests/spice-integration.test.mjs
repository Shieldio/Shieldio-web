import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const available=existsSync(new URL('../vendor/eecircuit-engine-1.8.0.mjs',import.meta.url));
test('ngspice WASM: skutečný výpočet děliče a RC filtru',{skip:!available,timeout:45000},async()=>{
 const {Simulation}=await import('../vendor/eecircuit-engine-1.8.0.mjs');
 const sim=new Simulation();
 await sim.start();
 sim.setNetList('SHiELDiO reference divider\nV1 in 0 DC 10\nR1 in out 1000\nR2 out 0 1000\n.op\n.end\n');
 const op=await sim.runSim();
 const out=op.data.find(v=>v.name.toLowerCase()==='v(out)');
 assert.ok(out,'ngspice musí vrátit výstupní napětí');
 assert.ok(Math.abs(out.values[0]-5)<1e-7,'dělič 10 V musí mít výstup 5 V');
 sim.setNetList('SHiELDiO reference RC\nV1 in 0 AC 1\nR1 in out 1000\nC1 out 0 1e-6\n.ac lin 2 159.15494309189535 318.3098861837907\n.end\n');
 const ac=await sim.runSim();
 const v=ac.data.find(v=>v.name.toLowerCase()==='v(out)').values[0];
 assert.ok(Math.abs(20*Math.log10(Math.hypot(v.real,v.img))+3.01029995664)<1e-5);
 assert.ok(Math.abs(Math.atan2(v.img,v.real)*180/Math.PI+45)<1e-5);
});
