import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { htmlToMarkdown, wantsMarkdown } from "../workers/main-web.mjs";

// HTMLRewriter is a native Cloudflare API; emulate the selectors we use for
// routing tests, while Cloudflare validates the real rewriter at deployment.
class HTMLRewriterStub {
  constructor() { this.handlers = []; }
  on(selector, handler) { this.handlers.push([selector, handler]); return this; }
  transform(response) {
    const handlers = this.handlers;
    const body = new ReadableStream({
      async start(controller) {
        try {
          let html = await response.text();
          for (const [selector, handler] of handlers) {
            const patterns = {
              "title": /<title\b[^>]*>[\s\S]*?<\/title>/g,
              'meta[name="robots"]': /<meta\b(?=[^>]*name="robots")[^>]*>/g,
              "[data-question-title]": /<h1\b[^>]*data-question-title[^>]*>[\s\S]*?<\/h1>/g,
              "[data-question-summary]": /<p\b[^>]*data-question-summary[^>]*>[\s\S]*?<\/p>/g,
              "[data-question-list]": /<section\b[^>]*data-question-list[^>]*>[\s\S]*?<\/section>/g,
              head: /<head\b[^>]*>[\s\S]*?<\/head>/g,
            };
            const pattern = patterns[selector];
            if (!pattern) throw Error("Unmocked selector: " + selector);
            html = html.replace(pattern, source => {
              const state = { content: null, append: "", removed: false };
              const element = {
                remove() { state.removed = true; },
                setInnerContent(value) { state.content = String(value); },
                append(value) { state.append += String(value); },
              };
              handler.element(element);
              if (state.removed) return "";
              if (state.content !== null) {
                const openEnd = source.indexOf(">") + 1;
                const closeStart = source.lastIndexOf("</");
                if (openEnd > 0 && closeStart > openEnd) return source.slice(0, openEnd) + state.content + source.slice(closeStart);
              }
              if (state.append && selector === "head") return source.replace("</head>", state.append + "</head>");
              return source;
            });
          }
          controller.enqueue(new TextEncoder().encode(html));
          controller.close();
        } catch (error) { controller.error(error); }
      },
    });
    return new Response(body, { status: response.status, headers: response.headers });
  }
}

const catalog = JSON.parse(fs.readFileSync(new URL("../assets/data/learn-questions.json", import.meta.url), "utf8"));
const source = fs.readFileSync(new URL("../learn/worker.js", import.meta.url), "utf8")
  .replace(/^import [^\n]+\n/gm, "")
  .replace("export class NoteSubmissionGuard", "class NoteSubmissionGuard")
  .replace("export default {", "globalThis.worker = {");
const scope = {
  URL, Request, Response, Headers, ReadableStream, TextEncoder,
  HTMLRewriter: HTMLRewriterStub, crypto: webcrypto,
  htmlToMarkdown, wantsMarkdown,
};
vm.runInNewContext(source, scope);
const worker = scope.worker;

const questionPage = fs.readFileSync(new URL("../learn/maturita/otazka/index.html", import.meta.url), "utf8");
const subjectPage = fs.readFileSync(new URL("../learn/maturita/automatizace/index.html", import.meta.url), "utf8");
const homePage = fs.readFileSync(new URL("../learn/index.html", import.meta.url), "utf8");
const plusPage = fs.readFileSync(new URL("../learn/edupage/index.html", import.meta.url), "utf8");
const notFoundPage = fs.readFileSync(new URL("../learn/404.html", import.meta.url), "utf8");
const env = {
  LEARN_SESSION_SECRET: "test-secret",
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/assets/data/learn-questions.json") return Response.json(catalog);
      const content = ({
        "/learn/index.html": homePage,
        "/learn/": homePage,
        "/learn/maturita/otazka/": questionPage,
        "/learn/maturita/automatizace/": subjectPage,
        "/learn/edupage/": plusPage,
        "/learn/404.html": notFoundPage,
      })[path];
      return new Response(content || "Not found", {
        status: content ? 200 : 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  },
};

const request = (path, accept = "text/html", host = "learn.shieldio.cz") =>
  new Request(`https://${host}${path}`, { headers: { accept } });

test("HTML page for public topic has a meaningful server-rendered title and summary", async () => {
  const topic = catalog.questions.find(q => q.subject === "automatizace");
  const response = await worker.fetch(request(`/maturita/otazka/${topic.slug}/`), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("vary"), "Accept");
  const html = await response.text();
  assert.match(html, new RegExp(`<h1 data-question-title>${topic.title}`));
  assert.ok(html.includes(topic.summary));
  assert.ok(html.includes(`https://learn.shieldio.cz/maturita/otazka/${topic.slug}/`));
  assert.doesNotMatch(html, /<meta name="robots" content="noindex">/);
});

test("public topics serve Markdown but private Learn+ and beta do not", async () => {
  const topic = catalog.questions.find(q => q.subject === "automatizace");
  const md = await worker.fetch(request(`/maturita/otazka/${topic.slug}/`, "text/markdown"), env);
  assert.match(md.headers.get("content-type"), /^text\/markdown/);
  const body = await md.text();
  assert.ok(body.includes(topic.title));
  assert.ok(body.includes(topic.summary));
  assert.doesNotMatch(body, /Načítám otázku/);
  const gate = await worker.fetch(request("/maturita/elektronika/", "text/markdown"), env);
  assert.match(gate.headers.get("content-type"), /^text\/html/);
  assert.match(gate.headers.get("x-robots-tag"), /noindex/);
  const plus = await worker.fetch(request("/plus/", "text/markdown"), env);
  assert.match(plus.headers.get("content-type"), /^text\/html/);
  assert.equal(plus.headers.get("vary"), null);
});

test("server-rendered public subject index gives crawlers 25 real topic links", async () => {
  const response = await worker.fetch(request("/maturita/automatizace/"), env);
  const html = await response.text();
  assert.match(html, /class="learn-public-topics"/);
  const links = [...html.matchAll(/href="\/maturita\/otazka\/automatizace-/g)];
  assert.equal(links.length, 25);
});

test("sitemap indexes public automation, not password-gated electronics or Learn+", async () => {
  const response = await worker.fetch(request("/sitemap.xml"), env);
  assert.match(response.headers.get("content-type"), /^application\/xml/);
  const xml = await response.text();
  assert.match(xml, /\/maturita\/otazka\/automatizace-/);
  assert.doesNotMatch(xml, /\/maturita\/otazka\/elektronika-/);
  assert.doesNotMatch(xml, /\/plus\//);
  assert.doesNotMatch(xml, /\/maturita\/elektronika\//);
});

test("unknown topics return 404 and staging is noindex", async () => {
  const unknown = await worker.fetch(request("/maturita/otazka/automatizace-99-neexistuje/", "text/markdown"), env);
  assert.equal(unknown.status, 404);
  const robots = await worker.fetch(request("/robots.txt", "text/plain", "stage.learn.shieldio.cz"), env);
  assert.match(await robots.text(), /Disallow: \//);
  const stage = await worker.fetch(request("/", "text/html", "stage.learn.shieldio.cz"), env);
  assert.match(stage.headers.get("x-robots-tag"), /noindex/);
});

test("HTML remains default and duplicate index.html URLs redirect", async () => {
  const browser = await worker.fetch(request("/"), env);
  assert.match(browser.headers.get("content-type"), /^text\/html/);
  const redirect = await worker.fetch(request("/maturita/index.html"), env);
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("location"), "https://learn.shieldio.cz/maturita/");
});
