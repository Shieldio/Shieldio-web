// Stateless, read-only Streamable HTTP MCP endpoint for public Shieldio resources.
// No tokens, private records, user data or external URL fetching.
export const SERVER_INFO = Object.freeze({
  name: "cz.shieldio/mcp",
  title: "Shieldio Public Learning",
  version: "1.0.0",
});
export const PROTOCOL_VERSION = "2025-06-18";
const ROOT = "https://shieldio.cz";
const CARD_PATH = "/.well-known/mcp/server-card.json";

const RESOURCES = Object.freeze([
  {
    uri: ROOT + "/llms.txt",
    name: "Shieldio public index",
    description: "Verified public project status, RED programming, guides and links.",
    mimeType: "text/plain",
    path: "/llms.txt",
  },
  {
    uri: ROOT + "/api/simulation-openapi.json",
    name: "Shieldio Simulation API description",
    description: "Published OpenAPI description of the simulation health endpoint.",
    mimeType: "application/json",
    path: "/api/simulation-openapi.json",
  },
  {
    uri: "mcp://server-card.json",
    name: "MCP Server Card",
    description: "Canonical, versioned discovery information for this MCP server.",
    mimeType: "application/json",
  },
]);

const TOOLS = Object.freeze([
  {
    name: "get_shieldio_index",
    description: "Read Shieldio's public AI index, with current product status and verified learning links. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "find_shieldio_resources",
    description: "Search public Shieldio index lines for guides, projects or programming topics. No arbitrary URL access.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Topic or keyword", minLength: 2, maxLength: 120 } },
      required: ["query"],
      additionalProperties: false,
    },
  },
]);
const PROMPTS = Object.freeze([
  {
    name: "start_learning_shieldio_red",
    description: "Structure a beginner RED lesson using the verified public Shieldio index.",
    arguments: [{ name: "goal", description: "Optional learning goal", required: false }],
  },
]);

export function legacyCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: PROTOCOL_VERSION,
    serverInfo: SERVER_INFO,
    description: "Read-only public documentation and learning resources for Shieldio electronics.",
    documentationUrl: ROOT + "/api/",
    transport: { type: "streamable-http", endpoint: ROOT + "/mcp" },
    capabilities: { tools: {}, resources: {}, prompts: {} },
    authentication: { required: false },
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    resources: RESOURCES.map(({ uri, name, mimeType, description }) => ({ uri, name, mimeType, description })),
    prompts: PROMPTS,
  };
}

// Versioned SEP-2127 extension format intentionally omits capabilities/primitives;
// those are enumerated and negotiated via MCP at runtime.
export function currentCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: SERVER_INFO.name,
    title: SERVER_INFO.title,
    description: "Read public Shieldio electronics guides, project links and programming references.",
    version: SERVER_INFO.version,
    websiteUrl: ROOT,
    repository: {
      source: "github",
      url: "https://github.com/Shieldio/Shieldio-web",
      subfolder: "workers",
    },
    remotes: [{
      type: "streamable-http",
      url: ROOT + "/mcp",
      supportedProtocolVersions: [PROTOCOL_VERSION],
    }],
  };
}

function cardResponse(request, card, canonical) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const type = canonical ? "application/mcp-server-card+json; charset=utf-8" : "application/json; charset=utf-8";
  return new Response(request.method === "HEAD" ? null : JSON.stringify(card, null, 2) + "\n", {
    status: 200,
    headers: {
      "Content-Type": type,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}

function originAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // Non-browser MCP clients do not send Origin.
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "shieldio.cz" || parsed.hostname === "www.shieldio.cz" ||
       parsed.hostname === "shieldio-web.swwzr5pj2f.workers.dev");
  } catch { return false; }
}
function rpcHeaders(request) {
  const h = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
  if (request.headers.has("Origin") && originAllowed(request)) {
    h.set("Access-Control-Allow-Origin", request.headers.get("Origin"));
  }
  return h;
}
function rpcResponse(request, id, result, error = null) {
  return new Response(JSON.stringify({
    jsonrpc: "2.0", id, ...(error ? { error } : { result }),
  }), { status: 200, headers: rpcHeaders(request) });
}
function rpcError(request, id, code, message) {
  return rpcResponse(request, id, null, { code, message });
}
function textResult(text, isError = false) {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) };
}
async function assetText(env, path) {
  // Path is always selected from the fixed allowlist above; never user input.
  const response = await env.ASSETS.fetch(new Request(ROOT + path, { method: "GET" }));
  if (response.status !== 200) throw new Error("Veřejný zdroj není nyní dostupný.");
  const content = await response.text();
  // Avoid returning very large documents to a client in a single JSON-RPC result.
  return content.slice(0, 50000);
}

