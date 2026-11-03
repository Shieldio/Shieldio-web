// Execute the actual Blockly-generated barrier sketch with deterministic I/O.
// This tests decision logic, not a physical sensor or servo.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const fixtures=JSON.parse(await fs.readFile(process.env.BLOCKLY_FIXTURES,'utf8'));
assert.ok(fixtures.barrierStarter);
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'shieldio-distance-'));
try {
  await fs.writeFile(path.join(dir,'Servo.h'),`#pragma once
extern int lastAngle, servoWrites;
class Servo {public: void attach(int) {} void write(int angle) {lastAngle=angle; ++servoWrites;}};
`);
  const harness=`#include <cassert>
#include <cmath>
unsigned long nowMs=0, nextEcho=0;
int pulseReads=0, lastAngle=-1, servoWrites=0;
const int LOW=0,HIGH=1,OUTPUT=1,INPUT=0;
void pinMode(int,int) {} void digitalWrite(int,int) {} void delayMicroseconds(int) {}
void delay(int ms) {nowMs+=ms;} unsigned long millis() {return nowMs;}
unsigned long pulseIn(int,int,unsigned long) {++pulseReads; return nextEcho;}
${fixtures.barrierStarter}
int main() {
  setup(); assert(lastAngle==0);
  nowMs+=60; nextEcho=1166; int before=pulseReads; loop();
  assert(pulseReads-before==1); assert(lastAngle==0); // about 20 cm
  nextEcho=583; before=pulseReads; loop();
  assert(pulseReads-before==1); assert(lastAngle==90); // about 10 cm
  nextEcho=0; int writes=servoWrites; before=pulseReads; loop();
  assert(pulseReads-before==1); assert(std::isnan(shieldioDistanceCm));
  assert(servoWrites==writes && lastAngle==90); // no echo preserves position
  nextEcho=1166; loop(); assert(lastAngle==0); // recovery after timeout
}
`;
  await fs.writeFile(path.join(dir,'test.cpp'),harness);
  execFileSync('c++',['-std=c++11','-I',dir,path.join(dir,'test.cpp'),'-o',path.join(dir,'test')],{stdio:'pipe'});
  execFileSync(path.join(dir,'test'),[],{stdio:'pipe'});
  const nested=`#include <cassert>
#include <cmath>
unsigned long nowMs=0; int pulseReads=0;
const int LOW=0,HIGH=1,OUTPUT=1,INPUT=0;
void pinMode(int,int) {} void digitalWrite(int,int) {} void delayMicroseconds(int) {}
void delay(int ms) {nowMs+=ms;} unsigned long millis() {return nowMs;}
unsigned long pulseIn(int,int,unsigned long) {return ++pulseReads < 3 ? 583 : 1166;}
${fixtures.distanceLoop}
int main() {setup(); nowMs=60; loop(); assert(pulseReads==3); assert(nowMs==120); assert(shieldioDistanceCm>15);}
`;
  await fs.writeFile(path.join(dir,'nested.cpp'),nested);
  execFileSync('c++',['-std=c++11','-I',dir,path.join(dir,'nested.cpp'),'-o',path.join(dir,'nested')],{stdio:'pipe'});
  execFileSync(path.join(dir,'nested'),[],{stdio:'pipe',timeout:5000});
  console.log('Generated barrier: timeout, near/far target, recovery and one shared sample per loop passed.');
} finally {await fs.rm(dir,{recursive:true,force:true});}
