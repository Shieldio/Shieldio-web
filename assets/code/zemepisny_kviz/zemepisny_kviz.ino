// Shieldio RED V4: SSD1306 128x64, I2C 0x3C, SDA=A4, SCL=A5.
// ShieldioDisplay 0.3.0. D11/D12: pressed=HIGH (confirmed for V4).
// Use INPUT, not INPUT_PULLUP. No LED, servo, buzzer or sensor is used.
#include <ShieldioDisplay.h>
#include <avr/pgmspace.h>
#include <stdio.h>

const uint8_t BUTTON_A = 11;
const uint8_t BUTTON_B = 12;
const unsigned long DEBOUNCE_MS = 35;
ShieldioDisplay display(0x3C);

// Each line fits the display's 16 ASCII columns. Text lives in flash.
struct Question {
  char line1[17];
  char line2[17];
  char a[15];
  char b[15];
  uint8_t correct; // 1 = A, 2 = B
};
const Question questions[] PROGMEM = {
  {"Hlavni mesto", "Francie?", "Pariz", "Rim", 1},
  {"Nejvetsi ocean", "na Zemi?", "Atlantsky", "Tichy", 2},
  {"Ve ktere zemi", "lezi Rim?", "Italie", "Spanelsko", 1},
  {"Na kterem", "svetadilu je CR?", "Asie", "Evropa", 2},
  {"Nejvyssi hora", "sveta?", "Mont Blanc", "Mount Everest", 2},
  {"Hlavni mesto", "Slovenska?", "Bratislava", "Kosice", 1},
  {"Sahara lezi", "na svetadilu?", "Australie", "Afrika", 2},
  {"Ktera reka tece", "Prahou?", "Vltava", "Dunaj", 1},
  {"Japonsko lezi", "na svetadilu?", "Asie", "Evropa", 1},
  {"Hlavni mesto", "Nemecka?", "Mnichov", "Berlin", 2},
  {"Nejvetsi stat", "podle rozlohy?", "Rusko", "Kanada", 1},
  {"Kde zije tucnak", "cisarsky?", "Arktida", "Antarktida", 2},
  {"Hlavni mesto", "Australie?", "Canberra", "Sydney", 1},
  {"Ktery stat ma", "tvar boty?", "Norsko", "Italie", 2},
  {"Nejvyssi hora", "Ceska?", "Snezka", "Praded", 1},
  {"Ktera zeme lezi", "v Jizni Americe?", "Indie", "Brazilie", 2},
  {"Hlavni mesto", "Velke Britanie?", "Londyn", "Dublin", 1},
  {"More mezi", "Evropou/Afrikou?", "Stredozemni", "Karibske", 1},
  {"Hlavni mesto", "Egypta?", "Alexandrie", "Kahira", 2},
  {"Ktery stat je", "sousedem Ceska?", "Francie", "Polsko", 2}
};
const uint8_t QUESTION_COUNT = sizeof(questions) / sizeof(questions[0]);
Question current;
enum Screen : uint8_t { ASK, FEEDBACK, RESULT };
Screen screen = ASK;
uint8_t questionIndex = 0, score = 0;
uint8_t rawButtons = 0, stableButtons = 0;
unsigned long changedAt = 0;
bool armed = false;

uint8_t readButtons() {
  return (digitalRead(BUTTON_A) == HIGH ? 1 : 0) |
         (digitalRead(BUTTON_B) == HIGH ? 2 : 0);
}

// One event per press; both buttons together are ignored until both release.
// An initial held button also requires release before the first answer.
uint8_t buttonEvent() {
  uint8_t next = readButtons();
  unsigned long now = millis();
  if (next != rawButtons) { rawButtons = next; changedAt = now; }
  if ((unsigned long)(now - changedAt) < DEBOUNCE_MS) return 0;
  stableButtons = rawButtons;
  if (stableButtons == 0) { armed = true; return 0; }
  if (!armed) return 0;
  armed = false;
  return stableButtons == 3 ? 0 : stableButtons;
}

void showScore(uint8_t row) {
  char line[17];
  snprintf(line, sizeof(line), "Skore: %u/%u", score, QUESTION_COUNT);
  display.text(0, row, line);
}

void showQuestion() {
  memcpy_P(&current, &questions[questionIndex], sizeof(current));
  char line[17];
  display.clear();
  snprintf(line, sizeof(line), "Otazka %u/%u", questionIndex + 1, QUESTION_COUNT);
  display.text(0, 0, line);
  showScore(1);
  display.text(0, 2, current.line1);
  display.text(0, 3, current.line2);
  snprintf(line, sizeof(line), "A:%s", current.a);
  display.text(0, 5, line);
  snprintf(line, sizeof(line), "B:%s", current.b);
  display.text(0, 6, line);
  display.text(0, 7, "D11=A  D12=B");
  display.render();
}

void answer(uint8_t choice) {
  bool correct = choice == current.correct;
  if (correct) ++score;
  screen = FEEDBACK;
  display.clear();
  display.text(0, 0, correct ? "Spravne!" : "Nespravne.");
  display.text(0, 2, current.correct == 1 ? "Spravne: A" : "Spravne: B");
  display.text(0, 3, current.correct == 1 ? current.a : current.b);
  showScore(5);
  display.text(0, 7, "D11/D12: dale");
  display.render();
}

void showResult() {
  screen = RESULT;
  char line[17];
  display.clear();
  display.text(0, 0, "Konec kvizu");
  showScore(2);
  snprintf(line, sizeof(line), "Uspesnost: %u%%", score * 100 / QUESTION_COUNT);
  display.text(0, 3, line);
  display.text(0, 5, score >= 16 ? "Skvela prace!" : "Zkus to znovu!");
  display.text(0, 7, "D11/D12: restart");
  display.render();
}

void setup() {
  pinMode(BUTTON_A, INPUT);
  pinMode(BUTTON_B, INPUT);
  display.begin();
  rawButtons = readButtons();
  changedAt = millis();
  showQuestion();
}

void loop() {
  uint8_t pressed = buttonEvent();
  if (!pressed) return;
  if (screen == ASK) answer(pressed);
  else if (screen == FEEDBACK) {
    if (++questionIndex == QUESTION_COUNT) showResult();
    else { screen = ASK; showQuestion(); }
  } else {
    questionIndex = 0;
    score = 0;
    screen = ASK;
    showQuestion();
  }
}
