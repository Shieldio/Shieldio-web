import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {getGuide, generateGuides, renderReadableGuide} from "../scripts/generate-readable-guides.mjs";
import {htmlToMarkdown} from "../workers/main-web.mjs";

const PUBLIC = [
  ["sestaveni", "sestaveni-red"],
  ["zavora", "zavora"],
  ["parkovaci-asistent", "parkovaci-asistent"],
  ["casovac", "casovac"],
  ["theremin", "theremin"],
];

test("generátor je opakovatelný a nezdvojuje obsah", () => {
  generateGuides();
  assert.deepEqual(generateGuides(), []);
});

for (const [slug, dataName] of PUBLIC) {
  test(`textový návod ${slug} má všechny kroky, části a je čitelný agentem`, () => {
    const guide = getGuide(dataName);
    const file = resolve("instructions", "baseline", "red", slug, "index.html");
    const html = readFileSync(file, "utf8");
    assert.ok(html.includes('<main id="guide-text-content"'), slug);
    assert.ok(html.includes("<details class=\"guide-text-fallback\" open>"), slug);
    assert.ok(html.includes('<div class="guide-app"'), slug);
    assert.equal((html.match(/<section id="text-step-\d+">/g) || []).length, guide.steps.length);
    assert.equal((html.match(/<!-- SHIELDIO-READABLE-GUIDE-START -->/g) || []).length, 1);
    assert.ok(renderReadableGuide(guide).includes("Součástky a vybavení"), slug);
    const markdown = htmlToMarkdown(html, `https://shieldio.cz/instructions/baseline/red/${slug}/`);
    assert.match(markdown, /# (?:Automatická závora|Parkovací asistent|Časovač|Theremin|Sestavení)/);
    assert.match(markdown, /## Součástky a vybavení/);
    assert.match(markdown, /## Krok 1:/);
    assert.match(markdown, /Krok (?:2|3):/);
    assert.ok(markdown.length > 1600, `Markdown is too short for ${slug}: ${markdown.length}`);
    assert.doesNotMatch(markdown, /guide-progress|guide-steps|SHIELDIO_GUIDE|<script/);
  });
}
test("návod pájení upozorňuje na revizi V3", () => {
  const content = readFileSync("instructions/baseline/red/sestaveni/index.html", "utf8");
  assert.match(content, /výhradně pro RED V3/);
  assert.match(content, /RED V4/);
});
