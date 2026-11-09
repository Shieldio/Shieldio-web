import test from "node:test";
import assert from "node:assert/strict";
import worker, { addSecurityHeaders } from "../workers/main-web.mjs";

const SAMPLE = "<!doctype html><html><head><title>Shieldio</title></head><body><main><h1>Shieldio</h1></main></body></html>";

function env(status = 200, type = "text/html; charset=utf-8") {
  const calls = [];
  return {
    calls,
    ASSETS: {
      async fetch(request) {
        calls.push(new URL(request.url).pathname);
        return new Response(status === 200 ? SAMPLE : "Not found", {
          status, headers: { "Content-Type": type, ETag: '"upstream"', Vary: "Accept-Encoding" },
        });
      },
    },
  };
}

test("HTML receives clickjacking, MIME, HSTS, referrer and permission protections", async () => {
  const runtime = env();
  const response = await worker.fetch(new Request("https://shieldio.cz/"), runtime);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("Strict-Transport-Security"), "max-age=31536000");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.match(response.headers.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.match(response.headers.get("Content-Security-Policy"), /object-src 'none'/);
  assert.match(response.headers.get("Content-Security-Policy"), /base-uri 'self'/);
  assert.match(response.headers.get("Permissions-Policy"), /geolocation=\(\)/);
  assert.match(response.headers.get("Permissions-Policy"), /payment=\(\)/);
  assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
  assert.equal(await response.text(), SAMPLE);
});

test("Markdown keeps content negotiation and protective non-HTML headers", async () => {
  const response = await worker.fetch(
    new Request("https://shieldio.cz/", { headers: { Accept: "text/markdown" } }), env()
  );
  assert.match(response.headers.get("Content-Type"), /^text\/markdown/);
  assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.has("ETag"), false);
  assert.match(await response.text(), /# Shieldio/);
});

test("CSS and 404s retain their status/content-type but gain headers", async () => {
  const css = await worker.fetch(new Request("https://shieldio.cz/assets/css/style.css"), env(200, "text/css"));
  assert.equal(css.headers.get("Content-Type"), "text/css");
  assert.equal(css.headers.get("X-Frame-Options"), null);
  assert.equal(css.headers.get("X-Content-Type-Options"), "nosniff");
  const missing = await worker.fetch(new Request("https://shieldio.cz/no-such-file"), env(404));
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("X-Content-Type-Options"), "nosniff");
});

test("noncanonical source trees are not served on the primary website", async () => {
  for (const path of [
    "/learn/", "/learn/maturita/elektronika/",
    "/services/", "/services/esp32-compiler/server.py",
  ]) {
    const runtime = env();
    const reply = await worker.fetch(new Request("https://shieldio.cz" + path), runtime);
    assert.equal(reply.status, 404, path);
    assert.equal(reply.headers.get("Cache-Control"), "no-store");
    assert.match(reply.headers.get("X-Robots-Tag"), /noindex/);
    assert.deepEqual(runtime.calls, [], "blocked paths must not reach the asset store");
  }
  for (const path of ["/", "/products/RED.html", "/assets/js/arduino-flasher.mjs", "/esp32/"]) {
    const runtime = env();
    const reply = await worker.fetch(new Request("https://shieldio.cz" + path), runtime);
    assert.equal(reply.status, 200, path);
    assert.deepEqual(runtime.calls, [path]);
  }
});

test("HEAD and HTTP 304 do not gain an illegal body", async () => {
  const head = await worker.fetch(new Request("https://shieldio.cz/", { method: "HEAD" }), env());
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("X-Frame-Options"), "DENY");
  const unchanged = await worker.fetch(
    new Request("https://shieldio.cz/assets/css/style.css"),
    { ASSETS: { fetch: async () => new Response(null, { status: 304, headers: { "Content-Type": "text/css" } }) } }
  );
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");
});

test("header helper does not disable Web Serial via a permissions restriction", () => {
  const headers = addSecurityHeaders(new Headers(), "text/html");
  assert.ok(!headers.get("Permissions-Policy").includes("serial="));
});
