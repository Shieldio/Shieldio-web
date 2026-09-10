// Shieldio Learn runs as a separate Worker while reusing this repository's assets.
// Public /maturita URLs are mapped to the isolated /learn static tree.
const STATIC_PREFIX = "/learn";
const SHARED_PATHS = ["/assets/", "/favicon.ico"];
const ACCESS_PATH = "/maturita/pristup/";
const ACCESS_COOKIE = "shieldio_elektro_beta";
const ACCESS_SCOPE = "electronics-beta-v1";

function isElectronicsPath(pathname) {
  return pathname === "/maturita/elektronika/" || /^\/maturita\/otazka\/elektronika-[^/]+\/$/.test(pathname);
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const item = header.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

async function hmac(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function accessPage(next, failed = false) {
  const safeNext = isElectronicsPath(next) ? next : "/maturita/elektronika/";
  return new Response(`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Beta přístup | Shieldio Learn</title><link rel="icon" href="/assets/icons/favicon.svg"><style>:root{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif;background:#f7f7f8;color:#171719}@media(prefers-color-scheme:dark){:root{background:#000;color:#f5f5f7}}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}.gate{width:min(480px,100%);padding:clamp(28px,7vw,48px);border:1px solid #dedee2;border-radius:28px;background:color-mix(in srgb,currentColor 3%,transparent);box-shadow:0 24px 80px #0002}.brand{display:flex;align-items:center;gap:12px;margin-bottom:42px;font:700 13px ui-monospace,monospace;letter-spacing:.08em}.brand img{width:132px}.eyebrow{color:#f72338;font:700 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em}h1{margin:12px 0 14px;font-size:clamp(36px,9vw,56px);line-height:.98;letter-spacing:-.05em}p{line-height:1.6;opacity:.7}label{display:grid;gap:9px;margin-top:28px;font-weight:700}input{width:100%;padding:17px 18px;border:1px solid #aaa;border-radius:14px;background:transparent;color:inherit;font:700 24px ui-monospace,monospace;letter-spacing:.35em;text-align:center}button{width:100%;margin-top:14px;padding:15px;border:0;border-radius:999px;background:#f72338;color:#fff;font:800 15px inherit;cursor:pointer}.error{color:#f72338;opacity:1;font-weight:700}.hint{font-size:13px}</style></head><body><main class="gate"><div class="brand"><img src="/assets/icons/logo-full-color.svg" alt="Shieldio"><span>LEARN</span></div><span class="eyebrow">Uzavřený betatest</span><h1>Elektronika je zatím na kód.</h1><p>Výukové otázky právě ověřujeme. Pokud máš beta kód, zadej jej níže.</p>${failed ? '<p class="error" role="alert">Tento kód nesouhlasí. Zkontroluj všech pět číslic.</p>' : ''}<form method="post" action="${ACCESS_PATH}"><input type="hidden" name="next" value="${safeNext}"><label>Pětimístný přístupový kód<input name="code" type="password" inputmode="numeric" pattern="[0-9]{5}" minlength="5" maxlength="5" autocomplete="one-time-code" required autofocus></label><button type="submit">Odemknout elektroniku</button></form><p class="hint">Přístup zůstane v tomto prohlížeči uložený 30 dní.</p></main></body></html>`, { status: failed ? 401 : 200, headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

async function hasElectronicsAccess(request, env) {
  if (!env.LEARN_SESSION_SECRET) return false;
  const actual = readCookie(request, ACCESS_COOKIE);
  const expected = await hmac(ACCESS_SCOPE, env.LEARN_SESSION_SECRET);
  return safeEqual(actual, expected);
}

function seoTransform(response, page) {
  if (!page) return response;
  return new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(`${page.title} | Shieldio Learn`); } })
    .on('meta[name="robots"]', { element(element) { element.remove(); } })
    .on("head", { element(element) {
      element.append(`<meta name="description" content="${page.description}"><link rel="canonical" href="${page.url}"><meta property="og:type" content="article"><meta property="og:site_name" content="Shieldio Learn"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="${page.url}"><meta property="og:image" content="https://shieldio.cz/assets/images/og-image.png"><meta name="twitter:card" content="summary_large_image">`, { html: true });
    } })
    .transform(response);
}

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === ACCESS_PATH && request.method === "POST") {
      const form = await request.formData();
      const code = String(form.get("code") || "");
      const next = String(form.get("next") || "/maturita/elektronika/");
      if (!env.LEARN_BETA_CODE || !env.LEARN_SESSION_SECRET || !safeEqual(code, env.LEARN_BETA_CODE)) return accessPage(next, true);
      const token = await hmac(ACCESS_SCOPE, env.LEARN_SESSION_SECRET);
      return new Response(null, { status: 303, headers: { location: isElectronicsPath(next) ? next : "/maturita/elektronika/", "set-cookie": `${ACCESS_COOKIE}=${token}; Path=/maturita/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`, "cache-control": "no-store" } });
    }

    const normalizedPath = url.pathname.replace(/\/index\.html$/, "/");
    if (isElectronicsPath(normalizedPath) && !(await hasElectronicsAccess(request, env))) return accessPage(`${normalizedPath}${url.search}`);

    if (url.pathname === "/sitemap.xml") {
      const dataResponse = await env.ASSETS.fetch(assetRequest(request, "/assets/data/learn-questions.json"));
      const data = await dataResponse.json();
      const fixedPaths = ["/", "/maturita/", "/maturita/automatizace/"];
      const topicPaths = data.questions.filter(topic => topic.subject !== "elektronika").map(topic => `/maturita/otazka/${topic.slug}/`);
      const urls = [...fixedPaths, ...topicPaths].map(path => `  <url><loc>https://learn.shieldio.cz${path}</loc><changefreq>${path.includes("/otazka/") ? "weekly" : "monthly"}</changefreq></url>`).join("\n");
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
        headers: { "content-type": "application/xml; charset=UTF-8", "cache-control": "public, max-age=3600" }
      });
    }

    if (SHARED_PATHS.some(prefix => url.pathname.startsWith(prefix))) {
      return env.ASSETS.fetch(request);
    }

    let publicPath = url.pathname.replace(/\/index\.html$/, "/");
    if (!publicPath.endsWith("/") && !publicPath.split("/").pop().includes(".")) {
      return Response.redirect(`${url.origin}${publicPath}/${url.search}`, 308);
    }

    let assetPath;
    let seoPage = null;
    const topicMatch = publicPath.match(/^\/maturita\/otazka\/([^/]+)\/$/);
    if (topicMatch) {
      assetPath = `${STATIC_PREFIX}/maturita/otazka/`;
      const dataResponse = await env.ASSETS.fetch(assetRequest(request, "/assets/data/learn-questions.json"));
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        const topic = data.questions.find(item => item.slug === topicMatch[1]);
        if (topic) seoPage = {
          title: topic.title,
          description: `Maturitní okruh ${topic.number}: ${topic.title}. Výklad, názorné prvky, vzorce, příklady a ověření znalostí.`,
          url: `https://learn.shieldio.cz${publicPath}`
        };
      }
    } else if (publicPath.endsWith("/")) {
      assetPath = `${STATIC_PREFIX}${publicPath}`;
    } else {
      assetPath = `${STATIC_PREFIX}${publicPath}`;
    }

    const response = await env.ASSETS.fetch(assetRequest(request, assetPath));
    if (response.status !== 404) return seoTransform(response, seoPage);
    const notFound = await env.ASSETS.fetch(assetRequest(request, `${STATIC_PREFIX}/404.html`));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};
