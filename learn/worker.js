// Shieldio Learn runs as a separate Worker while reusing this repository's assets.
// Public /maturita URLs are mapped to the isolated /learn static tree.
const STATIC_PREFIX = "/learn";
const SHARED_PATHS = ["/assets/", "/favicon.ico"];

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (SHARED_PATHS.some(prefix => url.pathname.startsWith(prefix))) {
      return env.ASSETS.fetch(request);
    }

    let publicPath = url.pathname.replace(/\/index\.html$/, "/");
    if (!publicPath.endsWith("/") && !publicPath.split("/").pop().includes(".")) {
      return Response.redirect(`${url.origin}${publicPath}/${url.search}`, 308);
    }

    let assetPath;
    if (/^\/maturita\/otazka\/[^/]+\/$/.test(publicPath)) {
      assetPath = `${STATIC_PREFIX}/maturita/otazka/index.html`;
    } else if (publicPath.endsWith("/")) {
      assetPath = `${STATIC_PREFIX}${publicPath}index.html`;
    } else {
      assetPath = `${STATIC_PREFIX}${publicPath}`;
    }

    const response = await env.ASSETS.fetch(assetRequest(request, assetPath));
    if (response.status !== 404) return response;
    const notFound = await env.ASSETS.fetch(assetRequest(request, `${STATIC_PREFIX}/404.html`));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};
