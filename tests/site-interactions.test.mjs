// Browser DOM regression checks. Every network request below is mocked.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {JSDOM}=require(process.env.JSDOM_TEST_PACKAGE||"jsdom");
const katex=require(process.env.KATEX_TEST_PACKAGE||"katex");
const names=["pwm-sim","theme","resistor-calculator","search","contact-form"];
const scripts=Object.fromEntries(await Promise.all(names.map(async n=>[n,await fs.readFile(new URL("../assets/js/"+n+".js",import.meta.url),"utf8")])));
const html=async p=>fs.readFile(new URL("../"+p,import.meta.url),"utf8");
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function mount(markup,setup=()=>{}){
 const dom=new JSDOM(markup,{url:"https://shieldio.cz/",runScripts:"outside-only"}),w=dom.window;
 await new Promise(resolve=>{if(w.document.readyState==="complete")resolve();else w.addEventListener("load",resolve,{once:true});});
 setup(w);
 return {w,d:w.document,run:n=>{w.eval(scripts[n]);w.document.dispatchEvent(new w.Event("DOMContentLoaded"));},close:()=>w.close()};
}
{
 const e=await mount(await html("instructions/jak-to-funguje/pwm/index.html")),{w,d}=e;e.run("pwm-sim");
 const slider=d.getElementById("pwmSlider"),wave=d.getElementById("pwmWave"),set=v=>{slider.value=v;slider.dispatchEvent(new w.Event("input"));};
 set(0);assert.deepEqual([...wave.querySelector("polyline").getAttribute("points").matchAll(/,(\d+)/g)].map(m=>Number(m[1])),[64,64],"0% PWM never rises");
 set(100);assert.deepEqual([...wave.querySelector("polyline").getAttribute("points").matchAll(/,(\d+)/g)].map(m=>Number(m[1])),[6,6],"100% PWM never falls");
 set(37);d.querySelector('[data-pwm-mode="servo"]').click();set(1.75);
 assert.equal(d.getElementById("pwmDeg").textContent,"135°");assert.equal(d.querySelector('[data-pwm-mode="servo"]').getAttribute("aria-pressed"),"true");
 d.documentElement.lang="en";d.dispatchEvent(new w.CustomEvent("shieldio-lang-change"));assert.equal(slider.value,"1.75");
 d.querySelector('[data-pwm-mode="led"]').click();assert.equal(slider.value,"37","Each mode retains its own value");e.close();
}
{
 const e=await mount(await html("index.html"),w=>{w.document.documentElement.lang="en";w.document.documentElement.dataset.theme="light";}),{w,d}=e;
 const themes=[];w.addEventListener("shieldio:theme-change",event=>themes.push(event.detail.theme));e.run("theme");
 w.dispatchEvent(new w.StorageEvent("storage",{key:"shieldio-theme",newValue:"dark"}));
 assert.equal(d.documentElement.dataset.theme,"dark");assert.equal(themes.at(-1),"dark","Other tabs notify the Blockly workspace too");
 assert.equal(d.querySelector('meta[name="theme-color"]').content,"#000000");assert.equal(d.querySelector(".theme-toggle").getAttribute("aria-label"),"Switch to light mode");
 w.dispatchEvent(new w.StorageEvent("storage",{key:"shieldio-theme",newValue:"invalid"}));assert.equal(themes.at(-1),"dark");e.close();
}
{
 const formulas=[];const e=await mount(await html("instructions/jak-to-funguje/ohmuv-zakon/index.html"),w=>{
  w.katex={render(formula,el){formulas.push(formula);el.innerHTML=katex.renderToString(formula,{throwOnError:true});}};
 }),{w,d}=e;e.run("resistor-calculator");
 const box=d.querySelector(".resistor-calc"),set=(key,value)=>{const el=box.querySelector('[data-calc="'+key+'"]');el.value=value;el.dispatchEvent(new w.Event("input"));};
 set("vs",5);set("vf",2);set("i",1);
 assert.match(formulas.at(-1),/\\mathrm\{k\\Omega\}/);assert.ok(box.querySelector('[data-calc="note"] .katex'),"kΩ formula renders without fallback");
 assert.ok(formulas.at(-1).includes("(5-2)\\,\\mathrm{V}"),"Both voltages share a unit");
 d.documentElement.lang="en";d.dispatchEvent(new w.CustomEvent("shieldio-lang-change"));assert.ok(formulas.at(-1).includes("0.001"));
 const colour=d.querySelector(".resistor-color-tool"),value=colour.querySelector("#resistorValue");
 value.value="4.7";colour.querySelector("#resistorUnit").value="1000";value.dispatchEvent(new w.Event("input"));
 colour.querySelector('[data-mode="bands"]').click();assert.equal(colour.querySelector("#resistorValue").value,"4.7");
 const band=colour.querySelector('[data-band="0"]');band.value="green";band.dispatchEvent(new w.Event("change"));
 d.documentElement.lang="cs";d.dispatchEvent(new w.CustomEvent("shieldio-lang-change"));
 assert.equal(colour.querySelector("#resistorValue").value,"4.7");assert.equal(colour.querySelector("#resistorUnit").value,"1000");assert.equal(colour.querySelector('[data-band="0"]').value,"green");
 set("i",0);assert.match(box.querySelector('[data-calc="note"]').textContent,/proud/);
 e.close();
}
{
 let rejectLoad=true;const e=await mount(await html("index.html"),w=>{
  w.document.documentElement.lang="en";w.fetch=async()=>{if(rejectLoad)throw Error("offline");return {ok:true,json:async()=>[]};};
 }),{w,d}=e;e.run("search");
 const trigger=d.querySelector(".nav-utils .search-toggle");trigger.focus();trigger.click();await tick();await tick();
 assert.match(d.querySelector(".search-results").textContent,/Search could not load/);assert.equal(d.querySelector(".search-overlay").getAttribute("role"),"dialog");
 d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));assert.equal(d.activeElement,trigger);
 rejectLoad=false;trigger.click();await tick();await tick();assert.match(d.querySelector(".search-results").textContent,/Type a page/);
 const input=d.querySelector(".search-input");input.value="missing";input.dispatchEvent(new w.Event("input"));assert.match(d.querySelector(".search-results").textContent,/No results/);
 d.documentElement.lang="cs";d.dispatchEvent(new w.CustomEvent("shieldio-lang-change"));assert.match(d.querySelector(".search-results").textContent,/Nic jsem nenašel/);
 const close=d.querySelector(".search-overlay .modal-close");close.focus();const tab=new w.KeyboardEvent("keydown",{key:"Tab",shiftKey:true,bubbles:true,cancelable:true});close.dispatchEvent(tab);
 assert.equal(d.activeElement,input);assert.equal(tab.defaultPrevented,true);e.close();
}
{
 let requests=0,finish;const e=await mount(await html("index.html"),w=>{
  w.fetch=async(url,options)=>{assert.equal(url,"https://api.web3forms.com/submit");assert.equal(options.method,"POST");requests++;return new Promise(resolve=>finish=resolve);};
 }),{w,d}=e;e.run("contact-form");
 const form=d.querySelector("form.web3form"),button=form.querySelector('button[type="submit"]'),name=form.querySelector('input[name="jmeno"]');
 const language=(lang,label)=>{d.documentElement.lang=lang;button.textContent=label;d.dispatchEvent(new w.CustomEvent("shieldio-lang-change"));};
 const submit=()=>form.dispatchEvent(new w.Event("submit",{bubbles:true,cancelable:true}));
 language("en","Send message");name.value="Test";submit();submit();assert.equal(requests,1,"Repeated submission shares the in-flight request");
 assert.equal(button.textContent,"Sending…");language("cs","Odeslat zprávu");assert.equal(button.textContent,"Odesílání…");
 finish({ok:false,json:async()=>({success:false})});await tick();await tick();assert.equal(name.value,"Test","Failure retains the draft");assert.equal(button.textContent,"Odeslat zprávu");
 assert.equal(d.querySelector('[role="dialog"]').getAttribute("aria-modal"),"true");assert.equal(d.activeElement,d.querySelector(".modal-close"));
 d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));assert.equal(d.activeElement,button);
 language("en","Send message");submit();finish({ok:true,json:async()=>({success:true})});await tick();await tick();
 assert.equal(button.textContent,"Send message");assert.equal(name.value,"");assert.match(d.querySelector("#form-feedback-title").textContent,/Message sent/);
 language("cs","Odeslat zprávu");assert.match(d.querySelector("#form-feedback-title").textContent,/Zpráva odeslána/);e.close();
}
console.log("Interactions: PWM endpoints and retained values, cross-tab theme events, valid kΩ formulae, translated search/retry/focus, and mocked form success/failure/language changes passed.");
