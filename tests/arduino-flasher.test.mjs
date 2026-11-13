import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flashNano, flashArduino, parseHex, NANO_FLASH_BYTES, UNO_FLASH_BYTES } from '../assets/js/arduino-flasher.mjs';

function record(address, type, data = []) {
  const bytes = [data.length, address >> 8, address & 255, type, ...data];
  bytes.push((-bytes.reduce((a, b) => a + b, 0)) & 255);
  return ':' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}
const hex = data => record(0, 0, data) + '\n' + record(0, 1);

function board({ badSignature = false, corrupt = false, writeError = false, silent = false } = {}) {
  const state = { flash: new Uint8Array(32768).fill(255), writes: 0, closed: false, cancelled: false, baudRate: 0, commands: [] };
  let receiver, address = 0;
  const port = {
    async open(options) {
      state.baudRate = options.baudRate;
      port.readable = new ReadableStream({ start(c) { receiver = c; }, cancel() { state.cancelled = true; } });
      port.writable = new WritableStream({ write(bytes) {
        if (writeError) throw new Error('USB write failed');
        state.commands.push(bytes[0]);
        if (silent) return;
        assert.equal(bytes.at(-1), 0x20);
        let data = [];
        if (bytes[0] === 0x75) data = badSignature ? [0x1e, 0x95, 0x16] : [0x1e, 0x95, 0x0f];
        if (bytes[0] === 0x55) address = (bytes[1] | bytes[2] << 8) * 2;
        if (bytes[0] === 0x64) { state.flash.set(bytes.slice(4, -1), address); state.writes++; }
        if (bytes[0] === 0x74) { data = Array.from(state.flash.slice(address, address + 128)); if (corrupt) data[0] ^= 1; }
        // Deliberately split replies to exercise streaming reads across chunks.
        receiver.enqueue(new Uint8Array([0x14]));
        receiver.enqueue(new Uint8Array([...data, 0x10]));
      } });
    },
    async setSignals() {},
    async close() { state.closed = true; assert.equal(port.readable.locked, false); assert.equal(port.writable.locked, false); },
  };
  return { port, state };
}

test('HEX: checksum, EOF, application bounds and extended addresses are validated', () => {
  assert.deepEqual(Array.from(parseHex(hex([1,2,3])).slice(0,5)), [1,2,3,255,255]);
  assert.throws(() => parseHex(':0100000001FF\n:00000001FF'), /HEX_CHECKSUM/);
  assert.throws(() => parseHex(record(0, 0, [1])), /HEX_EMPTY/);
  assert.throws(() => parseHex(record(NANO_FLASH_BYTES, 0, [1])+'\n'+record(0,1)), /FLASH_OVERFLOW/);
  assert.throws(() => parseHex(record(0,4,[0,1])+'\n'+record(0,0,[1])+'\n'+record(0,1)), /FLASH_OVERFLOW/);
  assert.throws(() => parseHex(hex([1])+'\n'+record(0,0,[1])), /HEX_FORMAT/);
  assert.throws(() => parseHex(record(0,0,[1])+'\n'+record(0,0,[2])+'\n'+record(0,1)), /HEX_OVERLAP/);
});
for (const baudRate of [115200,57600]) test(`STK500v1 writes and verifies multiple pages at ${baudRate}`, async () => {
  const {port,state} = board();
  const program = Array.from({length:240},(_,i)=>i);
  const input = record(0,0,program.slice(0,120))+'\n'+record(120,0,program.slice(120))+'\n'+record(0,1);
  const progress = [];
  await flashNano(port,input,{baudRate,onProgress:phase=>progress.push(phase)});
  assert.equal(state.baudRate,baudRate); assert.equal(state.writes,2);
  assert.deepEqual(Array.from(state.flash.slice(0,240)),program);
  assert.equal(progress.at(-1),'done'); assert.equal(state.commands.at(-1),0x51);
  assert.ok(state.closed && state.cancelled);
});
test('a different chip is refused before writing', async () => {
  const {port,state}=board({badSignature:true});
  await assert.rejects(flashNano(port,hex([1,2])),/WRONG_CHIP/);
  assert.equal(state.writes,0); assert.ok(state.closed);
});
test('verification mismatch cannot report success',async()=>{
  const {port,state}=board({corrupt:true}); const progress=[];
  await assert.rejects(flashNano(port,hex([1,2]),{onProgress:p=>progress.push(p)}),/VERIFY_FAILED/);
  assert.ok(!progress.includes('done')); assert.ok(state.closed);
});
test('write errors release stream locks and close the USB port',async()=>{
  const {port,state}=board({writeError:true});
  await assert.rejects(flashNano(port,hex([1,2])),/USB write failed/);
  assert.ok(state.closed);
});
test('cancel during a pending serial response closes the port',async()=>{
  const {port,state}=board({silent:true}); const abort=new AbortController();
  setTimeout(()=>abort.abort(),250);
  await assert.rejects(flashNano(port,hex([1,2]),{signal:abort.signal}),/CANCELLED/);
  assert.ok(state.closed); assert.equal(state.writes,0);
});
test('bad firmware does not open or reset a board',async()=>{
  let opened=false;
  await assert.rejects(flashNano({open(){opened=true;}},':bad'),/HEX_/);
  assert.equal(opened,false);
});
test('Uno uses its own application bounds and the standard 115200 bootloader',async()=>{
  const {port,state}=board();
  await flashArduino(port,hex([1,2]),{board:'uno'});
  assert.equal(state.baudRate,115200);
  assert.equal(state.writes,1);
  assert.equal(state.commands.at(-1),0x51);
  const upperNanoAddress=record(0,0,[1])+'\n'+record(NANO_FLASH_BYTES,0,[2])+'\n'+record(0,1);
  assert.throws(()=>parseHex(upperNanoAddress),/FLASH_OVERFLOW/);
  assert.equal(parseHex(upperNanoAddress,UNO_FLASH_BYTES)[NANO_FLASH_BYTES],2);
  assert.throws(()=>parseHex(record(0,0,[1])+'\n'+record(UNO_FLASH_BYTES,0,[2])+'\n'+record(0,1),UNO_FLASH_BYTES),/FLASH_OVERFLOW/);
});
test('board-specific HEX bounds and unsupported boards are checked before opening USB',async()=>{
  let opened=false;
  const port={open(){opened=true;}};
  const tooLarge=record(0,0,[1])+'\n'+record(UNO_FLASH_BYTES,0,[2])+'\n'+record(0,1);
  await assert.rejects(flashArduino(port,tooLarge,{board:'uno'}),/FLASH_OVERFLOW/);
  await assert.rejects(flashArduino(port,hex([1]),{board:'uno-r4'}),/BOARD_UNSUPPORTED/);
  const aboveNano=record(0,0,[1])+'\n'+record(NANO_FLASH_BYTES,0,[2])+'\n'+record(0,1);
  await assert.rejects(flashNano(port,aboveNano,{board:'uno'}),/FLASH_OVERFLOW/,'Legacy Nano API retains Nano bounds');
  assert.equal(opened,false);
});
