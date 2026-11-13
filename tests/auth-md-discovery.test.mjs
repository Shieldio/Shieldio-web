import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker from "../workers/main-web.mjs";

const origin = "https://shieldio.cz";
const markdown = readFileSync(new URL("../auth.md", import.meta.url), "utf8");

function env(found = true) {
  const paths = [];
  return {
    paths,
    ASSETS: {
      async fetch(request) {
        paths.push({ path: new URL(request.url).pathname, method: request.method });
        return found
          ? new Response(markdown, { status: 200, headers: { "Content-Type": "application/octet-stream" } })
          : new Response("Not found", { status: 404 });
      },
    },
  };
}

test("auth.md documents the actual anonymous read-only access, without fictional OAuth", () => {
  assert.match(markdown, /^# .*auth\.md\b/im);
  assert.match(markdown, /Audience:/);
  assert.match(markdown, /registration/i);
  assert.match(markdown, /no self-registration or credential issuance/i);
  assert.match(markdown, /https:\/\/shieldio\.cz\/mcp\/server-card/);
  assert.match(markdown, /https:\/\/shieldio\.cz\/mcp/);
  assert.match(markdown, /anonymous/i);
  assert.match(markdown, /no credential/i);
  assert.doesNotMatch(markdown, /"register_uri"\s*:/);
});

test("GET and HEAD /auth.md return Markdown, CORS and security headers", async () => {
  const runtime = env();
  const get = await worker.fetch(new Request(origin + "/auth.md"), runtime);
  assert.equal(get.status, 200);
  assert.match(get.headers.get("Content-Type"), /^text\/markdown; charset=utf-8$/);
  assert.equal(get.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(get.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(get.headers.get("Cache-Control"), "public, max-age=300");
  assert.equal(await get.text(), markdown);
  const head = await worker.fetch(new Request(origin + "/auth.md", { method: "HEAD" }), runtime);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Type"), get.headers.get("Content-Type"));
  assert.equal(await head.text(), "");
  assert.deepEqual(runtime.paths, [
    { path: "/auth.md", method: "GET" },
    { path: "/auth.md", method: "GET" },
  ]);
});

test("auth.md rejects writes and missing assets without claiming registration", async () => {
  const runtime = env();
  const post = await worker.fetch(new Request(origin + "/auth.md", { method: "POST" }), runtime);
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("Allow"), "GET, HEAD");
  assert.equal(runtime.paths.length, 0);
  const missing = await worker.fetch(new Request(origin + "/auth.md"), env(false));
  assert.equal(missing.status, 404);
});
