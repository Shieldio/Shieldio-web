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
for (const term of ['Booleova algebra', '11010₂', 'C4₁₆', '196₁₀', 'Y = A·C + B·¬C', 'Grayově pořadí', 'don’t care', 'NAND–NAND', 'metastabilitu', 'Flash/ROM', 'Přerušení', 'T klopný obvod', 'Programování jednočipových', 'posuvný registr', 'Fuzzy řízení', 'programovatelné automaty', 'výstupní člen', 'pracovní prostor', 'Vstupní periferie', 'Výstupní zařízení']) assert.ok(source.includes(term), `chybí ${term}`);
const engine = fs.readFileSync(path.join(root, 'assets/js/learn-automation-foundations-v1.js'), 'utf8');
for (const term of ['Převodník číselných soustav', 'data-af-from-base', 'Opakované dělení', 'Vyřešený příklad krok za krokem', 'NAND–NAND realizace', 'Logická hradla a jejich pravdivostní tabulky', 'Q = ¬(A⊕B)', 'Univerzální hradla', 'C4₁₆ = 12·16¹', 'Σm(2, 5, 6, 7)', 'Řešený příklad', 'Příklad k vypočítání', 'Zobrazit správné řešení', 'N<sub>MH</sub>', '431₁₀ = 1AF₁₆']) assert.ok(engine.includes(term), `chybí interaktivní část ${term}`);
assert.equal((engine.match(/\{title:'/g)||[]).length, 18, 'první otázka musí mít 18 řešených příkladů');
assert.ok(!engine.includes('<div class="af-exam"><b>Zkoušková věta:'), 'obecná zkoušková věta se nesmí opakovat v každé kapitole');
console.log('Automatizace 01–03, 05–08, 13, 18, 24 a 25 OK');
