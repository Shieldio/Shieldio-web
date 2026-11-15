
#include <Arduino.h>
#include <Wire.h>
#include <Servo.h>
#include <ShieldioDisplay.h>

// =====================================
// SHIELDIO RED EXPERIENCE V9
// Jednorazove interaktivni demo
// =====================================

const byte LED_RED = 5;
const byte LED_GREEN = 6;
const byte TRIG_PIN = 7;
const byte ECHO_PIN = 8;
const byte SERVO_PIN = 9;
const byte BUZZER_PIN = 10;
const byte BUTTON_1 = 11;
const byte BUTTON_2 = 12;

ShieldioDisplay display;
Servo gate;

// Deklarace funkci
void drawPage();
void enterPage(byte p);
void finishDemo();

// =====================================
// SERVO - ZAVORA
// =====================================

// Rozsah prikazu 90 stupnu.
// Zavreno = 0, otevreno = 90.
// Skutecny mechanicky rozsah
// zavisi na konkretnim servu.

const int GATE_CLOSED = 0;
const int GATE_OPEN = 90;
const unsigned long SERVO_STEP_MS = 25;

int servoAngle = GATE_CLOSED;
int servoTarget = GATE_CLOSED;

bool servoActive = false;
byte gatePhase = 0;

unsigned long lastServoStep = 0;
unsigned long gateWaitUntil = 0;
unsigned long lastServoDraw = 0;

// =====================================
// PRUBEH DEMA
// =====================================

// 0 uvodni web
// 1 objevuj
// 2 LED
// 3 hudba
// 4 zavora
// 5 parkovaci senzor
// 6 zaverecna vyzva
// 7 programovani - konec

byte page = 0;
byte ledMode = 0;

bool previousB1 = HIGH;
bool previousB2 = HIGH;

unsigned long lastButton = 0;
unsigned long lastBlink = 0;
bool blinkState = false;

// =====================================
// SENZOR
// =====================================

long distanceCm = -1;
unsigned long lastDistance = 0;
unsigned long lastParkingBeep = 0;
bool parkingContinuous = false;

// =====================================
// HUDBA
// =====================================

const int melody[] = {
  523, 659, 784, 1047,
  988, 784, 659, 523,
  587, 698, 880, 1175,
  1047, 784, 659, 523
};

const byte MELODY_COUNT =
  sizeof(melody) / sizeof(melody[0]);

bool melodyActive = false;
byte melodyPosition = 0;
unsigned long nextMelodyNote = 0;

// =====================================
// ZAKLADNI FUNKCE
// =====================================

void setLED(bool red, bool green) {
  digitalWrite(LED_RED, red ? HIGH : LOW);
  digitalWrite(LED_GREEN, green ? HIGH : LOW);
}

void show(const char* a,
          const char* b = "",
          const char* c = "") {
  display.clear();
  display.text(0, 0, a);
  display.text(0, 3, b);
  display.text(0, 6, c);
  display.render();
}

void beep(int frequency, int duration) {
  tone(BUZZER_PIN, frequency, duration);
}

void stopSound() {
  noTone(BUZZER_PIN);
}

// =====================================
// STARTOVACI LOADING
// =====================================

void showLoading(byte percent) {
  char bar[11];

  byte filled = percent / 10;

  for (byte i = 0; i < 10; i++) {
    bar[i] = i < filled ? '#' : '-';
  }

  bar[10] = '\0';

  char value[17];

  snprintf(
    value, sizeof(value),
    "%u%%",
    (unsigned int)percent
  );

  show("GETTING READY", bar, value);
}

void prepareGate() {
  showLoading(0);

  // Prvni pohyb muze byt rychly,
  // protoze nezname skutecnou
  // pocatecni polohu serva.

  gate.write(GATE_OPEN);
  gate.attach(SERVO_PIN);
  servoAngle = GATE_OPEN;

  delay(300);

  for (int angle = GATE_OPEN;
       angle >= GATE_CLOSED;
       angle--) {

    gate.write(angle);
    servoAngle = angle;

    byte percent = map(
      angle,
      GATE_OPEN,
      GATE_CLOSED,
      0,
      100
    );

    if (angle % 3 == 0 ||
        angle == GATE_CLOSED) {
      showLoading(percent);
    }

    delay(SERVO_STEP_MS);
  }

  servoAngle = GATE_CLOSED;
  servoTarget = GATE_CLOSED;

  showLoading(100);
  delay(400);
}

// =====================================
// MELODIE
// =====================================

void startMelody() {
  stopSound();
  melodyActive = true;
  melodyPosition = 0;
  nextMelodyNote = 0;
}

