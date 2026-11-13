// Shieldio RED: OLED SSD1306 128x64, SDA A4 / SCL A5, address 0x3C.
// Buttons D11/D12 have external pull-ups on RED; pressed = LOW.
#include <ShieldioDisplay.h>
ShieldioDisplay display;
using Animal = ShieldioDisplay::Animal;
using Mood = ShieldioDisplay::Mood;
Animal shownAnimal = Animal::Cat;
Mood shownMood = Mood::Sleepy;

void setup() {
  pinMode(11, INPUT);
  pinMode(12, INPUT);
  display.begin();
  display.face(shownAnimal, shownMood);
}

void loop() {
  // Button 2 has priority, matching the block starter.
  bool second = digitalRead(12) == LOW;
  bool first = digitalRead(11) == LOW;
  Animal animal = second ? Animal::Dog : Animal::Cat;
  Mood mood = second ? Mood::Surprised : first ? Mood::Happy : Mood::Sleepy;
  if (animal != shownAnimal || mood != shownMood) {
    display.face(animal, mood);
    shownAnimal = animal;
    shownMood = mood;
  }
  delay(100);
}
