// Shieldio WebMCP — public, read-only discovery and explicitly requested navigation.
// Works with the current document.modelContext API and the older navigator version.
// No credentials, private routes, form submission, code execution or USB upload.
(() => {
  "use strict";
  if (typeof document === "undefined" || typeof navigator === "undefined" || typeof window === "undefined") return;

  const current = document.modelContext;
  const legacy = navigator.modelContext;
  if (typeof current?.registerTool !== "function" && typeof legacy?.registerTool !== "function") return;

  const controller = new AbortController();
  window.addEventListener("pagehide", () => controller.abort(), { once: true });

  const indexUrl = "/assets/data/search-index.json";
  const normalize = (value) => String(value).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

  // Only public, indexed pages are eligible for reading and navigation.
  function safePath(path) {
    return typeof path === "string" &&
      /^\/(?!\/)[a-zA-Z0-9/_.-]+$/.test(path) &&
      !path.split("/").includes("..") &&
      !path.includes("//");
  }

  let cachedIndex = null;
  async function getIndex(signal) {
    if (cachedIndex) return cachedIndex;
    const response = await fetch(indexUrl, {
      cache: "no-cache", credentials: "omit", signal,
    });
    if (!response.ok) throw new Error("Veřejný vyhledávací index není dostupný.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Index má neplatný formát.");
    const entries = data.filter(item => item && safePath(item.url) &&
      typeof item.title === "string" && typeof item.desc === "string")
      .slice(0, 200);
    cachedIndex = entries;
    return entries;
  }

  function publicUrl(path) {
    return new URL(path, window.location.origin).href;
  }
  async function indexedPage(path, signal) {
    if (!safePath(path)) return null;
    const index = await getIndex(signal);
    return index.find(item => item.url === path) || null;
  }
  function resultError(error) {
    return { ok: false, error: error?.name === "AbortError" ?
      "Operace byla zrušena." : "Veřejný zdroj nelze načíst." };
  }

  const tools = [
    {
      name: "shieldio_search_site",
      description: "Vyhledej veřejné stránky Shieldio podle názvu, součástky, tématu nebo projektu. Vrací názvy, popisy a odkazy; bez přihlášení a změn na webu.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", minLength: 1, maxLength: 120,
            description: "Hledaná slova, např. servo, LED, závora, OLED nebo Arduino." },
          limit: { type: "integer", minimum: 1, maximum: 10,
            description: "Počet výsledků, standardně 8." },
        },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input = {}, options = {}) => {
        const query = typeof input.query === "string" ? input.query.trim() : "";
        if (!query || query.length > 120) return { ok: false, error: "Dotaz musí mít 1 až 120 znaků." };
        const q = normalize(query);
        if (!q) return { ok: false, error: "Dotaz neobsahuje hledatelná slova." };
        const limit = Number.isInteger(input.limit) ? Math.max(1, Math.min(10, input.limit)) : 8;
        try {
          const index = await getIndex(options.signal);
          const terms = q.split(/\s+/);
          const matches = index.map((entry, order) => {
            const title = normalize(entry.title);
            const desc = normalize(entry.desc);
            const keywords = normalize(Array.isArray(entry.keywords) ? entry.keywords.join(" ") : "");
            if (!terms.every(term => `${title} ${desc} ${keywords}`.includes(term))) return null;
            const score = (title === q ? 100 : title.includes(q) ? 60 : 0) +
              (keywords.includes(q) ? 60 : 0) + (entry.kind === "project" ? 25 : 0) +
              (desc.includes(q) ? 10 : 0);
            return { entry, order, score };
          }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order);
          return { ok: true, query, total: matches.length, results: matches.slice(0, limit)
            .map(({ entry }) => ({ title: entry.title, description: entry.desc, url: publicUrl(entry.url) })) };
        } catch (error) { return resultError(error); }
      },
    },
    {
      name: "shieldio_list_resources",
      description: "Vypiš veřejné návody, projekty RED, lekce elektroniky, programovací materiály, produkty nebo zdroje pro školy ze skutečného indexu webu.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["projects", "electronics", "programming", "products", "schools"],
            description: "Typ veřejného obsahu." },
        },
        required: ["category"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input = {}, options = {}) => {
        const category = input.category;
        const filters = {
          projects: p => p.startsWith("/instructions/baseline/red/"),
          electronics: p => p.startsWith("/instructions/jak-to-funguje/"),
          programming: p => p.startsWith("/instructions/programovani/") || p === "/instructions/blokovy-editor.html",
          products: p => p.startsWith("/products/"),
          schools: p => p.startsWith("/edu/") || p === "/company/pro-ucitele.html" || p === "/company/metodika-zavora.html",
        };
        if (!Object.hasOwn(filters, category)) return { ok: false, error: "Neznámá kategorie." };
        try {
          const index = await getIndex(options.signal);
          const results = index.filter(entry => filters[category](entry.url))
            .map(entry => ({ title: entry.title, description: entry.desc, url: publicUrl(entry.url) }));
          return { ok: true, category, results };
        } catch (error) { return resultError(error); }
      },
    },
    {
      name: "shieldio_read_public_page",
      description: "Přečti text veřejné stránky Shieldio z její Markdown reprezentace. Cesta musí být v indexu webu. Nečte účty, soubory uživatele ani chráněné oblasti.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", maxLength: 200,
            description: "Cesta z výsledku vyhledávání, například /instructions/programovani/index.html." },
        },
        required: ["path"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input = {}, options = {}) => {
        try {
          const entry = await indexedPage(input.path, options.signal);
          if (!entry) return { ok: false, error: "Stránka není ve veřejném indexu Shieldio." };
          const response = await fetch(entry.url, {
            headers: { Accept: "text/markdown" }, cache: "no-cache",
            credentials: "omit", redirect: "error", signal: options.signal,
          });
          if (!response.ok || !/^text\/markdown(?:\s*;|$)/i.test(response.headers.get("Content-Type") || "")) {
            return { ok: false, error: "Stránka nemá dostupnou textovou reprezentaci." };
          }
          const content = await response.text();
          return { ok: true, title: entry.title, url: publicUrl(entry.url),
            content: content.slice(0, 6000), truncated: content.length > 6000 };
        } catch (error) { return resultError(error); }
      },
    },
    {
      name: "shieldio_open_page",
      description: "Otevři ve stejné kartě veřejnou stránku Shieldio z výsledků vyhledávání. Jen navigace; nic neodesílá, nenakupuje a nenahrává do hardware.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", maxLength: 200,
            description: "Přesná cesta veřejné stránky z indexu Shieldio." },
        },
        required: ["path"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input = {}, options = {}) => {
        try {
          const entry = await indexedPage(input.path, options.signal);
          if (!entry) return { ok: false, error: "Lze otevřít jen veřejnou stránku z indexu." };
          if (options.signal?.aborted) return { ok: false, error: "Operace byla zrušena." };
          const url = publicUrl(entry.url);
          window.location.assign(url);
          return { ok: true, navigatingTo: url };
        } catch (error) { return resultError(error); }
      },
    },
  ];

  // Latest Chromium exposes document.modelContext. Legacy previews exposed
  // navigator.modelContext. Use one provider, never double-register.
  for (const tool of tools) {
    try {
      const promise = typeof document.modelContext?.registerTool === "function"
        ? document.modelContext.registerTool(tool, { signal: controller.signal })
        : navigator.modelContext.registerTool(tool, { signal: controller.signal });
      Promise.resolve(promise).catch(() => {
        // Feature can be disabled by the user agent or permissions policy.
        // Browsers without WebMCP keep the normal website unchanged.
      });
    } catch {
      // Never break the page if experimental browser APIs are unavailable.
    }
  }
})();
