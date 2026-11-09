import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("index.html");
const red = read("products/RED.html");
const guide = read("edu/pro-koho-je-shieldio/index.html");
const edu = read("edu/index.html");
const sitemap = read("sitemap.xml");
const agents = read("llms.txt");
const robots = read("robots.txt");
const i18n = JSON.parse(read("assets/data/i18n.json"));

function jsonld(html) {
  return [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
}

test("úvod popisuje výukové využití RED věcně i bez JavaScriptu", () => {
  const lead = "Výuková deska s modulem kompatibilním s Arduino Nano, ultrazvukem, servem a OLED displejem. Pro školy, kroužky i domácí projekty.";
  assert.ok(home.includes(lead));
  assert.equal(i18n["home.simple.hero.description"].cs, lead);
  assert.ok(home.includes("RED V4 testujeme. Zatím se neprodává."));
  assert.ok(home.includes('href="/edu/pro-koho-je-shieldio/"'));
  assert.match(home, /name="description" content="[^"]*školy a kroužky/);
});

test("žádné falešné nabídky nebo recenze v produktových strukturovaných datech", () => {
  const product = jsonld(red).find(item => item["@type"] === "Product");
  assert.ok(product);
  assert.equal(product["@id"], "https://shieldio.cz/products/RED.html#product");
  assert.equal(product.url, "https://shieldio.cz/products/RED.html");
  assert.equal(product.name, "Shieldio RED");
  assert.equal(product.category, "Výuková elektronika");
  assert.equal(product.offers, undefined);
  assert.equal(product.aggregateRating, undefined);
  assert.ok(red.includes('href="/edu/pro-koho-je-shieldio/"'));
  assert.equal(i18n["red.audience_link"].cs, "Pro koho je RED vhodná a kdy zvolit jiné řešení");
});

test("průvodce je veřejný, čitelný bez JavaScriptu a transparentní", () => {
  assert.match(guide, /<html lang="cs">/);
  assert.match(guide, /<h1>Pro koho je Shieldio RED\?<\/h1>/);
  assert.match(guide, /Deska zatím není v prodeji/);
  assert.match(guide, /Kdy je lepší jiné řešení/);
  assert.match(guide, /Chrome nebo Edge/);
  for (const link of [
    "/instructions/programovani/", "/instructions/baseline/red/zavora/",
    "/company/pro-ucitele.html", "/products/RED.html", "/instructions/blokovy-editor.html"
  ]) assert.ok(guide.includes(`href="${link}"`), link);
  assert.ok(!guide.includes("data-i18n="));
  assert.ok(!guide.includes('name="robots" content="noindex"'));
  assert.ok(edu.includes('href="/edu/pro-koho-je-shieldio/"'));
  assert.ok(sitemap.includes("https://shieldio.cz/edu/pro-koho-je-shieldio/"));
  assert.ok(agents.includes("https://shieldio.cz/edu/pro-koho-je-shieldio/"));
  const page = jsonld(guide).find(item => item["@type"] === "WebPage");
  assert.equal(page.about["@id"], "https://shieldio.cz/products/RED.html#product");
  assert.equal(page.url, "https://shieldio.cz/edu/pro-koho-je-shieldio/");
});

test("web a produkt sdílejí jednoznačnou značku a přístup pro vyhledávání", () => {
  const schema = jsonld(home);
  const org = schema.find(item => item["@type"] === "Organization");
  const website = schema.find(item => item["@type"] === "WebSite");
  assert.equal(org["@id"], "https://shieldio.cz/#organization");
  assert.equal(website["@id"], "https://shieldio.cz/#website");
  assert.equal(website.publisher["@id"], org["@id"]);
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
});
