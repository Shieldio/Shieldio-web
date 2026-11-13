---
name: shieldio-red-programming
description: Guide programming and local USB uploading to Shieldio RED using its browser editor and documented classic Uno/Nano workflow.
---

# Programming Shieldio RED

Use this skill when someone needs help creating, explaining, debugging, compiling, or uploading a program for Shieldio RED.

## Supported workflow

1. Open the [Shieldio programming editor](https://shieldio.cz/instructions/blokovy-editor.html).
2. Start with [first program and upload](https://shieldio.cz/instructions/programovani/) to check the browser, connected board, port, and example program.
3. Start in Simple mode for RED. Categories under Shieldio RED are LEDs, Buttons, Distance, Servo, Sound and Display; Display contains Text, Animals and Drawing. Waits and tone durations use seconds. Enable Advanced mode for C++, files, libraries, numeric variables and serial plotting/sending.
4. The Advanced mode Board selector supports Shieldio RED, classic Nano and Uno R3 with ATmega328P at 16 MHz. It changes compiler and upload target. Uno has A0–A5 and a 32,256-byte application limit; Nano has A0–A7 and 30,720 bytes. RED uses Nano with its fixed module pin map. Uno R4, Nano Every and Nano 33 are not supported.
5. Compilation runs locally in the browser with AVR tools; USB upload uses the browser's Web Serial capabilities on supported desktop Chrome or Edge. No external mBlock service is required.
6. Present a small test program and explain its expected output before proposing a larger circuit or experiment. ShieldioDisplay 0.3.0 is included automatically; animal faces use the small display class, shapes use ShieldioCanvas.
7. Use the [current mode guide](https://shieldio.cz/instructions/programovani/#rezimy) and [serial tutorial](https://shieldio.cz/instructions/programovani/#seriova-linka). Simple monitor infers baud from numeric Serial.begin(...), otherwise 9600. Advanced mode offers explicit baud, plotter and UTF-8 sending with LF/CRLF/no ending; the sketch must process commands.
8. Preserve legacy millisecond blocks. C++ delay()/millis() still use milliseconds even though new simple timing blocks use seconds.

## Safety and accuracy

- Never claim that an AI agent has physically uploaded firmware merely because it generated code.
- USB port selection, flashing, and any physical device actions must remain under explicit user control.
- Do not expose a remote compiler API or guarantee Safari USB support: neither is part of this documented workflow.
- Avoid presenting unrelated ESP32 tooling as the RED Nano upload target.
- Do not guess pin mappings or voltages; cross-check the [RED component and pin reference](https://shieldio.cz/instructions/baseline/red/prehled/).

See the [project index](https://shieldio.cz/instructions/baseline/red/) for practical assignments and [llms.txt](https://shieldio.cz/llms.txt) for site navigation.
