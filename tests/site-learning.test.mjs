import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.JSDOM_TEST_PACKAGE||'jsdom');
const scripts=await Promise.all(['level-toggle','concept-labs'].map(n=>fs.readFile(new URL('../assets/js/'+n+'.js',import.meta.url),'utf8')));
for(const topic of ['ohmuv-zakon','tlacitka-a-debounce','dioda-a-led','ultrazvuk','kondenzatory','pcb','pwm'])for(const suffix of ['/','/index.html',''])for(const lang of ['cs','en']){
 const html=await fs.readFile(new URL('../instructions/jak-to-funguje/'+topic+'/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://shieldio.cz/instructions/jak-to-funguje/'+topic+suffix,runScripts:'outside-only'}),w=dom.window,doc=w.document;
 doc.documentElement.lang=lang;w.localStorage.setItem('shieldio-learn-level','simple');scripts.forEach(s=>w.eval(s));doc.dispatchEvent(new w.Event('DOMContentLoaded'));
 const choose=level=>doc.querySelector('[data-level="'+level+'"]').click();
 assert.ok([...doc.querySelectorAll('.level-equations')].every(x=>x.hidden));
 choose('equations');assert.ok([...doc.querySelectorAll('.level-equations')].every(x=>!x.hidden));assert.ok([...doc.querySelectorAll('.level-simple-only')].every(x=>x.hidden));
 choose('simple');assert.ok([...doc.querySelectorAll('.level-advanced')].every(x=>x.hidden));
 if(topic==='pwm'){dom.window.close();continue;}
 const root=doc.querySelector('.concept-lab');assert.ok(root,topic+suffix+' starts its model');
 const out=key=>root.querySelector('[data-lab-out="'+key+'"]').textContent;
 const number=key=>parseFloat(lang==='en'?out(key).replaceAll(',',''):out(key).replace(/\s/g,'').replace(',','.'));
 const input=(key,value)=>{const el=root.querySelector('[data-lab="'+key+'"]');el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 if(topic==='ohmuv-zakon'){input('u',5);input('r',1000);assert.equal(number('i'),5);assert.equal(number('p'),.025);}
 if(topic==='kondenzatory'){
  input('r',10);input('c',100);input('time',1);assert.ok(Math.abs(number('voltage')-3.16)<.01,'One tau gives 63.2% of 5 V');
  input('time',0);assert.equal(number('voltage'),0);root.querySelector('[data-mode="discharge"]').click();assert.equal(number('voltage'),5);
  input('time',1);assert.ok(Math.abs(number('voltage')-1.84)<.01,'Discharge retains 36.8% after one tau');
  input('r',1);input('c',.1);assert.match(out('tau'),/100.*µs/,'Small capacitances keep a readable time scale');
 }
 if(topic==='ultrazvuk'){input('d',20);input('temp',20);assert.ok(Math.abs(number('echo')-1165)<2);assert.match(out('formula'),/20 000/);}
 if(topic==='pcb'){input('w',1);input('l',100);input('i',2);assert.equal(number('r-result'),.048);assert.equal(number('drop'),.096);assert.equal(number('loss'),.192);}
 if(topic==='dioda-a-led'){input('type',.7);input('u',5);assert.ok(Math.abs(number('i')-19.5)<.1);assert.equal(root.querySelector('[data-lab="led"]').style.display,'none');input('u',-1);assert.equal(number('i'),0);}
 if(topic==='tlacitka-a-debounce'){input('wait',60);assert.equal(number('accepted'),1);input('wait',5);assert.ok(number('accepted')>1,'Too short a stable interval accepts bounce');}
 dom.window.close();
}
console.log('Learning: all seven levels in CS/EN; six models on directory, index.html and extensionless URLs; RC limits, units, debounce and circuit calculations passed.');
