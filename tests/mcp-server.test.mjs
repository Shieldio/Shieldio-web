import assert from "node:assert/strict";
import test from "node:test";
import worker from "../workers/main-web.mjs";
import { currentCard, legacyCard, SERVER_INFO } from "../workers/mcp-server.mjs";

const base = "https://shieldio.cz";
const calls = [];
const env = {
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      calls.push(path);
      if (path === "/llms.txt") return new Response("# Shieldio\n- [RED programming](https://shieldio.cz/instructions/programovani/)", { headers: { "Content-Type": "text/plain" } });
      if (path === "/api/simulation-openapi.json") return new Response('{"openapi":"3.1.0"}', { headers: { "Content-Type": "application/json" } });
      throw new Error("Unexpected ASSETS path: " + path);
    },
  },
};
async function rpc(method, params = {}, id = 1, headers = {}) {
  return worker.fetch(new Request(base + "/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  }), env);
}

test("legacy discovery returns accurate metadata, CORS, JSON and HEAD", async () => {
  const response = await worker.fetch(new Request(base + "/.well-known/mcp/server-card.json"), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /^application\/json/);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const card = await response.json();
  assert.deepEqual(card, legacyCard());
  assert.equal(card.serverInfo.name, SERVER_INFO.name);
  assert.equal(card.transport.endpoint, base + "/mcp");
  for (const kind of ["tools", "resources", "prompts"]) assert.ok(card.capabilities[kind]);
  const head = await worker.fetch(new Request(base + "/.well-known/mcp/server-card.json", { method: "HEAD" }), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("Content-Type"), response.headers.get("Content-Type"));
  const denied = await worker.fetch(new Request(base + "/.well-known/mcp/server-card.json", { method: "POST" }), env);
  assert.equal(denied.status, 405);
});

test("SEP-2127 canonical card contains current v1 schema and URL, not static capabilities", async () => {
  const response = await worker.fetch(new Request(base + "/mcp/server-card"), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /^application\/mcp-server-card\+json/);
  const card = await response.json();
  assert.deepEqual(card, currentCard());
  assert.equal(card.$schema, "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json");
  assert.equal(card.remotes[0].url, base + "/mcp");
  assert.equal(card.capabilities, undefined);
  assert.equal(card.tools, undefined);
});

test("MCP initialize, list and public tool calls work end-to-end", async () => {
  calls.length = 0;
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0.1.0" } });
  assert.equal(init.status, 200);
  const i = (await init.json()).result;
  assert.equal(i.protocolVersion, "2025-06-18");
  assert.equal(i.serverInfo.name, SERVER_INFO.name);
  const ts = (await (await rpc("tools/list")).json()).result.tools;
  assert.deepEqual(ts.map(t => t.name), ["get_shieldio_index", "find_shieldio_resources"]);
  assert.equal((await (await rpc("resources/list")).json()).result.resources.length, 3);
  assert.equal((await (await rpc("prompts/list")).json()).result.prompts.length, 1);
  const index = (await (await rpc("tools/call", { name: "get_shieldio_index", arguments: {} })).json()).result;
  assert.match(index.content[0].text, /RED programming/);
  const found = (await (await rpc("tools/call", { name: "find_shieldio_resources", arguments: { query: "programming" } })).json()).result;
  assert.match(found.content[0].text, /RED programming/);
  const resource = (await (await rpc("resources/read", { uri: base + "/llms.txt" })).json()).result;
  assert.equal(resource.contents[0].uri, base + "/llms.txt");
  const prompt = (await (await rpc("prompts/get", { name: "start_learning_shieldio_red", arguments: { goal: "LED" } })).json()).result;
  assert.match(prompt.messages[0].content.text, /LED/);
  assert.ok(calls.length === 3 && calls.every(x => x === "/llms.txt"));
});

test("MCP rejects unknown operations, invalid requests, cross-origin and arbitrary URL fetches", async () => {
  const denied = await rpc("tools/call", { name: "find_shieldio_resources", arguments: { query: "x" } });
  assert.equal((await denied.json()).error.code, -32602);
  const unknown = await rpc("tools/call", { name: "arbitrary_network_fetch", arguments: { url: "https://localhost/" } });
  assert.equal((await unknown.json()).error.code, -32602);
  const badUri = await rpc("resources/read", { uri: "file:///etc/passwd" });
  assert.equal((await badUri.json()).error.code, -32602);
  const method = await rpc("unknown");
  assert.equal((await method.json()).error.code, -32601);
  const evil = await rpc("initialize", {}, 1, { Origin: "https://evil.test" });
  assert.equal(evil.status, 403);
  const allowed = await rpc("initialize", {}, 1, { Origin: base });
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), base);
  const notification = await worker.fetch(new Request(base + "/mcp", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  }), env);
  assert.equal(notification.status, 202);
  assert.equal(await notification.text(), "");
  const get = await worker.fetch(new Request(base + "/mcp"), env);
  assert.equal(get.status, 405);
  const options = await worker.fetch(new Request(base + "/mcp", { method: "OPTIONS", headers: { Origin: base } }), env);
  assert.equal(options.status, 204);
});
