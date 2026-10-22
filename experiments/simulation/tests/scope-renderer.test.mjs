import test from 'node:test';
import assert from 'node:assert/strict';
import {stepSensitivity,axisRange,zoomTimeWindow} from '../scope-renderer.mjs';
test('Eight physical divisions exactly equal eight sensitivity settings',()=>{for(const v of [1e-12,.002,.2,1,5,20]){const r=axisRange(v,1.5);assert.ok(Math.abs((r.max-r.min)/8-v)<v*1e-12);}});
test('Zoom in and out retains exact 1–2–5 setting without cumulative drift',()=>{for(const start of [1e-12,.002,.2,1,5,20]){let s=start;for(let i=0;i<100;i++){s=stepSensitivity(s,-1);s=stepSensitivity(s,1);}assert.ok(Math.abs(s-start)<start*1e-12);}});
test('Time zoom stays near absolute time after long continuous acquisition',()=>{const r=zoomTimeWindow({start:123.4,span:.08,anchor:.5,first:123.2,latest:123.6,step:1e-5,direction:-1});assert.ok(r.start>123.4&&r.start<123.45);assert.ok(Math.abs(r.span-.04)<1e-10);assert.ok(Math.abs(r.start+r.span*.5-(123.4+.08*.5))<1e-10);});
test('Zoom handles nanosecond spans and retained-buffer boundaries',()=>{const r=zoomTimeWindow({start:2e-9,span:8e-10,first:1e-9,latest:4e-9,step:1e-13,direction:-1});assert.ok(r.start>=1e-9&&r.start+r.span<=4e-9);assert.ok(r.span>=8e-13);});
