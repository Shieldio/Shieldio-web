// Shieldio RED: ultrasonic scanner, NOT a radio radar.
// Requires HC-SR04 mounted on the servo, flexible wires and adequate servo power.
#include <Wire.h>
#include <Servo.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>

const uint8_t TRIG_PIN = 7, ECHO_PIN = 8, SERVO_PIN = 9;
const uint8_t OLED_ADDRESS = 0x3C;
const int MIN_ANGLE = 30, MAX_ANGLE = 150, STEP_ANGLE = 5;
const uint8_t POINT_COUNT = (MAX_ANGLE - MIN_ANGLE) / STEP_ANGLE + 1;
const uint16_t RANGE_CM = 100;
const float RADIUS_PX = 45.0f;
// Set to -1 if the servo's physical left/right direction is mirrored.
const int8_t X_DIRECTION = 1;
uint16_t distances[POINT_COUNT]; // 0 = no valid point; only the latest sample per angle.
int angle = MIN_ANGLE, direction = STEP_ANGLE;
Servo scanner;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool oledReady = false;

float measureCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (!duration) return -1.0f;
  float cm = duration * 0.0343f / 2.0f;
  return (cm >= 2.0f && cm <= 400.0f) ? cm : -1.0f;
}

void drawScan(float cm) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(angle); display.print(F(" deg "));
  if (cm < 0) display.print(F("--")); else display.print(cm, 0);
  display.print(F("cm"));
  // Origin at (64,63); arcs are clipped at the bottom of the display.
  display.drawCircle(64, 63, 45, SSD1306_WHITE);
  display.drawCircle(64, 63, 22, SSD1306_WHITE);
  display.drawLine(19, 63, 109, 63, SSD1306_WHITE);
  for (uint8_t i = 0; i < POINT_COUNT; i++) {
    if (!distances[i]) continue;
    float a = (MIN_ANGLE + i * STEP_ANGLE) * DEG_TO_RAD;
    float r = distances[i] * RADIUS_PX / RANGE_CM;
    int x = 64 + X_DIRECTION * lroundf(r * cos(a));
    int y = 63 - lroundf(r * sin(a));
    display.fillCircle(x, y, 1, SSD1306_WHITE);
  }
  float a = angle * DEG_TO_RAD;
  display.drawLine(64, 63, 64 + X_DIRECTION * lroundf(RADIUS_PX * cos(a)),
                   63 - lroundf(RADIUS_PX * sin(a)), SSD1306_WHITE);
  display.display();
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  Serial.begin(115200);
  Wire.begin();
  Wire.beginTransmission(OLED_ADDRESS);
  oledReady = Wire.endTransmission() == 0;
  if (oledReady) oledReady = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  if (!oledReady) Serial.println(F("OLED unavailable; serial output remains active."));
  scanner.attach(SERVO_PIN);
  scanner.write(90); // Fit the sensor facing forward at this position, with power off.
  delay(1500);
  scanner.write(MIN_ANGLE);
  delay(600); // Let the first large movement settle.
  Serial.println(F("angle_deg,distance_cm"));
}

void loop() {
  scanner.write(angle);
  delay(120); // Settle the mechanism; also separates ultrasonic bursts.
  float cm = measureCm();
  uint8_t index = (angle - MIN_ANGLE) / STEP_ANGLE;
  distances[index] = (cm >= 2 && cm <= RANGE_CM) ? (uint16_t)(cm + 0.5f) : 0;
  Serial.print(angle); Serial.print(','); Serial.println(cm, 1);
  drawScan(cm);
  if (angle >= MAX_ANGLE) direction = -STEP_ANGLE;
  if (angle <= MIN_ANGLE) direction = STEP_ANGLE;
  angle += direction;
}
