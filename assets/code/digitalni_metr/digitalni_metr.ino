// Shieldio RED: HC-SR04 distance meter, SSD1306 128x64 I2C OLED.
// Pin map follows the RED block editor. Check your PCB revision.
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const uint8_t TRIG_PIN = 7;
const uint8_t ECHO_PIN = 8;
const uint8_t OLED_ADDRESS = 0x3C;
const float SOUND_CM_PER_US = 0.0343f; // Approximation near 20 degrees C.
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool oledReady = false;

float measureCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1.0f; // No echo is not zero distance.
  float cm = duration * SOUND_CM_PER_US / 2.0f;
  return (cm >= 2.0f && cm <= 400.0f) ? cm : -1.0f;
}

float medianCm() {
  float readings[3];
  for (uint8_t i = 0; i < 3; i++) {
    readings[i] = measureCm();
    delay(65); // Separate ultrasonic bursts by more than 60 ms.
  }
  // Keep a missing echo visible instead of averaging it into a distance.
  for (uint8_t i = 0; i < 3; i++) if (readings[i] < 0) return -1.0f;
  if (readings[0] > readings[1]) { float t = readings[0]; readings[0] = readings[1]; readings[1] = t; }
  if (readings[1] > readings[2]) { float t = readings[1]; readings[1] = readings[2]; readings[2] = t; }
  if (readings[0] > readings[1]) { float t = readings[0]; readings[0] = readings[1]; readings[1] = t; }
  return readings[1];
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  Serial.begin(115200);
  Wire.begin();
  Wire.beginTransmission(OLED_ADDRESS);
  oledReady = Wire.endTransmission() == 0;
  if (oledReady) oledReady = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  if (!oledReady) Serial.println(F("OLED unavailable; check power, SDA=A4, SCL=A5 and address."));
  if (oledReady) { display.clearDisplay(); display.display(); }
}

void loop() {
  float cm = medianCm();
  if (cm < 0) Serial.println(F("No valid echo"));
  else { Serial.print(cm, 1); Serial.println(F(" cm")); }
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(F("SHIELDIO / METR"));
  display.setCursor(0, 24);
  display.setTextSize(2);
  if (cm < 0) display.print(F("-- cm"));
  else { display.print(cm, 1); display.print(F(" cm")); }
  display.setTextSize(1);
  display.setCursor(0, 52);
  display.print(cm < 0 ? F("Bez platneho odrazu") : F("Od cela senzoru"));
  display.display();
}
