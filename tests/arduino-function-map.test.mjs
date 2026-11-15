import assert from 'node:assert/strict';
import { listFunctions } from '../assets/js/arduino-source-editor.mjs';

const sketch = `// void fake() {}
const char* s = R"tag(void hidden() {})tag";
void prototype(int x);
#define MACRO(x) void macroFake() {}
void setup () { pinMode(6, OUTPUT); }
void loop() { if (true) { digitalWrite(6, HIGH); } }
static unsigned long measure(
  int pin, int value = (1 + 2)
) { return pin + value; }
const char* name() { return "void nope() {}"; }
bool Device::ready() const noexcept { return true; }
auto value() -> int { return 1; }
void unfinished(
`;
const functions = listFunctions(sketch);
assert.deepEqual(functions.map(fn => fn.name), ['setup', 'loop', 'measure', 'name', 'Device::ready', 'value']);
for (const fn of functions) {
  assert.equal(sketch.slice(fn.start, fn.start + fn.name.length), fn.name);
  assert.equal(fn.line, sketch.slice(0, fn.start).split('\n').length);
}
assert.deepEqual(listFunctions('void setup();\n// void loop() {}\n/* int hidden() {} */'), []);
assert.deepEqual(listFunctions('void setup() {}\nvoid loop() {}').map(fn => fn.line), [1, 2]);
assert.deepEqual(listFunctions('// 😀 český komentář\r\nint read()\r\n{ return 1; }').map(fn => fn.line), [2]);
assert.equal(listFunctions('int f(int (*cb)(int)) { return cb(1); }')[0].name, 'f');
console.log('Function outline: definitions, offsets, multiline parameters, qualifiers, prototypes, comments, literals and incomplete edits passed.');
