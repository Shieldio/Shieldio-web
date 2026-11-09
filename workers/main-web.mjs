// Serves Markdown to agents while keeping the original HTML for browsers.
// No package dependencies: the source HTML is the single source of truth.
const OMIT = new Set([
  "script", "style", "noscript", "template", "svg", "nav", "footer",
  "button", "form", "iframe", "canvas", "input", "select", "textarea",
]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", times: "×", laquo: "«", raquo: "»", copy: "©" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (whole, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x";
      const point = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : whole;
    }
    return named[entity.toLowerCase()] ?? whole;
  });
}

function attribute(markup, name) {
  const match = markup.match(new RegExp(`(?:\\s|^)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3]) : "";
}

function absoluteHref(href, pageUrl) {
  try {
    const link = new URL(href, pageUrl);
    return ["https:", "http:", "mailto:"].includes(link.protocol) ? link.href : "";
  } catch {
    return "";
  }
}

function shouldOmit(tag, markup) {
  if (OMIT.has(tag) || /\s(?:hidden|inert)(?:\s|=|>)/i.test(markup) || /\baria-hidden\s*=\s*["']?true\b/i.test(markup)) return true;
  const classes = attribute(markup, "class");
  return /(?:^|\s)(?:topbar|nav-links|cookie-banner|site-footer|skip-link)(?:\s|$)/i.test(classes);
}

export function wantsMarkdown(accept) {
  return (accept || "").split(",").some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    if (type.trim() !== "text/markdown") return false;
    const quality = params.find((param) => /^\s*q\s*=/.test(param));
    return !quality || Number(quality.split("=")[1]) > 0;
  });
}

export function htmlToMarkdown(html, pageUrl) {
  // Only parse public HTML content; do not mix in navigation or executable JS.
  const title = decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.trim() || "");
  const meta = html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0] || "";
  const description = attribute(meta, "content");
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] || html;
  // A real static text equivalent is generated from the same guide data
  // before deployment; expose it instead of the empty JavaScript shell.
  const guideContent = body.match(/<main\b[^>]*\bid=["']guide-text-content["'][^>]*>([\s\S]*?)<\/main\s*>/i)?.[1];
  // Keep only the article/main content on sites that use semantic HTML.
  // Without this, agents receive banners, navigation, image logos and footer links.
  const mainContent = body.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i)?.[1];
  const safeBody = (guideContent || mainContent || body)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const tokens = safeBody.match(/<[^>]*>|[^<]+/g) || [];
  const stack = [];
  let hidden = 0;
  let pre = 0;
  let output = "";
  let headerColumns = 0;
  let inHeaderRow = false;
  const line = () => { output += "\n\n"; };
  const start = (tag, markup, entry) => {
    if (/^h[1-6]$/.test(tag)) output += `\n\n${"#".repeat(Number(tag[1]))} `;
    else if (tag === "p" || tag === "section" || tag === "article" || tag === "details" || tag === "blockquote") line();
    else if (tag === "summary") output += "\n\n### ";
    else if (tag === "li") output += "\n- ";
    else if (tag === "br") output += "\n";
    else if (tag === "hr") output += "\n\n---\n\n";
    else if (tag === "strong" || tag === "b" || tag === "dt") output += "**";
    else if (tag === "em" || tag === "i") output += "*";
    else if (tag === "code" && !pre) output += "`";
    else if (tag === "pre") { output += "\n\n```\n"; pre++; }
    else if (tag === "a") {
      entry.href = absoluteHref(attribute(markup, "href"), pageUrl);
      if (entry.href) output += "[";
    } else if (tag === "img") {
      const alt = attribute(markup, "alt").trim();
      const src = absoluteHref(attribute(markup, "src"), pageUrl);
      if (alt && src) {
        // Nested images inside <a> are labels of the enclosing link. Rendering
        // Markdown image syntax inside [link text] makes invalid nested links.
        const insideLink = stack.some(item => item.tag === "a" && item.href);
        output += insideLink ? alt.replace(/[\[\]]/g, "") : `\n![${alt.replace(/[\[\]]/g, "")}](${src})\n`;
      }
    } else if (tag === "tr") { output += "\n| "; headerColumns = 0; inHeaderRow = false; }
    else if (tag === "th" || tag === "td") {
      if (tag === "th") { inHeaderRow = true; headerColumns++; }
    }
  };
  const end = (entry) => {
    const { tag, href } = entry;
    if (/^h[1-6]$/.test(tag) || ["p", "section", "article", "details", "summary", "li", "blockquote"].includes(tag)) line();
    else if (tag === "strong" || tag === "b" || tag === "dt") output += "**";
    else if (tag === "em" || tag === "i") output += "*";
    else if (tag === "code" && !pre) output += "`";
    else if (tag === "pre") { output += "\n```\n\n"; pre--; }
    else if (tag === "a" && href) output += `](${href})`;
    else if (tag === "th" || tag === "td") output += " | ";
    else if (tag === "tr") {
      output += "\n";
      if (inHeaderRow && headerColumns) output += `| ${Array(headerColumns).fill("---").join(" | ")} |\n`;
    }
  };
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      if (!hidden) output += pre ? decodeEntities(token) : decodeEntities(token).replace(/\s+/g, " ");
      continue;
    }
    if (/^<!/.test(token)) continue;
    const match = token.match(/^<\s*(\/?)\s*([\w:-]+)/);
    if (!match) continue;
    const tag = match[2].toLowerCase();
    if (match[1]) {
      const index = stack.findLastIndex((item) => item.tag === tag);
      if (index < 0) continue;
      while (stack.length > index) {
        const entry = stack.pop();
        if (entry.hidden) hidden--;
        else end(entry);
      }
    } else {
      const entry = { tag, hidden: hidden > 0 || shouldOmit(tag, token), href: "" };
      if (!entry.hidden) start(tag, token, entry);
      if (!VOID.has(tag) && !/\/\s*>$/.test(token)) {
        stack.push(entry);
        if (entry.hidden) hidden++;
      }
    }
  }
  let content = output
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!content) return "";
  const metaLines = [];
  if (title) metaLines.push(`title: ${JSON.stringify(title)}`);
  if (description) metaLines.push(`description: ${JSON.stringify(description)}`);
  if (metaLines.length) content = `---\n${metaLines.join("\n")}\n---\n\n${content}`;
  return content + "\n";
}

