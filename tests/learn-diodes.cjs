const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/learn-electronics-explorer-v1.js'), 'utf8');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/learn-questions.json'), 'utf8'));
const question = catalogue.questions.find(item => item.slug === 'elektronika-02-polovodicove-prechody-a-diody');

assert.equal(question.status, 'complete');
for (const term of [
  'Polovodič typu P a N', 'Vznik přechodu PN', 'Propustná a závěrná polarizace',
  'katodová čára', 'Voltampérová charakteristika', 'opakované špičkové', 'střední propustný', 'neopakovatelný',
  'germaniová', 'Schottkyho', 'Zener', 'fotodioda', 'PIN', 'varikap', 'tunelová',
  'Graetzův můstek', 'optický výkon', 'Měření diody multimetrem', 'Pracovní bod diody'
]) assert.ok(source.includes(term), `chybí ${term}`);

assert.ok(source.includes("question.number==='02'"), 'chybí živá aktualizace simulace');
assert.ok(source.includes('deepGraphic(question.number,current,value)'), 'graf nedostává hodnotu posuvníku');
assert.ok(source.includes('M305 110v160M305 190h20M325 190L455 115v150z'), 'značka nemá katodovou čáru nebo správnou orientaci');
assert.ok(source.includes("question.number==='02'&&current===4"), 'zbytečné posuvníky nejsou omezené pouze na VA simulaci');
console.log('Polovodiče a diody OK: 13 tematických kapitol, značky, Graetzův můstek a živá VA simulace');
