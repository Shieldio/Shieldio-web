// One owner of the port at a time: stop() resolves only after its lock and port close.
export class SerialMonitor {
  constructor({ onText = () => {}, onError = () => {}, onClose = () => {} } = {}) {
    this.onText = onText;
    this.onError = onError;
    this.onClose = onClose;
    this.task = null;
    this.reader = null;
    this.stopping = false;
    this.failure = null;
  }
  get active() { return Boolean(this.task); }
  async start(port, baudRate) {
    await this.stop();
    await port.open({ baudRate, bufferSize: 4096, flowControl: "none" });
    this.stopping = false;
    this.failure = null;
    this.task = this.receive(port);
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
      try { await port.close(); }
      catch (error) { this.failure = error; if (!this.stopping) this.onError(error); }
      this.task = null;
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
