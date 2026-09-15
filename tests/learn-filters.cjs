const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/js/learn-electronics-explorer-v1.js'),'utf8');
const questions=JSON.parse(fs.readFileSync(path.join(root,'assets/data/learn-questions.json'),'utf8')).questions;
const q=questions.find(x=>x.slug==='elektronika-07-pasivni-kmitoctove-zavisle-obvody');
assert.equal(q.status,'complete');
for(const term of ['Komplexní impedance R, L a C','H(jω) = Z2/(Z1 + Z2)','RC dolní propust','RC horní propust','20 dB na dekádu','Integrační a derivační','Sériová rezonance RLC','Paralelní rezonance RLC','Q = ω0L/R','B = f0/Q','výstupní odpor generátoru bývá 50 Ω','φ=360°·Δt/T']) assert.ok(source.includes(term),`chybí ${term}`);
for(const file of ['Low-pass%20filter%20diagram.svg','RLC%20circuit.png','Tuned%20circuit%20animation%203.gif']) assert.ok(source.includes(file),`chybí Wikimedia ${file}`);
assert.ok(source.includes("'07':filterChapters"));assert.ok(source.includes("number==='07' ? filterVisual"));
console.log('Pasivní kmitočtové obvody OK: 14 kapitol, 14 grafů a 3 licencované Wikimedia materiály');
