import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/simulation.mjs';
test('Worker poskytuje zdraví aplikace bez ukládání projektů', async()=>{
 const r=await worker.fetch(new Request('https://simulation.shieldio.cz/api/health'),{});
 assert.equal(r.status,200);assert.equal((await r.json()).status,'ok');
});
test('Worker zachová asset a nastaví ochranu pro WASM a lokální soubory',async()=>{
 const r=await worker.fetch(new Request('https://simulation.shieldio.cz/'),{ASSETS:{fetch:async()=>new Response('<html>test</html>',{headers:{'Content-Type':'text/html'}})}});
 assert.equal(await r.text(),'<html>test</html>');assert.match(r.headers.get('Content-Security-Policy'),/wasm-unsafe-eval/);assert.equal(r.headers.get('Cache-Control'),'no-cache');
});
test('Worker odmítá mutace a zachová chybějící asset jako 404',async()=>{
 assert.equal((await worker.fetch(new Request('https://simulation.shieldio.cz/',{method:'POST'}),{})).status,405);
 assert.equal((await worker.fetch(new Request('https://simulation.shieldio.cz/missing'),{ASSETS:{fetch:async()=>new Response('missing',{status:404})}})).status,404);
});
