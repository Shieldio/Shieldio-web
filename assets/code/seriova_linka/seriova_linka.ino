// Classic Arduino Uno R3 / Nano and Shieldio RED (ATmega328P).
// A0 is sampled for the plotter. Commands 1/0 control the module's built-in LED.
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  while (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '1') {
      digitalWrite(LED_BUILTIN, HIGH);
      Serial.println(F("LED on"));
    } else if (command == '0') {
      digitalWrite(LED_BUILTIN, LOW);
      Serial.println(F("LED off"));
    }
    // LF/CR from the monitor are ignored.
  }
  Serial.print(F("A0:"));
  Serial.println(analogRead(A0));
  delay(100); // C++ uses milliseconds: 100 ms = 0.1 s.
}
