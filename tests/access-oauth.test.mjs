import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker from "../workers/main-web.mjs";
import { accessConfigured, verifyAccessAssertion } from "../workers/access-auth.mjs";

const root = "https://shieldio.cz";
const team = "https://shieldio-auth-test.cloudflareaccess.com";
const env = { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: "test-audience-tag-123" };
const enc = (input) => Buffer.from(typeof input === "string" ? input : JSON.stringify(input)).toString("base64url");

async function makeJwt(overrides = {}) {
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  jwk.kid = "cf-access-test-key";
  jwk.alg = "RS256";
  jwk.use = "sig";
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: team, aud: [env.ACCESS_AUD], sub: "test-user", iat: now - 5, exp: now + 120,
    ...overrides,
  };
  const data = enc({ alg: "RS256", typ: "JWT", kid: jwk.kid }) + "." + enc(payload);
  const bytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(data));
  const jwt = data + "." + Buffer.from(bytes).toString("base64url");
  const requests = [];
  const fakeFetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify({ keys: [jwk] }), { headers: { "Content-Type": "application/json" } });
  };
  return { jwt, fakeFetch, requests };
}

test("OAuth protected route is disabled unless explicit Access configuration exists", async () => {
  assert.equal(accessConfigured({}), false);
  assert.equal(accessConfigured({ ACCESS_TEAM_DOMAIN: "https://evil.invalid", ACCESS_AUD: "test-audience-tag-123" }), false);
  assert.equal(accessConfigured(env), true);
  const result = await worker.fetch(new Request(root + "/mcp/secure", { method: "POST" }), {
    ASSETS: { fetch() { throw new Error("Must not access public assets"); } },
  });
  assert.equal(result.status, 404);
});

test("Cloudflare Access RS256 JWT must have valid issuer, audience, signature and expiry", async () => {
  const { jwt, fakeFetch, requests } = await makeJwt();
  const request = new Request(root + "/mcp/secure", { headers: { "Cf-Access-Jwt-Assertion": jwt } });
  assert.equal(await verifyAccessAssertion(request, env, fakeFetch), true);
  assert.deepEqual(requests, [team + "/cdn-cgi/access/certs"]);

  const wrongAudience = await makeJwt({ aud: "not-the-audience" });
  assert.equal(await verifyAccessAssertion(
    new Request(root, { headers: { "Cf-Access-Jwt-Assertion": wrongAudience.jwt } }),
    env, wrongAudience.fakeFetch,
  ), false);
  const expired = await makeJwt({ exp: Math.floor(Date.now() / 1000) - 1 });
  assert.equal(await verifyAccessAssertion(
    new Request(root, { headers: { "Cf-Access-Jwt-Assertion": expired.jwt } }),
    env, expired.fakeFetch,
  ), false);
  const tampered = jwt.slice(0, -2) + (jwt.at(-2) === "X" ? "Y" : "X") + jwt.at(-1);
  assert.equal(await verifyAccessAssertion(
    new Request(root, { headers: { "Cf-Access-Jwt-Assertion": tampered } }),
    env, fakeFetch,
  ), false);
});

test("Protected MCP does not delegate without a signed Access assertion", async () => {
  const runtime = { ...env, ASSETS: { fetch() { throw new Error("No assets"); } } };
  const response = await worker.fetch(
    new Request(root + "/mcp/secure", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) }),
    runtime,
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});

test("Valid Access JWT permits the existing read-only MCP methods", async () => {
  const { jwt, fakeFetch } = await makeJwt();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fakeFetch;
  try {
    const runtime = {
      ...env,
      ASSETS: { fetch() { throw new Error("MCP initialization must not request assets"); } },
    };
    const response = await worker.fetch(new Request(root + "/mcp/secure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Cf-Access-Jwt-Assertion": jwt,
      },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } },
      }),
    }), runtime);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const rpc = await response.json();
    assert.equal(rpc.result.serverInfo.name, "cz.shieldio/mcp");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Discovery is not faked: Cloudflare Access provisions the real OAuth server", () => {
  const docs = readFileSync(new URL("../docs/deployment/oauth-access.md", import.meta.url), "utf8");
  assert.match(docs, /Cloudflare Access Managed OAuth/);
  assert.match(docs, /oauth-authorization-server/);
  assert.match(docs, /authorization_endpoint/);
  assert.match(docs, /jwks_uri/);
  assert.match(docs, /ACCESS_AUD/);
  assert.match(docs, /ACCESS_TEAM_DOMAIN/);
  assert.match(docs, /zitagentready|isitagentready/i);
});
