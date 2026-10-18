// Only embed routes execute this Worker; all other requests remain static assets.
export const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' https://flight360-media.shieldio.cz; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors *",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/embed" && !url.pathname.startsWith("/embed/")) {
      return env.ASSETS.fetch(request);
    }
    const headers = new Headers({
      ...securityHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    });
    // Do not inherit a frame-blocking header from the gallery or asset response.
    headers.delete("X-Frame-Options");
    const reply = (body, status = 200) => new Response(request.method === "HEAD" ? null : body, {status, headers});
    const failure = (message, status) => reply(`<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Flight360</title><body><h1>Flight360</h1><p>${message}</p><a href="/" target="_blank" rel="noopener">Otevřít Flight360</a></body></html>`, status);
    if (!["GET", "HEAD"].includes(request.method)) {
      headers.set("Allow", "GET, HEAD");
      return failure("Tato metoda není podporovaná.", 405);
    }
    const match = /^\/embed\/([a-zA-Z0-9_-]+)\/?$/.exec(url.pathname);
    if (!match) return failure("Tato prohlídka není dostupná. Zkontrolujte odkaz.", 404);
    const asset = path => env.ASSETS.fetch(new Request(new URL(path, url.origin)));
    try {
      const manifest = await asset("/videos.json");
      if (!manifest.ok) throw new Error("Manifest unavailable");
      const scenes = await manifest.json();
      const scene = Array.isArray(scenes) && scenes.find(s => s && s.id === match[1] && typeof s.title === "string" && s.published !== false && typeof s.url === "string" && s.url);
      if (!scene) return failure("Tato prohlídka zatím není zveřejněná nebo neexistuje.", 404);
      const source = new URL(scene.url, url.origin + "/");
      if (![url.origin, "https://flight360-media.shieldio.cz"].includes(source.origin) || !["https:", "http:"].includes(source.protocol) || source.username || source.password) {
        throw new Error("Invalid media source");
      }
      const page = await asset("/");
      if (!page.ok) throw new Error("Player unavailable");
      // Render the same player with embed styling from the first paint.
      const html = (await page.text()).replace("<body>", '<body class="embed">');
      return reply(html);
    } catch {
      return failure("Prohlídku se nepodařilo načíst. Zkuste to za chvíli znovu.", 503);
    }
  },
};
