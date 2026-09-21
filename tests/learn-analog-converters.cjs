const fs = require('fs');
const assert = require('assert');

const data = JSON.parse(fs.readFileSync('assets/data/learn-questions.json', 'utf8'));
const script = fs.readFileSync('assets/js/learn-electronics-explorer-v1.js', 'utf8');
const question = data.questions.find(item => item.slug === 'elektronika-15-analogove-merici-prevodniky-elektrickych-velicin');

assert(question, 'Otázka 15 musí existovat');
assert.strictEqual(question.status, 'complete');
assert(script.includes('const converterChapters = ['));
assert(script.includes('const converterDetails = ['));
assert(script.includes('const converterVisual = chapter =>'));
assert(script.includes("'15':converterChapters"));
assert(script.includes("number==='15' ? converterVisual(chapter)"));
assert(script.includes("'02','05','06','07','14','15'"), 'Otázka 15 nesmí zobrazovat obecný posuvník');

for (const phrase of ['R<sub>P</sub> = (U − U<sub>N</sub>)/I<sub>N</sub>', 'R<sub>B</sub> = R<sub>N</sub>I<sub>N</sub>/(I − I<sub>N</sub>)', 'Ayrtonův bočník', 'Graetzův můstek', 'činitele tvaru 1,1107', 'Aktivní přesný usměrňovač']) {
  assert(script.includes(phrase), `Chybí téma: ${phrase}`);
}

const chapters = script.match(/const converterChapters = \[(.*?)\n  \];/s);
const visuals = script.match(/const converterVisual = chapter => \{(.*?)\n  \};/s);
assert(chapters && (chapters[1].match(/^    \['/gm) || []).length >= 14);
assert(visuals && (visuals[1].match(/svg\('/g) || []).length >= 14);
console.log('Analogové měřicí převodníky: OK');
