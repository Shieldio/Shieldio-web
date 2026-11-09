import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker from "../workers/main-web.mjs";

const catalogUrl = "https://shieldio.cz/.well-known/api-catalog";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("API katalog vrací linkset podle RFC 9727 a reálné veřejné rozhraní", async () => {
  const env = { ASSETS: { fetch() { throw new Error("Katalog se nemá načítat z HTML assetů"); } } };
  const response = await worker.fetch(new Request(catalogUrl, { headers: { Accept: "application/linkset+json" } }), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /^application\/linkset\+json(?:;|$)/);
  assert.match(response.headers.get("Link"), /rel="api-catalog"/);
  const payload = await response.json();
  assert.ok(Array.isArray(payload.linkset));
  assert.equal(payload.linkset.length, 1);
  for (const entry of payload.linkset) {
    assert.match(entry.anchor, /^https:\/\//);
    assert.ok(entry["service-desc"]?.[0]?.href);
    assert.ok(entry["service-doc"]?.[0]?.href);
    assert.ok(entry.status?.[0]?.href);
  }
  const api = payload.linkset[0];
  assert.equal(api.anchor, "https://simulation.shieldio.cz/api/health");
  assert.equal(api["service-desc"][0].href, "https://shieldio.cz/api/simulation-openapi.json");
  assert.equal(api["service-doc"][0].href, "https://shieldio.cz/api/");
  assert.equal(api.status[0].href, api.anchor);
});

test("HEAD má totožný typ a Link hlavičku; jiné metody jsou odmítnuty", async () => {
  const env = { ASSETS: { fetch() { throw new Error("Nepovolené volání ASSETS"); } } };
  const head = await worker.fetch(new Request(catalogUrl, { method: "HEAD" }), env);
  assert.equal(head.status, 200);
  assert.match(head.headers.get("Content-Type"), /^application\/linkset\+json/);
  assert.match(head.headers.get("Link"), /api-catalog/);
  assert.equal(await head.text(), "");
  const post = await worker.fetch(new Request(catalogUrl, { method: "POST" }), env);
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("Allow"), "GET, HEAD");
});

test("OpenAPI a veřejná dokumentace popisují skutečný health endpoint", () => {
  const spec = JSON.parse(read("api/simulation-openapi.json"));
  const docs = read("api/index.html");
  assert.equal(spec.openapi, "3.1.0");
  assert.equal(spec.servers[0].url, "https://simulation.shieldio.cz");
  assert.ok(spec.paths["/api/health"].get.responses["200"]);
  assert.match(docs, /Simulation Health API/);
  assert.match(docs, /simulation-openapi\.json/);
  assert.match(docs, /\.well-known\/api-catalog/);
});

test("úvodní stránka odkazuje na katalog v HTML i HTTP hlavičce", async () => {
  const home = read("index.html");
  assert.match(home, /<link rel="api-catalog" href="\/\.well-known\/api-catalog"/);
  const env = { ASSETS: { async fetch() {
    return new Response(home, {status: 200, headers: {"Content-Type": "text/html; charset=utf-8"}});
  } } };
  const result = await worker.fetch(new Request("https://shieldio.cz/"), env);
  assert.match(result.headers.get("Link"), /rel="api-catalog"/);
  assert.equal(result.status, 200);
});

test("homepage zveřejňuje všechny 4 registrované Link relace pro GET/HEAD a Markdown", async () => {
  const html = read("index.html");
  const env = { ASSETS: { async fetch() {
    return new Response(html, { status: 200, headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Link": '</legal>; rel="license"',
    } });
  } } };
  const expected = {
    "api-catalog": ["/.well-known/api-catalog", "application/linkset+json"],
    "service-desc": ["/api/simulation-openapi.json", "application/json"],
    "service-doc": ["/api/", "text/html"],
    "describedby": ["/llms.txt", "text/plain"],
  };
  for (const [path, options] of [
    ["/", {}],
    ["/", { method: "HEAD" }],
    ["/", { headers: { Accept: "text/markdown" } }],
    ["/index.html", {}],
  ]) {
    const response = await worker.fetch(new Request("https://shieldio.cz" + path, options), env);
    assert.equal(response.status, 200);
    const links = (response.headers.get("Link") || "").split(",").map(item => item.trim());
    assert.ok(links.includes('</legal>; rel="license"'), "zachová původní Link hlavičku");
    for (const [rel, [href, type]] of Object.entries(expected)) {
      assert.ok(links.includes(`<${href}>; rel="${rel}"; type="${type}"`), `chybí ${rel} pro ${path}`);
    }
    if (options.method === "HEAD") assert.equal(await response.text(), "");
    if (options.headers?.Accept === "text/markdown") assert.match(response.headers.get("content-type"), /^text\/markdown/);
  }
});

test("mimo úvodní stránku nepřidává relace určené homepage", async () => {
  const env = { ASSETS: { async fetch() {
    return new Response("<html><main><h1>Další stránka</h1></main></html>", {
      status: 200, headers: { "Content-Type": "text/html" },
    });
  } } };
  const response = await worker.fetch(new Request("https://shieldio.cz/faq.html"), env);
  assert.equal(response.headers.has("Link"), false);
});
