"""Shieldio ESP32 API. Bind to loopback behind a TLS/rate-limiting reverse proxy.
Untrusted sketches run only in disposable, resource-limited Docker containers.
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PROTOCOL = "shieldio-esp32-v1"
BOARDS = {"esp32":"esp32", "esp32s2":"esp32s2", "esp32s3":"esp32s3",
          "esp32c3":"esp32c3", "esp32c5":"esp32c5", "esp32c6":"esp32c6",
          "esp32h2":"esp32h2", "esp32p4":"esp32p4", "nano-esp32":"nano_nora"}
IMAGE = os.environ.get("ESP32_COMPILER_IMAGE", "shieldio-esp32-toolchain:3.3.12")
MAX_BODY = 220_000
MAX_IMAGE = 32 * 1024 * 1024
SLOT = threading.BoundedSemaphore(1)


class BuildError(Exception):
    def __init__(self, message, details="", status=400):
        super().__init__(message)
        self.details, self.status = details, status


def validate(payload):
    if not isinstance(payload, dict) or payload.get("protocol") != PROTOCOL:
        raise BuildError("REQUEST_FORMAT")
    board, source = payload.get("board"), payload.get("source")
    if not isinstance(board, str) or board not in BOARDS:
        raise BuildError("BOARD_UNSUPPORTED")
    if not isinstance(source, str) or not source.strip() or "\x00" in source or len(source.encode("utf-8")) > 200_000:
        raise BuildError("SOURCE_FORMAT")
    return board, source


def command(folder, board, name):
    return ["docker", "run", "--rm", "--name", name, "--network", "none",
            "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--memory", "2g", "--cpus", "2", "--pids-limit", "128",
            "--ulimit", "fsize=67108864:67108864", "--user", "65534:65534",
            "--tmpfs", "/tmp:rw,nosuid,nodev,size=768m",
            "--mount", f"type=bind,src={folder},dst=/project", "--env", "HOME=/tmp",
            IMAGE, "arduino-cli", "--config-file", "/etc/arduino-cli.yaml", "compile",
            "--fqbn", "esp32:esp32:" + BOARDS[board], "--build-path", "/tmp/build",
            "--output-dir", "/project/output", "--export-binaries", "/project/sketch"]


def run_bounded(args):
    """Bound output while draining stdout, without a shell or a host compiler."""
    process = subprocess.Popen(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    chunks, count, oversized = [], [0], threading.Event()
    def read():
        while chunk := process.stdout.read(8192):
            count[0] += len(chunk)
            if count[0] > 1024 * 1024:
                oversized.set()
                process.kill()
                break
            chunks.append(chunk)
    thread = threading.Thread(target=read, daemon=True)
    thread.start()
    try:
        process.wait(timeout=120)
        thread.join(timeout=5)
        if oversized.is_set():
            raise BuildError("BUILD_LOG_LIMIT", status=422)
        return process.returncode, b"".join(chunks)[-60000:].decode("utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)
        raise BuildError("BUILD_TIMEOUT", status=504)
    finally:
        process.stdout.close()


def remove_container(name):
    try:
        subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        pass


def build(payload, runner=run_bounded, cleanup=remove_container):
    board, source = validate(payload)
    with tempfile.TemporaryDirectory(prefix="shieldio-esp32-") as tmp:
        root = Path(tmp)
        root.chmod(0o755)
        (root / "sketch").mkdir(mode=0o755)
        code = root / "sketch/sketch.ino"
        code.write_text(source, encoding="utf-8")
        code.chmod(0o644)
        (root / "output").mkdir(mode=0o777)
        (root / "output").chmod(0o777)
        try:
            status, details = runner(command(str(root), board, root.name))
            if status:
                raise BuildError("COMPILE_ERROR", details, status=422)
            binaries = list((root / "output").glob("*.merged.bin"))
            if len(binaries) != 1 or not 0 < binaries[0].stat().st_size <= MAX_IMAGE:
                raise BuildError("BUILD_OUTPUT", details, status=500)
            return {"protocol":PROTOCOL, "board":board,
                    "image":base64.b64encode(binaries[0].read_bytes()).decode("ascii"),
                    "stderr":details.splitlines()}
        except OSError:
            raise BuildError("COMPILER_UNAVAILABLE", status=503)
        finally:
            cleanup(root.name)


class Handler(BaseHTTPRequestHandler):
    server_version = "ShieldioESP32/1"
    def reply(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path != "/api/esp32/status":
            return self.reply(404, {"error":"NOT_FOUND"})
        try:
            ok = subprocess.run(["docker", "image", "inspect", IMAGE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5).returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            ok = False
        self.reply(200, {"protocol":PROTOCOL, "boards":list(BOARDS) if ok else []})

    def do_POST(self):
        if self.path != "/api/esp32/compile":
            return self.reply(404, {"error":"NOT_FOUND"})
        origin = self.headers.get("Origin")
        if origin and origin != os.environ.get("ESP32_ALLOWED_ORIGIN", "https://shieldio.cz"):
            return self.reply(403, {"error":"ORIGIN"})
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            return self.reply(415, {"error":"CONTENT_TYPE"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if not 0 < length <= MAX_BODY:
            return self.reply(413, {"error":"REQUEST_SIZE"})
        if not SLOT.acquire(blocking=False):
            return self.reply(429, {"error":"COMPILER_BUSY"})
        try:
            self.connection.settimeout(10)
            payload = json.loads(self.rfile.read(length))
            self.reply(200, build(payload))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.reply(400, {"error":"REQUEST_FORMAT"})
        except BuildError as error:
            self.reply(error.status, {"error":str(error), "details":error.details})
        except (OSError, TimeoutError):
            self.reply(503, {"error":"COMPILER_UNAVAILABLE"})
        finally:
            SLOT.release()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", int(os.environ.get("PORT", "8788"))), Handler).serve_forever()
