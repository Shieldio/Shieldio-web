---
name: shieldio-red-programming
description: Guide programming and local USB uploading to Shieldio RED using its browser editor and documented Arduino Nano workflow.
---

# Programming Shieldio RED

Use this skill when someone needs help creating, explaining, debugging, compiling, or uploading a program for Shieldio RED.

## Supported workflow

1. Open the [Shieldio programming editor](https://shieldio.cz/instructions/blokovy-editor.html).
2. Start with [first program and upload](https://shieldio.cz/instructions/programovani/) to check the browser, connected board, port, and example program.
3. Choose the beginner block interface or Arduino C++ in the web editor, depending on the learner's experience.
4. For the documented RED target, use the classic Arduino Nano / ATmega328P at 16 MHz. Check the specific board configuration before relying on pin assignments.
5. Compilation runs locally in the browser with AVR tools; USB upload uses the browser's Web Serial capabilities on supported desktop Chrome or Edge. No external mBlock service is required.
6. Present a small test program and explain its expected output before proposing a larger circuit or experiment.

## Safety and accuracy

- Never claim that an AI agent has physically uploaded firmware merely because it generated code.
- USB port selection, flashing, and any physical device actions must remain under explicit user control.
- Do not expose a remote compiler API or guarantee Safari USB support: neither is part of this documented workflow.
- Avoid presenting unrelated ESP32 tooling as the RED Nano upload target.
- Do not guess pin mappings or voltages; cross-check the [RED component and pin reference](https://shieldio.cz/instructions/baseline/red/prehled/).

See the [project index](https://shieldio.cz/instructions/baseline/red/) for practical assignments and [llms.txt](https://shieldio.cz/llms.txt) for site navigation.
