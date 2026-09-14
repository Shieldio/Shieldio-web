const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
for (const file of ['learn-transient-data-v1.js','learn-transient-schematics-v3.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),context);
}
const chapters = context.window.ShieldioTransientData.chapters;
for (const id of ['rc-nabijeni','rc-vybijeni','rl-zapinani','rl-vypinani']) {
  const chapter=chapters.find(item=>item.id===id);
  assert.ok(chapter.html.includes('tr-circuit-v3'),`${id}: nové schéma`);
  assert.ok(chapter.html.includes('Průběhy napětí a proudu'),`${id}: všechny průběhy`);
  assert.ok(chapter.html.includes('u_R(t)'),`${id}: napětí na rezistoru`);
}
assert.ok(chapters[0].html.includes('data-tr-signals'));
assert.ok(chapters[0].html.includes('\\delta(t)'));
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/data/learn-questions.json'),'utf8'));
const question=data.questions.find(item=>item.slug==='automatizace-04-jednocipovy-mikropocitac-casovace-citace-a-seriove-rozhran');
assert.equal(question.status,'complete');
assert.equal(question.sections.length,12);
for(const term of ['prescaler','PWM','UART','SPI','I²C','input capture','8N1']) assert.ok(question.sections.some(section=>section.body.includes(term)),term);
console.log('Schémata, průběhy a Automatizace 04 OK');
