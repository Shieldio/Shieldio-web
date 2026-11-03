// Exercise actual guide rendering without network or a physical board.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.JSDOM_TEST_PACKAGE || 'jsdom');
const engine=await fs.readFile(new URL('../assets/js/guide-engine.js',import.meta.url),'utf8');
for(const id of ['zavora','parkovaci-asistent','casovac','theremin']){
 const html=await fs.readFile(new URL(`../instructions/baseline/red/${id}/index.html`,import.meta.url),'utf8');
 const source=await fs.readFile(new URL(`../assets/js/guide-data-${id}.js`,import.meta.url),'utf8');
 for(const lang of ['cs','en'])for(const mode of ['blocks','arduino']){
  const dom=new JSDOM(html,{url:`https://shieldio.cz/instructions/baseline/red/${id}/`,runScripts:'outside-only'});
  const w=dom.window;w.scrollTo=()=>{};w.eval(source);
  const data=w.SHIELDIO_GUIDE;
  const steps=data.steps.filter(step=>!step.kit || step.kit==='assembled');
  const upload=steps.findIndex(step=>step.type==='upload');assert.ok(upload>=0,id);
  w.localStorage.setItem('shieldio-lang',lang);
  w.localStorage.setItem('shieldio-guide-'+id,JSON.stringify({started:true,stepIndex:upload,mode:{lang:mode,depth:'detailed',kit:'assembled',skill:'beginner'}}));
  w.eval(engine);
  const root=w.document.getElementById('guide-app');
  const links=[...root.querySelectorAll('a')];
  const editor=links.find(link=>new URL(link.href).pathname==='/instructions/blokovy-editor.html');assert.ok(editor,`${id} ${lang} ${mode} opens the editor`);
  assert.equal(new URL(editor.href).origin,'https://shieldio.cz');
  assert.ok(links.some(link=>new URL(link.href).pathname==='/instructions/programovani/'));
  assert.ok(!links.some(link=>/mblock\.cc|\/instructions\/mblock/.test(link.href)));
  root.querySelector('[data-action="fail"]').click();
  assert.ok(!/mBlock|Arduino IDE/.test(root.textContent),`${id}: diagnostics use the same editor as the action`);
  dom.window.close();
 }
}
console.log('Site journeys: four RED guides, both languages and both programming modes point to Shieldio and show matching diagnostics.');
