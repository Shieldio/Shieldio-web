// Shieldio Learn runs as a separate Worker while reusing this repository's assets.
// Public /maturita URLs are mapped to the isolated /learn static tree.
const STATIC_PREFIX = "/learn";
const SHARED_PATHS = ["/assets/", "/favicon.ico"];
const probeAttempts = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function cookieHeader(headers, jar) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function cookies(jar) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

function jsonArgument(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return null;
  const start = source.indexOf("{", markerAt + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  return null;
}

function publicGrades(gradeData, userData) {
  const details = gradeData?.vsetkyUdalosti?.edupage || {};
  const subjects = userData?.dbi?.subjects || {};
  return (Array.isArray(gradeData?.vsetkyZnamky) ? gradeData.vsetkyZnamky : [])
    .slice(0, 200)
    .flatMap(grade => {
      const detail = details[String(grade?.udalostid)] || {};
      const subjectId = String(detail.PredmetID || "");
      if (!subjectId || subjectId === "vsetky") return [];
      const type = String(detail.p_typ_udalosti || "");
      const rawValue = String(grade.data || "").split(" (", 1)[0].trim();
      if (!rawValue) return [];
      const numeric = value => Number.isFinite(Number(value)) ? Number(value) : null;
      return [{
        subject: String(subjects[subjectId]?.short || subjects[subjectId]?.name || `Předmět ${subjectId}`),
        value: rawValue,
        date: String(grade.datum || "").slice(0, 10),
        kind: type === "2" ? "points" : type === "3" ? "percent" : "grade",
        weight: type === "1" || type === "3" ? (numeric(detail.p_vaha) === null ? null : numeric(detail.p_vaha) / 20) : null,
        maxPoints: type === "2" ? numeric(detail.p_vaha) : type === "3" ? numeric(detail.p_vaha_body) : null,
      }];
    });
}

async function edupageFetch(url, options, jar) {
  const headers = new Headers(options?.headers || {});
  const currentCookies = cookies(jar);
  if (currentCookies) headers.set("cookie", currentCookies);
  const response = await fetch(url, { ...options, headers, redirect: "manual" });
  cookieHeader(response.headers, jar);
  return response;
}

async function followEdupage(response, jar, limit = 5) {
  let current = response;
  for (let index = 0; index < limit && current.status >= 300 && current.status < 400; index += 1) {
    const location = current.headers.get("location");
    if (!location) break;
    current = await edupageFetch(new URL(location, current.url), { method: "GET" }, jar);
  }
  return current;
}

async function probeEdupage(request, env) {
  if (env.EDUPAGE_ENABLED !== "true") return json({ ok: false, code: "disabled", message: "Test připojení není zapnutý." }, 503);
  const origin = request.headers.get("origin");
  if (origin !== "https://stage.learn.shieldio.cz") return json({ ok: false, code: "origin", message: "Požadavek přišel z nepovolené stránky." }, 403);
  const client = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const recent = (probeAttempts.get(client) || []).filter(time => now - time < 10 * 60 * 1000);
  if (recent.length >= 5) return json({ ok: false, code: "rate", message: "Příliš mnoho pokusů. Zkuste to znovu za deset minut." }, 429);
  recent.push(now);
  probeAttempts.set(client, recent);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, code: "input", message: "Neplatná data formuláře." }, 400); }
  const school = String(body.school || "").trim().toLowerCase().replace(/\.edupage\.org\/?$/, "");
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!/^[a-z0-9-]{1,63}$/.test(school) || !username || username.length > 160 || !password || password.length > 300) {
    return json({ ok: false, code: "input", message: "Zkontrolujte adresu školy, uživatelské jméno a heslo." }, 400);
  }

  const base = `https://${school}.edupage.org`;
  const jar = new Map();
  try {
    const loginPage = await edupageFetch(`${base}/login/?cmd=MainLogin`, { method: "GET" }, jar);
    if (!loginPage.ok) return json({ ok: false, code: "school", message: "Přihlašovací stránka školy neodpověděla." }, 502);
    const html = await loginPage.text();
    const csrf = html.match(/"csrftoken"\s*:\s*"([^"]+)"/)?.[1];
    if (!csrf) return json({ ok: false, code: "protocol", message: "EduPage změnil přihlašovací stránku. Připojení je potřeba aktualizovat." }, 502);

    const form = new URLSearchParams({ csrfauth: csrf, username, password });
    let result = await edupageFetch(`${base}/login/edubarLogin.php`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    }, jar);
    result = await followEdupage(result, jar);
    const finalUrl = result.url || "";
    const resultHtml = await result.text();
    if (finalUrl.includes("twofactor")) return json({ ok: false, code: "twofactor", message: "Účet vyžaduje druhý faktor. První krok přihlášení funguje; podporu 2FA doplníme zvlášť." }, 409);
    if (finalUrl.includes("cap=1") || finalUrl.includes("lerr=b43b43")) return json({ ok: false, code: "captcha", message: "EduPage vyžádal CAPTCHA. Automatické připojení pro tento účet nyní nelze dokončit." }, 409);
    if (finalUrl.includes("bad=1")) return json({ ok: false, code: "credentials", message: "EduPage přihlášení odmítl. Zkontrolujte údaje." }, 401);
    if (!resultHtml.includes("userhome(") || !jar.has("PHPSESSID")) return json({ ok: false, code: "protocol", message: "Přihlášení nebylo potvrzeno. EduPage mohl změnit svůj postup." }, 502);
    const userData = jsonArgument(resultHtml, "userhome(");
    const gradesPage = await edupageFetch(`${base}/znamky/`, { method: "GET" }, jar);
    if (!gradesPage.ok) return json({ ok: false, code: "grades", message: "Přihlášení funguje, ale stránku se známkami se nepodařilo načíst." }, 502);
    const gradeData = jsonArgument(await gradesPage.text(), ".znamkyStudentViewer(");
    if (!gradeData) return json({ ok: false, code: "grades-format", message: "Přihlášení funguje, ale formát známek tento účet neposkytl v očekávané podobě." }, 502);
    const grades = publicGrades(gradeData, userData);
    return json({ ok: true, message: `Připojení funguje. Načteno známek: ${grades.length}. Údaje ani relace nebyly uloženy.`, grades });
  } catch {
    return json({ ok: false, code: "network", message: "Spojení s EduPage se nepodařilo dokončit. Zkuste to znovu později." }, 502);
  }
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

    if (url.pathname === "/api/edupage/probe" && request.method === "POST") {
      return probeEdupage(request, env);
    }

    if (url.pathname === "/sitemap.xml") {
      const dataResponse = await env.ASSETS.fetch(assetRequest(request, "/assets/data/learn-questions.json"));
      const data = await dataResponse.json();
      const fixedPaths = ["/", "/maturita/", "/maturita/elektronika/", "/maturita/automatizace/"];
      const topicPaths = data.questions.map(topic => `/maturita/otazka/${topic.slug}/`);
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
