import assert from 'node:assert/strict';
import { SerialMonitor } from '../assets/js/arduino-serial-monitor.mjs';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function portMock() {
  return {
    opened: false, closes: 0,
    async open(options) {
      assert.equal(this.opened, false, 'Opening a busy port must fail');
      this.opened = true; this.options = options;
      this.readable = new ReadableStream({ start: controller => { this.input = controller; } });
    },
    async close() {
      assert.equal(this.readable.locked, false, 'Reader lock must be released before closing');
      this.opened = false; this.closes++;
    }
  };
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
console.log('Serial monitor: UTF-8 streaming, baud rate, cancellation, reader/port release, disconnect and reopen passed.');
