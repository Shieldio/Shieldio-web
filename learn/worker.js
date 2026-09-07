// Shieldio Learn runs as a separate Worker while reusing this repository's assets.
// Public /maturita URLs are mapped to the isolated /learn static tree.
const STATIC_PREFIX = "/learn";
const SHARED_PATHS = ["/assets/", "/favicon.ico"];

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
