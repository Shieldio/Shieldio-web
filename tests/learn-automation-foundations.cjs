const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/learn-questions.json'), 'utf8'));
for (const number of ['01', '02', '03', '05', '06', '07', '08', '13', '18', '24', '25']) {
  const question = catalogue.questions.find(item => item.subject === 'automatizace' && item.number === number);
  assert.equal(question.status, 'complete');
  assert.equal(question.template, 'automation-foundations');
}
const source = fs.readFileSync(path.join(root, 'assets/js/learn-automation-foundations-data-v1.js'), 'utf8');
for (const term of ['Booleova algebra', '11010₂', 'Grayově pořadí', 'don’t care', 'NAND–NAND', 'metastabilitu', 'Flash/ROM', 'Přerušení', 'T klopný obvod', 'Programování jednočipových', 'posuvný registr', 'Fuzzy řízení', 'programovatelné automaty', 'výstupní člen', 'pracovní prostor', 'Vstupní periferie', 'Výstupní zařízení']) assert.ok(source.includes(term), `chybí ${term}`);
const engine = fs.readFileSync(path.join(root, 'assets/js/learn-automation-foundations-v1.js'), 'utf8');
for (const term of ['Převodník číselných soustav', 'data-af-from-base', 'Opakované dělení', 'Vyřešený příklad krok za krokem', 'NAND–NAND realizace']) assert.ok(engine.includes(term), `chybí interaktivní část ${term}`);
console.log('Automatizace 01–03, 05–08, 13, 18, 24 a 25 OK');
