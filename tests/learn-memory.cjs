// Run with node tests/learn-memory.cjs (no dependencies).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{}};
vm.createContext(context);
for(const file of ['learn-memory-data-v2.js','learn-memory-v2.js']) {
  vm.runInContext(fs.readFileSync(`assets/js/${file}`,'utf8'),context);
}
const data=context.window.ShieldioMemoryData;
const m=context.window.ShieldioMemoryModels;
assert.equal(data.chapters.length,19);
assert.equal(new Set(data.chapters.map(c=>c.id)).size,19);
for(const c of data.chapters){
  assert.ok(c.paragraphs.length>=3,c.id);
  assert.ok(c.rows.length>1 && c.question && c.answer && c.activity,c.id);
  assert.ok(c.source_refs[0].section && c.learning_objective,c.id);
}
for(const [id,drills] of Object.entries(data.drills)){
  assert.ok(data.chapters.some(c=>c.id===id));
  for(const q of drills) assert.ok(q[2]>=0 && q[2]<q[1].length && q[3]);
}
for(const kind of ['NOR','NAND']) for(const previous of [0,1,null]) {
  const active=kind==='NOR'?1:0, inactive=1-active;
  assert.equal(m.rs(kind,inactive,inactive,previous),previous);
  assert.equal(m.rs(kind,active,inactive,previous),1);
  assert.equal(m.rs(kind,inactive,active,previous),0);
  assert.equal(m.rs(kind,active,active,previous),null);
}
assert.equal(m.latency(3200,16),10);
assert.equal(m.latency(6000,30),10);
assert.equal(m.extents([1,10,4,14]),4);
assert.equal(m.extents([4,5,6,7]),1);
assert.equal(m.extents([]),0);
for(const [size,expected] of [[2,[false,false,true,false,false,false]],[3,[false,false,true,false,true,true]]]){
  let cache=[];
  const hits=[1,2,1,3,2,1].map(address=>{const result=m.cacheStep(cache,address,size);cache=result.cache;return result.hit;});
  assert.deepEqual(hits,expected);
  assert.ok(cache.length<=size);
}
console.log('Paměti PC: 19 kapitol, banky úloh, RS, CL, fragmentace a LRU OK');
