import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Extract the pinned npm package into AVR_TOOLCHAIN_DIR to run real offline WASM builds.
test('AVR GCC compiles RED peripherals and example projects, and rejects invalid C++', { skip: !process.env.AVR_TOOLCHAIN_DIR }, async () => {
  const toolchain = path.resolve(process.env.AVR_TOOLCHAIN_DIR);
  const originalFetch = globalThis.fetch;
  const cdn = 'https://cdn.jsdelivr.net/npm/@horang-corp/avr-gcc-wasm@0.2.0/';
  const source = (await fs.readFile(new URL('../assets/js/avr-compiler.mjs', import.meta.url), 'utf8'))
    .replaceAll(cdn+'tools/', pathToFileURL(toolchain+'/tools/').href)
    .replace('./arduino-libraries.mjs', new URL('../assets/js/arduino-libraries.mjs',import.meta.url).href);
  globalThis.fetch = async (input, options) => {
    if (String(input).startsWith(cdn)) return new Response(await fs.readFile(path.join(toolchain, String(input).slice(cdn.length))));
    return originalFetch(input, options);
  };
  try {
    const { buildFirmware, SENSOR } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    const programs = {
      LED: 'void setup(){pinMode(5,OUTPUT);} void loop(){digitalWrite(5,HIGH);delay(500);digitalWrite(5,LOW);delay(500);}',
      servo: '#include <Servo.h>\nServo s; void setup(){s.attach(9);} void loop(){s.write(90);}',
      OLED: '#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 d(128,64,&Wire,-1); void setup(){d.begin(SSD1306_SWITCHCAPVCC,0x3C);} void loop(){d.clearDisplay();d.print("RED");d.display();}',
      Nano: 'static_assert(NUM_ANALOG_INPUTS == 8, "Nano has 8 analog inputs"); void setup(){} void loop(){analogRead(A7);}',
    };
    for (const project of ['digitalni_metr','ultrazvukovy_radar','zviratko']) programs[project] = await fs.readFile(new URL(`../assets/code/${project}/${project}.ino`, import.meta.url), 'utf8');
    if (process.env.BLOCKLY_FIXTURES) Object.assign(programs,Object.fromEntries(Object.entries(JSON.parse(await fs.readFile(process.env.BLOCKLY_FIXTURES,'utf8'))).map(([name,source])=>['blocks_'+name,source])));
    const display = JSON.parse(await fs.readFile(new URL('../assets/arduino/ShieldioDisplay.json',import.meta.url),'utf8'));
    for (const [name, sketch] of Object.entries(programs)) {
      const result = await buildFirmware({ source:'#include <Arduino.h>\n'+sketch, sensors: sketch.includes('Adafruit_SSD1306.h') ? [SENSOR.OLED] : [], libraries:sketch.includes('ShieldioDisplay.h')?[display]:[] });
      assert.ok(result.fitsTarget && result.hex.endsWith(':00000001FF\r\n'),name);
      assert.ok(result.ramBytes + (sketch.includes('SSD1306.h') ? 1024 : 0) < 2048,name);
      assert.equal(result.target.board,'arduino:avr:nano:cpu=atmega328');
      console.log(`${name}: ${result.flashBytes} B flash, ${result.ramBytes} B static RAM`);
    }
    const wrapper = {name:'Wrapper',files:[{path:'src/Wrapper.h',content:'#pragma once\n#include <Servo.h>\nvoid useServo();'},{path:'src/nested/Wrapper.cpp',content:'#include "../Wrapper.h"\nServo wrapped; void useServo(){wrapped.attach(9);wrapped.write(90);}'}]};
    const custom = await buildFirmware({source:'#include <Arduino.h>\n#include <Wrapper.h>\nvoid setup(){useServo();} void loop(){}',libraries:[wrapper]});
    assert.ok(custom.fitsTarget && custom.flashBytes>0,'Custom C++ source links with transitive Servo dependency');
    const headers = await buildFirmware({source:'#include <Arduino.h>\n#include <Header.h>\nvoid setup(){pinMode(value(),OUTPUT);} void loop(){}',libraries:[{name:'Header',files:[{path:'Header.h',content:'inline int value(){return 5;}'}]}]});
    assert.ok(headers.fitsTarget,'Header-only library compiles');
    const shieldio = await buildFirmware({source:'#include <Arduino.h>\n#include <ShieldioDisplay.h>\nShieldioDisplay d; void setup(){d.begin();d.text(0,0,"Test");d.render();} void loop(){}',libraries:[display]});
    assert.ok(shieldio.fitsTarget && shieldio.ramBytes<1024,'ShieldioDisplay fits Nano and avoids a 1024 B framebuffer');
    await assert.rejects(buildFirmware({source:'#include <Arduino.h>\nvoid setup(){BROKEN;} void loop(){}'}),/BROKEN/);
  } finally { globalThis.fetch = originalFetch; }
});

