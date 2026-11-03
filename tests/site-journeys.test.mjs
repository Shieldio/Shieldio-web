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

const dictionary=JSON.parse(await fs.readFile(new URL('../assets/data/i18n.json',import.meta.url),'utf8'));
const languageScript=await fs.readFile(new URL('../assets/js/lang.js',import.meta.url),'utf8');
for(const [path,scope] of [['company/pro-ucitele.html','body'],['products/RED.html','#varianty']]){
 const html=await fs.readFile(new URL('../'+path,import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://shieldio.cz/'+path,runScripts:'outside-only'}),w=dom.window;
 w.localStorage.setItem('shieldio-lang','en');w.fetch=async()=>({json:async()=>dictionary});
 const translated=new Promise(resolve=>w.document.addEventListener('shieldio-lang-change',resolve,{once:true}));
 w.eval(languageScript);await translated;
 assert.equal(w.document.documentElement.lang,'en');
 const root=w.document.querySelector(scope);
 for(const el of root.querySelectorAll('[data-i18n]')){
  const expected=w.document.createElement('div');expected.innerHTML=dictionary[el.dataset.i18n].en;
  assert.equal(el.textContent,expected.textContent,`${path}: ${el.dataset.i18n} is translated`);
 }
 if(path.startsWith('company/')){
  assert.equal(root.querySelector('h1').textContent,'Preparing a lesson with RED.');
  assert.ok(!/Příprava hodiny|Doporučený věk|Průběh hodiny|Bezpečnost a pájení/.test(root.textContent));
 } else assert.match(root.textContent,/RED is not on sale yet/);
 w.document.querySelector('.lang-toggle').click();assert.equal(w.document.documentElement.lang,'cs');
 for(const el of root.querySelectorAll('[data-i18n]')){
  const expected=w.document.createElement('div');expected.innerHTML=dictionary[el.dataset.i18n].cs;
  assert.equal(el.textContent,expected.textContent,`${path}: Czech text is restored`);
 }
 dom.window.close();
}
console.log('Site language: actual CS/EN switching translates the full teacher page and RED comparison, including links and availability.');
