const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/js/learn-electronics-completion-v1.js', 'utf8'), context);
const pack = context.window.ShieldioElectronicsCompletion;
const data = JSON.parse(fs.readFileSync('assets/data/learn-questions.json', 'utf8'));

assert(pack && pack.chapters && pack.examples, 'Balík dokončených otázek musí být dostupný');
for (let number = 17; number <= 25; number += 1) {
  const key = String(number);
  assert.strictEqual(pack.chapters[key].length, 10, `Otázka ${key} musí mít 10 kapitol`);
  assert.strictEqual(pack.examples[key].length, 10, `Otázka ${key} musí mít 10 příkladů`);
  const question = data.questions.find(item => item.subject === 'elektronika' && item.number === key);
  assert(question, `Otázka ${key} musí být v katalogu`);
  assert.strictEqual(question.status, 'complete', `Otázka ${key} musí být označena jako dokončená`);
}

console.log('Elektronika 17–25: 90 kapitol a 90 příkladů OK');
