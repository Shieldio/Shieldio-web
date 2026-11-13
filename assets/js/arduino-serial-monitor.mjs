// One owner of the port at a time: stop() resolves only after its lock and port close.
export class SerialMonitor {
  constructor({ onText = () => {}, onError = () => {}, onClose = () => {} } = {}) {
    this.onText = onText;
    this.onError = onError;
    this.onClose = onClose;
    this.task = null;
    this.reader = null;
    this.port = null;
    this.writer = null;
    this.sendTask = null;
    this.stopping = false;
    this.failure = null;
  }
  get active() { return Boolean(this.task); }
  get sending() { return Boolean(this.sendTask); }
  async start(port, baudRate) {
    await this.stop();
    await port.open({ baudRate, bufferSize: 4096, flowControl: "none" });
    this.stopping = false;
    this.failure = null;
    this.port = port;
    this.task = this.receive(port);
  }
  async send(text, { lineEnding = "lf" } = {}) {
    if (!this.active || this.stopping || !this.port?.writable) throw new Error("SERIAL_NOT_OPEN");
    if (this.sending) throw new Error("SERIAL_SEND_BUSY");
    if (typeof text !== "string") throw new Error("SERIAL_SEND_LIMIT");
    const endings = { none: "", lf: "\n", crlf: "\r\n" };
    if (!Object.hasOwn(endings, lineEnding)) throw new Error("SERIAL_LINE_ENDING");
    // Bound the transmitted bytes, not UTF-16 characters (Czech text needs more).
    if (text.length > 4096) throw new Error("SERIAL_SEND_LIMIT");
    const bytes = new TextEncoder().encode(text + endings[lineEnding]);
    if (bytes.byteLength > 4096) throw new Error("SERIAL_SEND_LIMIT");
    const port = this.port;
    const operation = (async () => {
      try {
        this.writer = port.writable.getWriter();
        await this.writer.write(bytes);
        return bytes.byteLength;
      } catch (error) {
        if (!this.stopping) this.onError(error);
        this.stopping = true;
        // End reception too. receive() owns closing the shared port and waits
        // for this write's lock to be released before doing so.
        void this.reader?.cancel().catch(() => {});
        throw error;
      } finally {
        this.writer?.releaseLock();
        this.writer = null;
      }
    })();
    this.sendTask = operation;
    try { return await operation; }
    finally { if (this.sendTask === operation) this.sendTask = null; }
  }
  async receive(port) {
    const decoder = new TextDecoder();
    try {
      while (port.readable && !this.stopping) {
        this.reader = port.readable.getReader();
        try {
          while (!this.stopping) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value) this.onText(decoder.decode(value, { stream: true }));
          }
        } catch (error) {
          if (!this.stopping) throw error;
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
        // A completed stream represents a closed/disconnected session.
        break;
      }
      const tail = decoder.decode();
      if (tail) this.onText(tail);
    } catch (error) {
      if (!this.stopping) this.onError(error);
    } finally {
      this.stopping = true;
      // A read disconnect or stop/upload must not close a locked writable
      // stream. Let an accepted write settle, then close this same port.
      await this.sendTask?.catch(() => {});
      try { await port.close(); }
      catch (error) { this.failure = error; if (!this.stopping) this.onError(error); }
      this.task = null;
      if (this.port === port) this.port = null;
      this.onClose();
    }
  }
  async stop() {
    this.stopping = true;
    const task = this.task;
    if (this.reader) await this.reader.cancel().catch(() => {});
    await task;
    if (task && this.failure) throw this.failure;
  }
}
