import assert from "node:assert/strict";
import test from "node:test";
import worker, { htmlToMarkdown, wantsMarkdown } from "../workers/main-web.mjs";

const sample = `<!doctype html><html lang="cs"><head><title>Shieldio &amp; RED</title><meta name="description" content="Test projektu"></head><body><div class="topbar"><nav>Do not include</nav></div><main><h1>Shieldio RED</h1><p>Český obsah <strong>tučně</strong> a <a href="/faq.html">odkazem</a>.</p><script>var internal = 'secret';</script><h2>Postup</h2><ol><li>Krok jedna</li><li>Krok dva</li></ol><pre><code>if (a &lt; 1) { go(); }</code></pre></main><footer>Footer omitted</footer></body></html>`;

function environment(status = 200, contentType = "text/html; charset=UTF-8") {
  return { ASSETS: { async fetch(request) {
    return new Response(status === 200 ? sample : "Not found", {
      status, headers: { "Content-Type": contentType, "Cache-Control": "max-age=600", "ETag": '"abc"' },
    });
  } } };
}

test("only an explicit, positive Markdown Accept activates conversion", () => {
  assert.equal(wantsMarkdown("text/markdown"), true);
  assert.equal(wantsMarkdown("text/html, text/markdown;q=0.8"), true);
  assert.equal(wantsMarkdown("text/markdown;q=0"), false);
  assert.equal(wantsMarkdown("text/html, */*"), false);
});

test("strips UI, keeps Czech text, links, headings and code", () => {
  const md = htmlToMarkdown(sample, "https://shieldio.cz/");
  assert.match(md, /^---\ntitle: "Shieldio & RED"/);
  assert.match(md, /# Shieldio RED/);
  assert.match(md, /\*\*tučně\*\*/);
  assert.match(md, /\[odkazem\]\(https:\/\/shieldio.cz\/faq.html\)/);
  assert.match(md, /## Postup/);
  assert.match(md, /- Krok jedna/);
  assert.match(md, /if \(a < 1\)/);
  assert.doesNotMatch(md, /Do not include|Footer omitted|secret/);
});

test("serves Markdown only on request and varies HTML by Accept", async () => {
  const url = "https://shieldio.cz/";
  const browser = await worker.fetch(new Request(url), environment());
  assert.match(browser.headers.get("Content-Type"), /^text\/html/);
  assert.equal(browser.headers.get("Vary"), "Accept");
  assert.equal(await browser.text(), sample);

  const agent = await worker.fetch(new Request(url, { headers: { Accept: "text/markdown" } }), environment());
  assert.match(agent.headers.get("Content-Type"), /^text\/markdown/);
  assert.equal(agent.headers.get("Vary"), "Accept");
  assert.equal(agent.headers.get("Cache-Control"), "max-age=600");
  assert.equal(agent.headers.has("ETag"), false);
  assert.match(await agent.text(), /# Shieldio RED/);
});

test("HEAD, binary assets and errors retain HTTP semantics", async () => {
  const url = "https://shieldio.cz/";
  const headers = { Accept: "text/markdown" };
  const head = await worker.fetch(new Request(url, { method: "HEAD", headers }), environment());
  assert.match(head.headers.get("Content-Type"), /^text\/markdown/);
  assert.equal(await head.text(), "");
  const css = await worker.fetch(new Request(url + "assets/css/style.css", { headers }), environment(200, "text/css"));
  assert.equal(css.headers.get("Content-Type"), "text/css");
  const missing = await worker.fetch(new Request(url + "missing.html", { headers }), environment(404));
  assert.equal(missing.status, 404);
});