void stopMelody() {
  melodyActive = false;
  stopSound();
}

void updateMelody(unsigned long now) {
  if (!melodyActive) return;

  if ((long)(now - nextMelodyNote) < 0)
    return;

  if (melodyPosition >= MELODY_COUNT) {
    stopMelody();
    setLED(false, false);
    return;
  }

  beep(melody[melodyPosition], 130);

  setLED(
    melodyPosition % 2 == 0,
    melodyPosition % 2 != 0
  );

  melodyPosition++;
  nextMelodyNote = now + 175;
}

// =====================================
// ZAVORA
// =====================================

void startGate() {
  if (servoActive) return;

  if (servoAngle != GATE_CLOSED) {
    gatePhase = 3;
    servoTarget = GATE_CLOSED;
  } else {
    gatePhase = 1;
    servoTarget = GATE_OPEN;
  }

  servoActive = true;
  lastServoStep = millis();
}

void updateGate(unsigned long now) {
  if (!servoActive) return;

  if (gatePhase == 2) {
    if ((long)(now - gateWaitUntil) < 0)
      return;

    gatePhase = 3;
    servoTarget = GATE_CLOSED;
  }

  if (now - lastServoStep < SERVO_STEP_MS)
    return;

  lastServoStep = now;

  if (servoAngle < servoTarget)
    servoAngle++;
  else if (servoAngle > servoTarget)
    servoAngle--;

  gate.write(servoAngle);

  setLED(
    servoAngle < 45,
    servoAngle >= 45
  );

  if (now - lastServoDraw >= 180) {
    lastServoDraw = now;

    char value[17];
    snprintf(
      value, sizeof(value),
      "UHEL %d", servoAngle
    );

    show(
      "ZAVORA",
      value,
      gatePhase == 1
        ? "OTEVIRAM"
        : gatePhase == 2
          ? "OTEVRENO"
          : "ZAVIRAM"
    );
  }

  if (servoAngle == servoTarget) {

    if (gatePhase == 1) {
      gatePhase = 2;
      gateWaitUntil = now + 900;

      show(
        "ZAVORA",
        "OTEVRENO 90",
        "CEKEJ..."
      );
    }

    else if (gatePhase == 3) {
      servoActive = false;
      gatePhase = 0;

      setLED(false, true);

      show(
        "ZAVORA",
        "ZAVRENO 0",
        "B1=ZNOVU B2=DAL"
      );
    }
  }
}

// =====================================
// ULTRAZVUK
// =====================================

long readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration =
    pulseIn(ECHO_PIN, HIGH, 12000UL);

  if (duration == 0)
    return -1;

  return duration / 58UL;
}

// =====================================
// PARKOVACI SENZOR
// =====================================

void updateParking(unsigned long now) {

  if (now - lastDistance >= 180) {
    lastDistance = now;
    distanceCm = readDistance();

    char value[17];

    if (distanceCm < 0 ||
        distanceCm > 200) {

      setLED(false, false);

      show(
        "PARKOVACI SENZOR",
        "BEZ ODEZVY",
        "B2 = DALSI"
      );
    }
    else {
      snprintf(
        value, sizeof(value),
        "%ld cm", distanceCm
      );

      if (distanceCm < 15)
        setLED(true, false);
      else if (distanceCm < 30)
        setLED(true, true);
      else
        setLED(false, true);

      show(
        "VZDALENOST",
        value,
        "B2 = DALSI"
      );
    }
  }

  if (distanceCm < 0 ||
      distanceCm > 60) {

    stopSound();
    parkingContinuous = false;
    return;
  }

  if (distanceCm < 15) {
    if (!parkingContinuous) {
      tone(BUZZER_PIN, 1500);
      parkingContinuous = true;
    }
    return;
  }

  if (parkingContinuous) {
    stopSound();
    parkingContinuous = false;
    lastParkingBeep = 0;
  }

  unsigned long interval =
    distanceCm < 30 ? 300 : 700;

  if (now - lastParkingBeep >= interval) {
    lastParkingBeep = now;
    beep(1200, 75);
  }
}

// =====================================
// OBRAZOVKY
// =====================================

