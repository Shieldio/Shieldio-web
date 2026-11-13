// Build a real, keyboard-readable guide from each public interactive guide's existing data.
// No second copy of the lesson content is maintained. Runs before both deploy workflows.
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PUBLIC_GUIDES = [
  ["sestaveni", "sestaveni-red"],
  ["zavora", "zavora"],
  ["parkovaci-asistent", "parkovaci-asistent"],
  ["casovac", "casovac"],
  ["theremin", "theremin"],
];
const START = "<!-- SHIELDIO-READABLE-GUIDE-START -->";
const END = "<!-- SHIELDIO-READABLE-GUIDE-END -->";

export function getGuide(sourceName) {
  const source = readFileSync(resolve(ROOT, `assets/js/guide-data-${sourceName}.js`), "utf8");
  const context = {window: Object.create(null)};
  vm.runInNewContext(source, context, {filename: `guide-data-${sourceName}.js`, timeout: 1000});
  const guide = context.window.SHIELDIO_GUIDE;
  if (!guide || !guide.meta || !Array.isArray(guide.steps) || !Array.isArray(guide.parts)) {
    throw new Error(`Incomplete guide data: ${sourceName}`);
  }
  return guide;
}

function localized(value, lang = "cs") {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return localized(value[lang] ?? value.cs ?? value.en ?? "", lang);
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function plain(value) {
  return localized(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:lt|#60);/gi, "<")
    .replace(/&(?:gt|#62);/gi, ">")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").trim();
}
function safe(value) { return escapeHtml(plain(value)); }
function paragraph(value, label = "") {
  if (!plain(value)) return "";
  return `<p>${label ? `<strong>${escapeHtml(label)}</strong> ` : ""}${safe(value)}</p>\n`;
}
function list(values) {
  const items = (values || []).map(value => plain(value)).filter(Boolean);
  return items.length ? `<ul>\n${items.map(item => `<li>${escapeHtml(item)}</li>`).join("\n")}\n</ul>\n` : "";
}
function diagnostics(groups) {
  return (groups || []).map(group => {
    return `<h4>${safe(group.title)}</h4>\n${list(group.items)}`;
  }).join("");
}
function troubleTree(node, depth = 0) {
  if (!node || depth > 12) return "";
  const lines = [];
  if (node.question) lines.push(paragraph(node.question, "Otázka:"));
  if (node.yesResult) lines.push(paragraph(node.yesResult, "Ano:"));
  if (node.noResult) lines.push(paragraph(node.noResult, "Ne:"));
  if (node.result) lines.push(paragraph(node.result, "Výsledek:"));
  if (node.yes && typeof node.yes === "object") lines.push(`<h4>Ano</h4>\n${troubleTree(node.yes, depth + 1)}`);
  if (node.no && typeof node.no === "object") lines.push(`<h4>Ne</h4>\n${troubleTree(node.no, depth + 1)}`);
  return lines.join("");
}
function partList(guide) {
  const ids = [...new Set(guide.steps.flatMap(step => step.parts || []))];
  if (!ids.length) return "";
  const parts = new Map(guide.parts.map(part => [part.id, part]));
  let out = "<section><h2>Součástky a vybavení</h2>\n<ul>\n";
  for (const id of ids) {
    const part = parts.get(id);
    if (!part) throw new Error(`Missing part ${id} in guide ${guide.id}`);
    out += `<li><strong>${safe(part.name)}</strong>`;
    if (part.what) out += ` — ${safe(part.what)}`;
    if (part.how) out += `. ${safe(part.how)}`;
    out += "</li>\n";
  }
  return out + "</ul></section>\n";
}
function stepSection(step, index) {
  let out = `<section id="text-step-${index + 1}"><h2>Krok ${index + 1}: ${safe(step.title)}</h2>\n`;
  if (step.type === "upload") out += '<p>Bloky pro RED jsou v kategoriích modulů; základní časování je v sekundách. Arduino C++, proměnné a sériový plotter otevře Pokročilý režim. <a href="/instructions/programovani/#rezimy">Aktuální přehled režimů editoru</a> · <a href="/instructions/programovani/#seriova-linka">Monitor a sériová linka</a>.</p>\n';
  if (step.type === "parts-check") out += paragraph("Připrav položky ze seznamu součástek a vybavení.");
  out += paragraph(step.instructions);
  if (step.warning) out += paragraph(step.warning, "Upozornění:");
  if (step.theory) out += paragraph(step.theory, "Proč to funguje:");
  if (step.note) out += paragraph(step.note, "Poznámka:");
  if (step.photo && !/^data:/i.test(step.photo)) {
    const label = `Fotografie ke kroku ${index + 1}: ${plain(step.title)}`;
    out += `<p><a href="${escapeHtml(step.photo)}">${escapeHtml(label)}</a></p>\n`;
  }
  if (step.troubleshoot?.items?.length) {
    out += `<h3>${safe(step.troubleshoot.title || "Možné problémy")}</h3>\n${list(step.troubleshoot.items)}`;
  }
  if (step.diagnostics?.length) out += `<h3>Diagnostika</h3>\n${diagnostics(step.diagnostics)}`;
  if (step.arduino?.note) out += paragraph(step.arduino.note, "Arduino C++:");
  if (step.arduino?.diagnostics?.length) {
    out += `<h3>Diagnostika nahrávání</h3>\n${diagnostics(step.arduino.diagnostics)}`;
  }
  if (step.blocksEditorHref) {
    out += `<p><a href="${escapeHtml(step.blocksEditorHref)}">Otevřít startovní program v editoru Shieldio</a></p>\n`;
  }
  if (step.tree) out += `<h3>Co dělat, když projekt nefunguje</h3>\n${troubleTree(step.tree)}`;
  return out + "</section>\n";
}

export function renderReadableGuide(guide) {
  const title = safe(guide.meta.title);
  const revision = /V3\b/.test(plain(guide.meta.title)) || guide.id === "sestaveni-red";
  let out = `<main id="guide-text-content" class="wrap" style="max-width:900px;margin:24px auto" data-agent-content="guide">\n`;
  out += '<details class="guide-text-fallback" open>\n';
  out += '<summary style="cursor:pointer;padding:12px 0;font-weight:600">Kompletní textový návod – funguje i bez JavaScriptu</summary>\n';
  out += '<article class="guide-readable-article" style="padding-bottom:24px">\n';
  out += `<h1>${title}</h1>\n`;
  if (revision) out += "<p><strong>Platnost:</strong> Osazovací postup je určený výhradně pro RED V3. Pro RED V4 nebo jiné revize použij odpovídající podklady.</p>\n";
  if (guide.meta.duration) out += paragraph(guide.meta.duration, "Předpokládaný čas:");
  if (guide.meta.learn?.length) {
    out += `<h2>Co se naučíš</h2>\n${list(guide.meta.learn)}`;
  }
  out += partList(guide);
  out += '<section aria-label="Postup krok za krokem">\n';
  guide.steps.forEach((step, i) => { out += stepSection(step, i); });
  out += "</section>\n";
  if (guide.next?.tryDifferent?.length) {
    out += "<section><h2>Vyzkoušej dál</h2>\n";
    out += list(guide.next.tryDifferent.map(item => item.text || item));
    out += "</section>\n";
  }
  if (guide.meta.programmingGuideHref) {
    out += `<p><a href="${escapeHtml(guide.meta.programmingGuideHref)}">Jak nahrát program do RED</a></p>\n`;
  }
  out += "</article>\n</details>\n</main>";
  return out;
}

export function generateGuides() {
  const changed = [];
  for (const [slug, sourceName] of PUBLIC_GUIDES) {
    const guide = getGuide(sourceName);
    const path = resolve(ROOT, `instructions/baseline/red/${slug}/index.html`);
    let html = readFileSync(path, "utf8");
    // Idempotent generation for repeated CI builds and local development.
    const markerPattern = /<!-- SHIELDIO-READABLE-GUIDE-START -->[\s\S]*?<!-- SHIELDIO-READABLE-GUIDE-END -->\s*/g;
    html = html.replace(markerPattern, "");
    if (!html.includes('id="guide-app"') || !/<footer\b/i.test(html)) {
      throw new Error(`Not an interactive guide page: ${slug}`);
    }
    const block = `${START}\n${renderReadableGuide(guide)}\n${END}\n\n`;
    const updated = html.replace(/<footer\b/i, block + "<footer");
    if (!updated.includes('id="guide-text-content"') || updated === html) {
      throw new Error(`Failed to render guide: ${slug}`);
    }
    const old = readFileSync(path, "utf8");
    if (updated !== old) { writeFileSync(path, updated); changed.push(slug); }
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Generated accessible guides:", generateGuides().join(", ") || "no changes");
}
