import test from 'node:test';
import assert from 'node:assert/strict';
import {speedFromSlider,sliderFromSpeed,speedLabel,adaptiveSpeed} from '../speed-control.mjs';
const source=f=>({components:[{type:'vac',params:{frequency:f}}]});
test('Speed dial is logarithmic around one period per second, including GHz',()=>{for(const f of [25,1000,1e9,1e10]){const p=source(f);assert.ok(Math.abs(speedFromSlider(p,0)*f-1)<1e-12);assert.ok(Math.abs(speedFromSlider(p,-1)*f-.1)<1e-12);assert.ok(Math.abs(speedFromSlider(p,1)*f-10)<1e-12);assert.equal(speedLabel(p,adaptiveSpeed(p)),'1 period/s');}});
test('Dial inverse and absolute bounds remain finite for nonperiodic sources',()=>{const p={components:[]};for(const x of [-2,-1,0,1])assert.ok(Math.abs(sliderFromSpeed(p,speedFromSlider(p,x))-x)<1e-12);assert.equal(speedFromSlider(p,-999),.01);assert.equal(speedFromSlider(p,999),10);assert.equal(speedLabel(p,1),'1 s / s');});