void drawPage() {

  switch (page) {

    case 0:
      show(
        "SHIELDIO RED",
        "shieldio.cz/",
        "start B1=START"
      );
      break;

    case 1:
      show(
        "OBJEVUJ!",
        "ELEKTRONIKU",
        "B2 = DALSI"
      );
      break;

    case 2:
      show(
        "1. LED",
        "B1 = ROZSVIT",
        "B2 = DALSI"
      );
      break;

    case 3:
      show(
        "2. ZVUK",
        "B1 = ZAHRAJ",
        "B2 = DALSI"
      );
      break;

    case 4:
      show(
        "3. ZAVORA",
        "B1 = OTEVRI",
        "B2 = DALSI"
      );
      break;

    case 5:
      show(
        "4. SENZOR",
        "PRIBLIZ RUKU",
        "B2 = DALSI"
      );
      break;

    case 6:
      show(
        "TED JSI NA RADE!",
        "NAPROGRAMUJ",
        "VLASTNI PROJEKT"
      );
      break;

    case 7:
      show(
        "ZACNI TVORIT",
          "A EXPERIMENTOVAT",
        "shieldio.cz"
       
       
      );
      break;
  }
}

// =====================================
// PRECHOD MEZI STRANKAMI
// =====================================

void enterPage(byte nextPage) {
  stopMelody();
  stopSound();

  parkingContinuous = false;
  distanceCm = -1;

  setLED(false, false);

  page = nextPage;
  ledMode = 0;

  lastDistance = 0;
  lastParkingBeep = millis();
  lastBlink = millis();

  drawPage();

  // Zadny zvuk na posledni strance
  if (page != 7)
    beep(1100, 55);
}

// =====================================
// ZAVERECNA ANIMACE
// =====================================

void finishDemo() {
  stopMelody();
  stopSound();

  // Kratke rozlouceni
  for (byte i = 0; i < 3; i++) {
    setLED(true, false);
    beep(650 + i * 180, 110);
    delay(170);

    setLED(false, true);
    delay(170);
  }

  setLED(false, false);

  // Trvale zobrazit programovani
  enterPage(7);
}

// =====================================
// B1 - AKCE
// =====================================

void onB1() {

  switch (page) {

    case 0:
      enterPage(1);
      break;

    case 2:
      ledMode = (ledMode + 1) % 4;

      if (ledMode == 0) {
        setLED(false, false);
        show(
          "LED",
          "VYPNUTO",
          "B1 = ZMEN"
        );
      }
      else if (ledMode == 1) {
        setLED(true, false);
        show(
          "LED",
          "CERVENA",
          "B1 = ZMEN"
        );
      }
      else if (ledMode == 2) {
        setLED(false, true);
        show(
          "LED",
          "ZELENA",
          "B1 = ZMEN"
        );
      }
      else {
        setLED(true, true);
        show(
          "LED",
          "OBE LED",
          "B2 = DALSI"
        );
      }
      break;

    case 3:
      startMelody();
      break;

    case 4:
      startGate();
      break;

    // Zadna akce na konci
    case 6:
    case 7:
      break;
  }
}

// =====================================
// B2 - DALSI
// =====================================

void onB2() {

  if (page == 0 || page == 7)
    return;

  // Nedovolime odejit pri
  // pohybu zavory.
  if (servoActive)
    return;

  if (page == 6) {
    finishDemo();
    return;
  }

  enterPage(page + 1);
}

// =====================================
// SETUP
// =====================================

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);

  pinMode(BUTTON_1, INPUT_PULLUP);
  pinMode(BUTTON_2, INPUT_PULLUP);

  digitalWrite(TRIG_PIN, LOW);
  setLED(false, false);

  Wire.begin();
  display.begin();

  prepareGate();

  previousB1 = digitalRead(BUTTON_1);
  previousB2 = digitalRead(BUTTON_2);

  enterPage(0);
}

// =====================================
// LOOP
// =====================================

void loop() {

  // Konec dema:
  // nic se neopakuje.
  if (page == 7)
    return;

  unsigned long now = millis();

  bool b1 = digitalRead(BUTTON_1);
  bool b2 = digitalRead(BUTTON_2);

  if (previousB1 == HIGH &&
      b1 == LOW &&
      now - lastButton > 220) {

    lastButton = now;
    onB1();
  }

  if (previousB2 == HIGH &&
      b2 == LOW &&
      now - lastButton > 220) {

    lastButton = now;
    onB2();
  }

  previousB1 = b1;
  previousB2 = b2;

  updateMelody(now);
  updateGate(now);

  if (page == 5) {
    updateParking(now);
    return;
  }

  // Uvitaci animace a LED
  if (now - lastBlink >= 450) {
    lastBlink = now;
    blinkState = !blinkState;

    if (page == 0 ||
        page == 1) {

      setLED(
        blinkState,
        !blinkState
      );
    }

    if (page == 2 &&
        ledMode == 0) {

      setLED(blinkState, false);
    }
  }
}