// Baseline protection for HTML, Markdown and static assets.
// Deliberately do not set script-src/style-src here: the public editor uses
// inline startup code, dynamic modules, WASM and third-party compiler assets.
// A strict CSP requires a separate compatibility audit before enforcement.
export function addSecurityHeaders(headers, contentType = "") {
  // Keep stricter existing policies installed by another deployment layer.
  // In particular, never replace a fully configured CSP with this baseline.
  const ensure = (name, value) => { if (!headers.has(name)) headers.set(name, value); };
  headers.set("X-Content-Type-Options", "nosniff");
  ensure("Referrer-Policy", "strict-origin-when-cross-origin");
  ensure("Strict-Transport-Security", "max-age=31536000");
  ensure("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (/^text\/html(?:\s*;|$)/i.test(contentType)) {
    ensure("X-Frame-Options", "DENY");
    // Blocks framed copies, <base> injection and plugin execution without
    // interfering with the script/style paths of existing learning tools.
    ensure("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  }
  return headers;
}

const UNRELATED_STATIC_PATH = /^\/(?:learn|services)(?:\/|$)/i;

function deniedAsset() {
  return new Response("Not found", {
    status: 404,
    headers: addSecurityHeaders(new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    }), "text/plain"),
  });
}

function varyAccept(headers) {
  const existing = headers.get("Vary") || "";
  if (existing !== "*" && !existing.split(",").some((part) => part.trim().toLowerCase() === "accept")) {
    headers.set("Vary", existing ? existing + ", Accept" : "Accept");
  }
}

export default {
  async fetch(request, env) {
    // Learn beta and compiler service files are not public pages of the apex.
    // They are deployed through their own Workers/services. Do not expose
    // those paths by accident via the root asset binding. This does NOT make
    // content already committed to a public GitHub repository confidential.
    if (UNRELATED_STATIC_PATH.test(new URL(request.url).pathname)) return deniedAsset();

    const original = await env.ASSETS.fetch(request);
    const type = original.headers.get("content-type") || "";
    const headers = addSecurityHeaders(new Headers(original.headers), type);
    const originalResponse = () => new Response(
      [204, 205, 304].includes(original.status) || request.method === "HEAD" ? null : original.body,
      { status: original.status, statusText: original.statusText, headers }
    );
    // Preserve the response and error status; protect binary assets too.
    if (!/^text\/html(?:\s*;|$)/i.test(type) || original.status !== 200 || !["GET", "HEAD"].includes(request.method)) {
      return originalResponse();
    }

    varyAccept(headers);
    if (!wantsMarkdown(request.headers.get("Accept"))) {
      return originalResponse();
    }
    // HEAD should negotiate the same representation without sending a body.
    if (request.method === "HEAD") {
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      for (const key of ["Content-Length", "Content-Encoding", "Content-Range", "ETag", "Last-Modified"]) headers.delete(key);
      return new Response(null, { status: 200, headers });
    }
    const html = await original.text();
    const markdown = htmlToMarkdown(html, request.url);
    if (!markdown) return new Response(html, { status: 200, headers });
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    for (const key of ["Content-Length", "Content-Encoding", "Content-Range", "ETag", "Last-Modified"]) headers.delete(key);
    return new Response(markdown, { status: 200, headers });
  },
};
