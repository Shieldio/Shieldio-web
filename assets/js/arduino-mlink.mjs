// mLink 2 compatibility transport. Protocol observed in mBlock web 5.6.1.
// Connections start only after a user action. Discovery never opens a serial port.
const MLINK_URL = "http://127.0.0.1:55278";
let factoryPromise;
function loadSocketIO() {
  if (!factoryPromise) factoryPromise = new Promise((resolve, reject) => {
    const previous = window.io;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/socket.io-client@2.5.0/dist/socket.io.slim.js";
    const timer = setTimeout(() => {
      script.onload = null; script.onerror = null; script.remove(); factoryPromise = null;
      reject(new Error("MLINK_CLIENT"));
    }, 8000);
    script.onload = () => {
      clearTimeout(timer);
      const factory = window.io;
      window.io = previous;
      if (typeof factory !== "function") { factoryPromise = null; reject(new Error("MLINK_CLIENT")); }
      else resolve(factory);
    };
    script.onerror = () => { clearTimeout(timer); factoryPromise = null; script.remove(); reject(new Error("MLINK_CLIENT")); };
    document.head.appendChild(script);
  });
  return factoryPromise;
}
export class MlinkClient {
  constructor(socket, { timeout = 5000 } = {}) {
    this.socket = socket; this.timeout = timeout;
    this.pending = new Map(); this.ports = new Set(); this.counter = 0; this.version = "";
    socket.on("mlink_version", version => { this.version = String(version).slice(0, 64); });
    socket.on("s2c_send", (id, reply) => {
      const job = this.pending.get(id);
      if (!job || reply?.connectType !== "serialport" || reply.method !== job.cmd) return;
      this.pending.delete(id); clearTimeout(job.timer);
      if (reply.error) job.reject(new Error("MLINK_COMMAND: " + String(reply.error).slice(0, 300)));
      else job.resolve(reply.data);
    });
    socket.on("s2c_receive", event => {
      if (event?.connectType !== "serialport") return;
      for (const port of this.ports) port.receive(event);
    });
    socket.on("disconnect", () => {
      for (const job of this.pending.values()) { clearTimeout(job.timer); job.reject(new Error("MLINK_DISCONNECTED")); }
      this.pending.clear();
      for (const port of this.ports) port.fail(new Error("MLINK_DISCONNECTED"));
    });
  }
  request(cmd, params = {}) {
    if (!this.socket.connected) return Promise.reject(new Error("MLINK_DISCONNECTED"));
    const id = "shieldio." + (++this.counter);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("MLINK_TIMEOUT")); }, this.timeout);
      this.pending.set(id, { cmd, timer, resolve, reject });
      this.socket.emit("c2s_send", id, { connectType: "serialport", cmd, params });
    });
  }
  async listPorts() {
    const result = await this.request("getDevices", { options: {} });
    if (!Array.isArray(result)) throw new Error("MLINK_PROTOCOL");
    const paths = new Set();
    return result.slice(0, 256).flatMap(port => {
      const path = port?.comName || port?.path;
      if (typeof path !== "string" || !path || path.length > 300 || /[\r\n\0]/.test(path) || paths.has(path)) return [];
      paths.add(path);
      return [{ path, manufacturer: String(port.manufacturer || "").slice(0, 100) }];
    });
  }
  createPort(path) { return new MlinkPort(this, path); }
  close() { this.socket.close(); }
}
class MlinkPort {
  constructor(client, path) {
    this.client = client; this.path = path; this.opened = false; this.closing = false;
    this.readable = null; this.writable = null; this.input = null;
  }
  async open({ baudRate }) {
    if (this.opened) throw new Error("MLINK_PORT_BUSY");
    this.options = { connectType: "serialport", highWaterMark: 0, baudRate, port: this.path, connectionId: "serialport." + this.path };
    this.closing = false;
    this.readable = new ReadableStream({ start: c => { this.input = c; }, cancel: () => { this.input = null; } });
    this.writable = new WritableStream({ write: data => this.client.request("write", { options: this.options, data: new Uint8Array(data), encode: "utf8" }) });
    this.client.ports.add(this);
    try {
      await this.client.request("open", { options: this.options });
      this.opened = true;
    } catch (error) {
      // The helper may have opened the port before its acknowledgement was lost.
      this.closing = true;
      if (this.client.socket.connected) await this.client.request("close", { options: this.options }).catch(() => {});
      this.client.ports.delete(this);
      this.input = null; this.readable = null; this.writable = null;
      throw error;
    }
  }
  receive(event) {
    if (this.closing || (event.connectName !== this.path && event.connectionId !== this.options.connectionId)) return;
    if (event.error) { this.fail(new Error("SERIAL_DISCONNECTED")); return; }
    if (event.method !== "onReceive") return;
    const payload = event.data?.data ?? event.data;
    let bytes;
    if (Array.isArray(payload)) bytes = Uint8Array.from(payload);
    else if (payload instanceof ArrayBuffer) bytes = new Uint8Array(payload);
    else if (ArrayBuffer.isView(payload)) bytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
    else { this.fail(new Error("MLINK_PROTOCOL")); return; }
    if (bytes.length && this.input) this.input.enqueue(bytes);
  }
  fail(error) { if (this.input) { this.input.error(error); this.input = null; } }
  async setSignals({ dataTerminalReady, requestToSend }) {
    await this.client.request("set", { options: this.options, data: { dtr: dataTerminalReady, rts: requestToSend } });
  }
  async close() {
    this.closing = true;
    try { if (this.client.socket.connected) await this.client.request("close", { options: this.options }); }
    finally {
      this.opened = false; this.client.ports.delete(this);
      this.input = null; this.readable = null; this.writable = null;
    }
  }
}
export async function connectMlink({ ioFactory, timeout = 5000, signal } = {}) {
  if (signal?.aborted) throw new Error("CANCELLED");
  const factory = ioFactory || await loadSocketIO();
  if (signal?.aborted) throw new Error("CANCELLED");
  const socket = factory(MLINK_URL, { autoConnect: false, forceNew: true, reconnection: false, timeout });
  const client = new MlinkClient(socket, { timeout });
  try {
    await new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); socket.off("connect", connected); socket.off("connect_error", failed); signal?.removeEventListener("abort", cancelled); };
      const connected = () => { cleanup(); resolve(); };
      const failed = reason => {
        cleanup();
        const error = new Error("MLINK_UNAVAILABLE");
        const description = reason?.description;
        const status = typeof description === "number" ? description : description?.status;
        error.details = [
          "Endpoint: " + MLINK_URL + "/socket.io/",
          "Stage: Socket.IO connection",
          "Error: " + String(reason?.message || "connection failed").slice(0, 240),
          reason?.type ? "Type: " + String(reason.type).slice(0, 80) : "",
          Number.isFinite(status) ? "HTTP status: " + status : "",
        ].filter(Boolean).join("\n");
        reject(error);
      };
      const cancelled = () => { cleanup(); reject(new Error("CANCELLED")); };
      const timer = setTimeout(() => failed(new Error("connection timeout")), timeout);
      socket.on("connect", connected); socket.on("connect_error", failed);
      signal?.addEventListener("abort", cancelled, { once: true });
      socket.open();
    });
    socket.emit("check_mlink_version");
    return client;
  } catch (error) { client.close(); throw error; }
}

