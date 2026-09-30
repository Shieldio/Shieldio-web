const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
for (const file of [
  'assets/js/learn-automation-foundations-data-v1.js',
  'assets/js/learn-automation-pack-v1.js',
  'assets/js/learn-automation-completion-v1.js'
]) vm.runInContext(fs.readFileSync(file, 'utf8'), context);

const lessons = {
  ...context.window.ShieldioAutomationFoundations,
  ...context.window.ShieldioAutomationPacks
};
for (const [slug, lesson] of Object.entries(lessons)) {
  assert.ok(lesson.chapters.length >= 10, `${slug} má jen ${lesson.chapters.length} kapitol`);
}

for (const number of ['09','10','11','12','14','15','16','17','19','20','21','22']) {
  assert.equal(context.window.ShieldioAutomationCompletionExamples[number]?.length, 10, `automatizace ${number} nemá 10 příkladů`);
}

const catalogue = JSON.parse(fs.readFileSync('assets/data/learn-questions.json', 'utf8'));
const automation = catalogue.questions.filter(question => question.subject === 'automatizace');
assert.equal(automation.length, 25);
assert.ok(automation.every(question => question.status === 'complete'));

console.log(`Automatizace: ${Object.keys(lessons).length} interaktivních lekcí s nejméně 10 kapitolami; katalog 25/25 hotový.`);
