// ATmega328P STK500v1 over Web Serial. Writes application flash only, then reads it back.
export const NANO_FLASH_BYTES = 30720;
export const UNO_FLASH_BYTES = 32256;
const PAGE = 128;

export function parseHex(text, limit = NANO_FLASH_BYTES) {
  const memory = new Uint8Array(limit).fill(255);
  const used = new Uint8Array(limit);
  let base = 0, end = 0, eof = false;
  for (const raw of text.trim().split(/\r?\n/)) {
    const line = raw.trim();
    if (!/^:[0-9a-f]+$/i.test(line) || line.length % 2 !== 1 || eof) throw new Error("HEX_FORMAT");
    const bytes = Uint8Array.from(line.slice(1).match(/../g), b => parseInt(b, 16));
    const count = bytes[0], address = bytes[1] * 256 + bytes[2], type = bytes[3];
    if (bytes.length !== count + 5 || bytes.reduce((a, b) => a + b, 0) % 256) throw new Error("HEX_CHECKSUM");
    if (type === 0) {
      const start = base + address;
      if (start + count > limit) throw new Error("FLASH_OVERFLOW");
      for (let i = 0; i < count; i++) {
        if (used[start + i]) throw new Error("HEX_OVERLAP");
        used[start + i] = 1;
        memory[start + i] = bytes[4 + i];
      }
      end = Math.max(end, start + count);
    } else if (type === 1 && count === 0 && address === 0) eof = true;
    else if ((type === 2 || type === 4) && count === 2 && address === 0) base = (bytes[4] * 256 + bytes[5]) * (type === 2 ? 16 : 65536);
    else if ((type === 3 || type === 5) && count === 4) { /* entry point; AVR starts at zero */ }
    else throw new Error("HEX_RECORD");
  }
  if (!eof || !end || !used[0]) throw new Error("HEX_EMPTY");
  return memory.slice(0, Math.ceil(end / PAGE) * PAGE);
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function checkAbort(signal) { if (signal?.aborted) throw new Error("CANCELLED"); }

export async function flashArduino(port, hex, { board = "nano", baudRate = 115200, signal, onProgress = () => {} } = {}) {
  if (!["nano", "uno"].includes(board)) throw new Error("BOARD_UNSUPPORTED");
  const image = parseHex(hex, board === "uno" ? UNO_FLASH_BYTES : NANO_FLASH_BYTES); // Validate before opening/resetting a board.
  let reader, writer, pump, opened = false, stopping = false, failure, wake;
  let queue = [];
  const notify = () => { const callback = wake; wake = undefined; callback?.(); };
  const abort = () => { failure = new Error("CANCELLED"); notify(); };
  const read = async count => {
    const deadline = Date.now() + 1200;
    while (queue.length < count) {
      checkAbort(signal);
      if (failure) throw failure;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("SERIAL_TIMEOUT");
      await new Promise(resolve => {
        const timer = setTimeout(() => { wake = undefined; resolve(); }, remaining);
        wake = () => { clearTimeout(timer); resolve(); };
      });
    }
    return queue.splice(0, count);
  };
  const command = async (bytes, replyLength = 0) => {
    checkAbort(signal);
    await writer.write(new Uint8Array([...bytes, 0x20]));
    const response = await read(replyLength + 2);
    if (response[0] !== 0x14 || response.at(-1) !== 0x10) throw new Error("STK_RESPONSE");
    return response.slice(1, -1);
  };
  try {
    checkAbort(signal);
    await port.open({ baudRate, bufferSize: 4096, flowControl: "none" });
    opened = true;
    reader = port.readable.getReader();
    writer = port.writable.getWriter();
    signal?.addEventListener("abort", abort, { once: true });
    pump = (async () => {
      try {
        while (!stopping) {
          const { value, done } = await reader.read();
          if (done) { if (!stopping) failure = new Error("SERIAL_DISCONNECTED"); break; }
          if (value) queue.push(...value);
          if (queue.length > 8192) queue = queue.slice(-8192);
          notify();
        }
      } catch (error) { if (!stopping) failure = error; }
      finally { notify(); }
    })();
    onProgress("reset", 0);
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    await pause(100);
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });
    await pause(100);
    let synced = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      checkAbort(signal);
      queue = [];
      try { await command([0x30]); synced = true; break; }
      catch (error) {
        if (signal?.aborted || failure) throw error;
        if (!["SERIAL_TIMEOUT", "STK_RESPONSE"].includes(error.message)) throw error;
        await pause(80);
      }
    }
    if (!synced) throw new Error("BOOTLOADER_SYNC");
    const signature = await command([0x75], 3);
    if (signature.join(",") !== "30,149,15") throw new Error("WRONG_CHIP");
    // STK_SET_DEVICE: 128-byte flash pages, 32 KiB physical flash, 1 KiB EEPROM.
    await command([0x42, 0x86, 0, 0, 1, 1, 1, 1, 3, 255, 255, 255, 255, 0, 128, 4, 0, 0, 0, 128, 0]);
    await command([0x50]);
    for (let offset = 0; offset < image.length; offset += PAGE) {
      const word = offset / 2;
      await command([0x55, word & 255, word >> 8]);
      await command([0x64, 0, PAGE, 0x46, ...image.subarray(offset, offset + PAGE)]);
      onProgress("write", Math.round((offset + PAGE) / image.length * 100));
    }
    for (let offset = 0; offset < image.length; offset += PAGE) {
      const word = offset / 2;
      await command([0x55, word & 255, word >> 8]);
      const actual = await command([0x74, 0, PAGE, 0x46], PAGE);
      if (actual.some((byte, index) => byte !== image[offset + index])) throw new Error("VERIFY_FAILED");
      onProgress("verify", Math.round((offset + PAGE) / image.length * 100));
    }
    await command([0x51]);
    onProgress("done", 100);
  } finally {
    stopping = true;
    signal?.removeEventListener("abort", abort);
    if (reader) { await reader.cancel().catch(() => {}); await pump; reader.releaseLock(); }
    writer?.releaseLock();
    if (opened) await port.close().catch(() => {});
  }
}

// Existing integrations retain the Nano application bounds and bootloader options.
export function flashNano(port, hex, options = {}) {
  return flashArduino(port, hex, { ...options, board: "nano" });
}
