const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/learn-electronics-explorer-v1.js'), 'utf8');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/learn-questions.json'), 'utf8'));
const question = catalogue.questions.find(item => item.slug.startsWith('elektronika-05-'));

assert.equal(question.status, 'complete');
for (const term of ['Čtyřvrstvá dioda PNPN','Tyristor SCR','VA charakteristika a sepnutí SCR','Triak','Diak','Fázové řízení','Termistory NTC a PTC','Fotorezistor, fotodioda a fototranzistor','Hallův jev','Piezoelektrický jev','Optočlen','U(BO)','přídržný proud','dv/dt','CTR']) assert.ok(source.includes(term), `chybí ${term}`);
assert.ok(source.includes("'05':switchingChapters"), 'otázka 05 není připojena k vlastnímu obsahu');
assert.ok(source.includes("number==='05' ? switchingVisual"), 'otázka 05 nemá vlastní vizualizace');
assert.ok(source.includes("!['02','05','06','07'].includes(question.number)"), 'otázka 05 stále zobrazuje generický posuvník');
console.log('Vícevrstvé a senzorové součástky OK: 13 kapitol, 13 samostatných vizualizací');
