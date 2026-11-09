import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/js/webmcp.js", import.meta.url), "utf8");
const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const entries = JSON.parse(readFileSync(new URL("../assets/data/search-index.json", import.meta.url), "utf8"));

function setup(provider = "document") {
  const tools = [], signals = [], calls = [], redirects = [];
  const context = { registerTool(tool, options) { tools.push(tool); signals.push(options.signal); return Promise.resolve(); } };
  const listeners = {};
  const document = provider === "document" ? { modelContext: context } : {};
  const navigator = provider === "navigator" ? { modelContext: context } : {};
  const window = { location: { origin: "https://shieldio.cz", assign(url) { redirects.push(url); } },
    addEventListener(name, callback) { listeners[name] = callback; } };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === "/assets/data/search-index.json") return { ok: true, json: async () => entries };
    if (url === "/instructions/baseline/red/zavora/index.html") {
      return { ok: true, headers: { get: () => "text/markdown; charset=utf-8" }, text: async () => "# Závora\nZákladní návod." };
    }
    throw Error("Unexpected network request " + url);
  };
  vm.runInNewContext(source, { document, navigator, window, fetch, URL, AbortController, Promise, Object, Number, String });
  return { tools, signals, calls, redirects, listeners };
}

test("homepage načítá WebMCP na page load bez čekání na kliknutí", () => {
  assert.match(home, /<script src="\/assets\/js\/webmcp\.js" defer><\/script>/);
  const x = setup();
  assert.deepEqual(x.tools.map(t => t.name), [
    "shieldio_search_site", "shieldio_list_resources",
    "shieldio_read_public_page", "shieldio_open_page",
  ]);
  for (const t of x.tools) {
    assert.ok(t.description);
    assert.equal(t.inputSchema.type, "object");
    assert.equal(typeof t.execute, "function");
    assert.ok(t.inputSchema.required?.length);
    assert.equal(t.annotations.readOnlyHint, t.name !== "shieldio_open_page");
  }
  assert.ok(x.signals.every(s => s === x.signals[0]));
  assert.equal(x.signals[0].aborted, false);
  x.listeners.pagehide();
  assert.equal(x.signals[0].aborted, true);
});

test("kompatibilita prohlížečů: document i navigator", () => {
  const modern = setup("document");
  const legacy = setup("navigator");
  assert.equal(modern.tools.length, 4);
  assert.equal(legacy.tools.length, 4);
  vm.runInNewContext(source, {
    document: {}, navigator: {}, window: { addEventListener() {} }, AbortController,
  });
});

test("vyhledávání je diakriticky tolerantní a bez side effects", async () => {
  const x = setup();
  const t = x.tools.find(tool => tool.name === "shieldio_search_site");
  const a = await t.execute({ query: "zavora" });
  assert.equal(a.ok, true);
  assert.equal(a.results[0].url, "https://shieldio.cz/instructions/baseline/red/zavora/index.html");
  const b = await t.execute({ query: "servo", limit: 2 });
  assert.equal(b.results.length, 2);
  assert.ok(x.calls.every(c => c.url === "/assets/data/search-index.json"));
  assert.equal(x.redirects.length, 0);
  assert.equal((await t.execute({ query: "" })).ok, false);
});

test("public resource listing, document retrieval and navigation are limited to indexed pages", async () => {
  const x = setup();
  const tools = Object.fromEntries(x.tools.map(tool => [tool.name, tool]));
  const cat = await tools.shieldio_list_resources.execute({ category: "projects" });
  assert.equal(cat.ok, true);
  assert.ok(cat.results.some(item => item.url.endsWith("/zavora/index.html")));
  const read = await tools.shieldio_read_public_page.execute({ path: "/instructions/baseline/red/zavora/index.html" });
  assert.equal(read.ok, true);
  assert.match(read.content, /Závora/);
  const missing = await tools.shieldio_read_public_page.execute({ path: "/services/esp32-compiler/server.py" });
  assert.equal(missing.ok, false);
  const external = await tools.shieldio_open_page.execute({ path: "//evil.test/" });
  assert.equal(external.ok, false);
  const privatePath = await tools.shieldio_open_page.execute({ path: "/learn/maturita/elektronika/" });
  assert.equal(privatePath.ok, false);
  assert.equal(x.redirects.length, 0);
  const nav = await tools.shieldio_open_page.execute({ path: "/instructions/blokovy-editor.html" });
  assert.equal(nav.ok, true);
  assert.deepEqual(x.redirects, ["https://shieldio.cz/instructions/blokovy-editor.html"]);
});
