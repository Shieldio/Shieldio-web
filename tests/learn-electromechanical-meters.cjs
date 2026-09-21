const fs = require('fs');
const assert = require('assert');

const data = JSON.parse(fs.readFileSync('assets/data/learn-questions.json', 'utf8'));
const script = fs.readFileSync('assets/js/learn-electronics-explorer-v1.js', 'utf8');
const question = data.questions.find(item => item.slug === 'elektronika-14-elektromechanicke-merici-pristroje');

assert(question, 'Otázka 14 musí existovat');
assert.strictEqual(question.status, 'complete');
assert(script.includes('const meterChapters = ['));
assert(script.includes('const meterDetails = ['));
assert(script.includes('const meterVisual = chapter =>'));
assert(script.includes("'14':meterChapters"));
assert(script.includes("number==='14' ? meterVisual(chapter)"));
assert(script.includes("'02','05','06','07','14'"), 'Otázka 14 nesmí zobrazovat obecný nefunkční slider');

const chapterBlock = script.match(/const meterChapters = \[(.*?)\n  \];/s);
const visualBlock = script.match(/const meterVisual = chapter => \{(.*?)\n  \};/s);
assert(chapterBlock && (chapterBlock[1].match(/^    \['/gm) || []).length >= 14, 'Má být nejméně 14 kapitol');
assert(visualBlock && (visualBlock[1].match(/svg\('/g) || []).length >= 14, 'Každá kapitola má mít vlastní SVG');

for (const phrase of ['Pracovní a direktivní moment', 'Deprézův systém', 'termočlánkem', 'poměrový přístroj', 'Elektromagnetický přístroj', 'Elektrodynamický přístroj', 'Ferodynamický přístroj']) {
  assert(script.includes(phrase), `Chybí téma: ${phrase}`);
}

console.log('Elektromechanické měřicí přístroje: OK');
