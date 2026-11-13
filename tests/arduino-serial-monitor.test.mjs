import assert from 'node:assert/strict';
import { SerialMonitor } from '../assets/js/arduino-serial-monitor.mjs';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function portMock() {
  return {
    opened: false, closes: 0, sent: [],
    async open(options) {
      assert.equal(this.opened, false, 'Opening a busy port must fail');
      this.opened = true; this.options = options;
      this.readable = new ReadableStream({ start: controller => { this.input = controller; } });
      this.writable = new WritableStream({ write: async bytes => {
        this.sent.push(new Uint8Array(bytes));
        if (this.writeHandler) await this.writeHandler(bytes);
      } });
    },
    async close() {
      assert.equal(this.readable.locked, false, 'Reader lock must be released before closing');
      assert.equal(this.writable.locked, false, 'Writer lock must be released before closing');
      this.opened = false; this.closes++;
    }
  };
}
{
  const port = portMock(), monitor = new SerialMonitor();
  await assert.rejects(monitor.send('A'), /SERIAL_NOT_OPEN/);
  await monitor.start(port, 9600);
  assert.equal(await monitor.send('Příkaz: žluťoučký'), new TextEncoder().encode('Příkaz: žluťoučký\n').length);
  await monitor.send('B', { lineEnding: 'crlf' });
  await monitor.send('C', { lineEnding: 'none' });
  assert.deepEqual(port.sent.map(bytes => new TextDecoder().decode(bytes)), ['Příkaz: žluťoučký\n', 'B\r\n', 'C']);
  assert.equal(port.writable.locked, false);
  assert.equal(monitor.sending, false);
  await assert.rejects(monitor.send('x'.repeat(4096)), /SERIAL_SEND_LIMIT/, 'LF is included in the byte limit');
  await assert.rejects(monitor.send('ž'.repeat(2049), { lineEnding: 'none' }), /SERIAL_SEND_LIMIT/);
  // ž takes two bytes, so exactly 2048 characters are allowed with no ending.
  assert.equal(await monitor.send('ž'.repeat(2048), { lineEnding: 'none' }), 4096);
  await assert.rejects(monitor.send('x', { lineEnding: 'invalid' }), /SERIAL_LINE_ENDING/);
  await monitor.stop();
}
{
  const port = portMock(), received = [], monitor = new SerialMonitor({ onText: text => received.push(text) });
  let finishWrite;
  port.writeHandler = () => new Promise(resolve => { finishWrite = resolve; });
  await monitor.start(port, 115200);
  const sending = monitor.send('command');
  await tick();
  assert.equal(monitor.sending, true);
  await assert.rejects(monitor.send('second'), /SERIAL_SEND_BUSY/);
  port.input.enqueue(new TextEncoder().encode('reply\n'));
  await tick();
  assert.equal(received.join(''), 'reply\n', 'Receiving continues during a write on the same port');
  const stopping = monitor.stop();
  await tick();
  assert.equal(port.closes, 0, 'Upload must wait for the accepted write');
  await assert.rejects(monitor.send('late'), /SERIAL_NOT_OPEN/);
  finishWrite();
  await sending;
  await stopping;
  assert.equal(port.closes, 1);
  assert.equal(port.opened, false);
  assert.equal(monitor.sending, false);
}
{
  const port = portMock(), errors = [], monitor = new SerialMonitor({ onError: error => errors.push(error) });
  port.writeHandler = async () => { throw Error('Write disconnected'); };
  await monitor.start(port, 9600);
  await assert.rejects(monitor.send('command'), /Write disconnected/);
  await monitor.stop();
  assert.equal(errors[0].message, 'Write disconnected');
  assert.equal(errors.length, 1);
  assert.equal(port.closes, 1);
  assert.equal(port.writable.locked, false);
  assert.equal(monitor.active, false);
}
{
  const port = portMock(), output = [], errors = [];
  const monitor = new SerialMonitor({ onText: text => output.push(text), onError: error => errors.push(error) });
  await monitor.start(port, 115200);
  assert.equal(port.options.baudRate, 115200);
  const bytes = new TextEncoder().encode('Příjem: 42\r\n');
  port.input.enqueue(bytes.slice(0, 2)); // Split inside the UTF-8 character ř.
  port.input.enqueue(bytes.slice(2));
  await tick();
  assert.equal(output.join(''), 'Příjem: 42\r\n');
  await monitor.stop();
  assert.equal(monitor.active, false); assert.equal(port.opened, false);
  assert.equal(port.closes, 1); assert.deepEqual(errors, []);
  await monitor.stop(); assert.equal(port.closes, 1, 'Repeated stop is harmless');
  await monitor.start(port, 9600); await monitor.stop();
  assert.equal(port.options.baudRate, 9600);
}
{
  const port = portMock(), errors = [], monitor = new SerialMonitor({ onError: error => errors.push(error) });
  await monitor.start(port, 9600);
  port.input.error(new Error('USB disconnected'));
  await tick();
  assert.equal(errors[0].message, 'USB disconnected');
  assert.equal(monitor.active, false); assert.equal(port.opened, false);
  await monitor.start(port, 57600); await monitor.stop();
}
{
  const monitor = new SerialMonitor();
  await assert.rejects(monitor.start({ open: async () => { throw Error('Port in use'); } }, 9600), /Port in use/);
  assert.equal(monitor.active, false);
  const port = portMock(); await monitor.start(port, 9600); await monitor.stop();
}
{
  const port = portMock(), monitor = new SerialMonitor();
  port.close = async () => { throw Error('Cannot close'); };
  await monitor.start(port, 9600);
  await assert.rejects(monitor.stop(), /Cannot close/, 'A failed close must prevent upload');
}
console.log('Serial monitor: UTF-8 receiving/sending, line endings, byte limits, concurrent write rejection, stop during send, port release, disconnect and reopen passed.');
