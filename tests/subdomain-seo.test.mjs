import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = path => fs.readFileSync(root + path, "utf8");

for (const [directory, domain] of [
  ["experiments/simulation/", "simulation.shieldio.cz"],
  ["experiments/flight360/", "flight360.shieldio.cz"],
  ["light/", "light.shieldio.cz"],
  ["luxmaxing/", "luxmaxing.shieldio.cz"],
]) {
  test(`${domain}: veřejná robots a sitemap odkazují na vlastní doménu`, () => {
    const robots = read(directory + "robots.txt");
    const sitemap = read(directory + "sitemap.xml");
    assert.match(robots, /^User-agent:\s*\*/m);
    assert.ok(robots.includes(`Sitemap: https://${domain}/sitemap.xml`));
    assert.match(sitemap, /^<\?xml/);
    assert.ok(sitemap.includes(`<loc>https://${domain}/</loc>`));
    assert.doesNotMatch(sitemap, /learn\.shieldio\.cz\/maturita/);
  });
}

test("simulátor obsahuje kanonickou URL a dostupný H1 bez změny pracovního rozhraní", () => {
  const html = read("experiments/simulation/index.html");
  const css = read("experiments/simulation/style.css");
  assert.ok(html.includes('<link rel="canonical" href="https://simulation.shieldio.cz/">'));
  assert.match(html, /<h1 class="sr-only">/);
  assert.match(css, /\.sr-only\s*\{/);
  assert.match(html, /<main id="workbench">/);
});