async function invoke(request, env, call) {
  const { id, method } = call;
  const params = call.params && typeof call.params === "object" && !Array.isArray(call.params) ? call.params : {};
  switch (method) {
    case "initialize":
      return rpcResponse(request, id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: SERVER_INFO,
        instructions: "Veřejné podklady Shieldio; stav produktu a návody ověřuj podle llms.txt. Žádné soukromé ani zapisovací akce.",
      });
    case "ping":
      return rpcResponse(request, id, {});
    case "tools/list":
      return rpcResponse(request, id, { tools: TOOLS });
    case "resources/list":
      return rpcResponse(request, id, { resources: RESOURCES.map(({ path, ...entry }) => entry) });
    case "prompts/list":
      return rpcResponse(request, id, { prompts: PROMPTS });
    case "resources/read": {
      const resource = RESOURCES.find((item) => item.uri === params.uri);
      if (!resource) return rpcError(request, id, -32602, "Unknown resource URI");
      try {
        const text = resource.path ? await assetText(env, resource.path) : JSON.stringify(currentCard(), null, 2);
        return rpcResponse(request, id, { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text }] });
      } catch { return rpcError(request, id, -32603, "Public resource unavailable"); }
    }
    case "tools/call": {
      if (params.name !== "get_shieldio_index" && params.name !== "find_shieldio_resources") {
        return rpcError(request, id, -32602, "Unknown tool");
      }
      const args = params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments) ? params.arguments : {};
      if (params.name === "find_shieldio_resources" &&
          (typeof args.query !== "string" || args.query.trim().length < 2 || args.query.length > 120)) {
        return rpcError(request, id, -32602, "query must be a string between 2 and 120 characters");
      }
      try {
        const index = await assetText(env, "/llms.txt");
        if (params.name === "get_shieldio_index") return rpcResponse(request, id, textResult(index));
        const q = args.query.trim().toLocaleLowerCase("cs");
        const results = index.split("\n").filter((line) => line.toLocaleLowerCase("cs").includes(q)).slice(0, 20);
        const text = results.length ? results.join("\n") : "Pro dotaz nebyly nalezeny záznamy. Kompletní index: " + ROOT + "/llms.txt";
        return rpcResponse(request, id, textResult(text));
      } catch { return rpcResponse(request, id, textResult("Veřejný index je dočasně nedostupný.", true)); }
    }
    case "prompts/get": {
      if (params.name !== "start_learning_shieldio_red") return rpcError(request, id, -32602, "Unknown prompt");
      const goal = typeof params.arguments?.goal === "string" ? params.arguments.goal.slice(0, 160) : "základy elektroniky";
      return rpcResponse(request, id, {
        description: "Úvod do Shieldio RED s aktuálními informacemi",
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: "Připrav úvodní výukový plán Shieldio RED na téma: " + goal +
              ". Nejdřív vycházej z https://shieldio.cz/llms.txt a jeho veřejných odkazů. " +
              "Vývojovou desku nepovažuj za produkt v prodeji a nerozšiřuj schopnosti editoru nad dokumentaci.",
          },
        }],
      });
    }
    default:
      return rpcError(request, id, -32601, "Method not found");
  }
}

async function mcpRpc(request, env) {
  if (!originAllowed(request)) return new Response("Forbidden origin", { status: 403, headers: rpcHeaders(request) });
  if (request.method === "OPTIONS") {
    const headers = rpcHeaders(request);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "content-type, accept, mcp-protocol-version, mcp-session-id");
    headers.delete("Content-Type");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS" } });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || "")) {
    return new Response("Expected application/json", { status: 415, headers: rpcHeaders(request) });
  }
  if (Number(request.headers.get("Content-Length") || "0") > 32768) {
    return new Response("Request too large", { status: 413, headers: rpcHeaders(request) });
  }
  let call;
  try {
    const raw = await request.text();
    if (raw.length > 32768) return new Response("Request too large", { status: 413, headers: rpcHeaders(request) });
    call = JSON.parse(raw);
  } catch { return rpcError(request, null, -32700, "Parse error"); }
  if (!call || Array.isArray(call) || typeof call !== "object" || call.jsonrpc !== "2.0" ||
      typeof call.method !== "string") {
    return rpcError(request, null, -32600, "Invalid JSON-RPC request");
  }
  if (!Object.hasOwn(call, "id")) {
    // Sessionless notifications are acknowledged without a JSON-RPC result.
    return new Response(null, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
  if (typeof call.id !== "string" && typeof call.id !== "number") {
    return rpcError(request, null, -32600, "Invalid request ID");
  }
  return invoke(request, env, call);
}

export function handleMcpRequest(request, env) {
  const path = new URL(request.url).pathname;
  if (path === CARD_PATH) return cardResponse(request, legacyCard(), false);
  if (path === "/mcp/server-card") return cardResponse(request, currentCard(), true);
  if (path === "/mcp") return mcpRpc(request, env);
  return new Response("Not found", { status: 404 });
}
