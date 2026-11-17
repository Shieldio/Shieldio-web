"""Exercise the real sketch with fake pins/time/display; no physical board needed."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
sketch = root / 'assets/code/zemepisny_kviz/zemepisny_kviz.ino'
with zipfile.ZipFile(root / 'assets/code/zemepisny_kviz.zip') as z:
    assert z.read('zemepisny_kviz/zemepisny_kviz.ino') == sketch.read_bytes()
with tempfile.TemporaryDirectory() as tmp:
    p = Path(tmp)
    (p / 'avr').mkdir()
    (p / 'avr/pgmspace.h').write_text('#include <cstring>\n#define PROGMEM\n#define memcpy_P memcpy\n')
    (p / 'ShieldioDisplay.h').write_text('''#include <cstdint>
#include <cstring>
#include <cassert>
#define HIGH 1
#define LOW 0
#define INPUT 0
unsigned long clockMs = 0;
uint8_t pins = 0;
unsigned long millis() { return clockMs; }
int digitalRead(uint8_t pin) { assert(pin == 11 || pin == 12); return (pins >> (pin - 11)) & 1; }
void pinMode(uint8_t pin, int mode) { assert((pin == 11 || pin == 12) && mode == INPUT); }
struct ShieldioDisplay {
  char rows[8][17] = {};
  ShieldioDisplay(uint8_t address) { assert(address == 0x3c); }
  void begin() {}
  void clear() { memset(rows, 0, sizeof rows); }
  void text(uint8_t col, uint8_t row, const char* text) {
    assert(row < 8 && col + strlen(text) <= 16);
    strcpy(rows[row] + col, text);
  }
  void render() {}
};
''')
    (p / 'test.cpp').write_text('#include "' + str(sketch) + '"\n' + r'''
void settle(uint8_t value) { pins = value; loop(); clockMs += 36; loop(); }
void press(uint8_t value) { settle(0); settle(value); }
int main() {
  static_assert(QUESTION_COUNT == 20, "Exactly 20 questions");
  pins = 1; setup(); clockMs += 40; loop();
  assert(screen == ASK && score == 0); // Startup hold ignored.
  settle(0);
  pins = 1; loop(); clockMs += 10; pins = 0; loop();
  clockMs += 40; loop(); assert(screen == ASK); // Bounce ignored.
  press(3); settle(1); assert(screen == ASK); // Both require full release.
  for (uint8_t i = 0; i < QUESTION_COUNT; ++i) {
    assert(screen == ASK && questionIndex == i);
    press(current.correct);
    assert(screen == FEEDBACK && score == i + 1);
    clockMs += 2000; loop(); assert(screen == FEEDBACK); // Hold cannot advance.
    press(2);
  }
  assert(screen == RESULT && score == 20);
  assert(strcmp(display.rows[3], "Uspesnost: 100%") == 0);
  clockMs += 1000; loop(); assert(screen == RESULT);
  press(1); assert(screen == ASK && score == 0 && questionIndex == 0);
  for (uint8_t i = 0; i < QUESTION_COUNT; ++i) {
    press(current.correct == 1 ? 2 : 1);
    assert(score == 0); press(1);
  }
  assert(screen == RESULT && strcmp(display.rows[3], "Uspesnost: 0%") == 0);
  press(2); assert(screen == ASK && score == 0 && questionIndex == 0);
}
''')
    compiler = shutil.which('c++') or shutil.which('g++')
    assert compiler, 'A C++ compiler is required'
    subprocess.run([compiler, '-std=c++11', '-Wall', '-Wextra', '-Werror', '-I', tmp, str(p / 'test.cpp'), '-o', str(p / 'test')], check=True)
    subprocess.run([str(p / 'test')], check=True)
print('Quiz: HIGH buttons, bounce, hold, simultaneous press, 20 correct/wrong answers, display bounds, score, restart and ZIP passed.')
