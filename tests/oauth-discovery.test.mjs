import assert from "node:assert/strict";
import test from "node:test";
import { validateOAuthDiscovery, checkOAuthDiscovery } from "../scripts/verify-oauth-discovery.mjs";

const origin = "https://shieldio.cz";
const metadata = {
  issuer: origin,
  authorization_endpoint: origin + "/oauth/authorize",
  token_endpoint: origin + "/oauth/token",
  jwks_uri: origin + "/oauth/jwks",
  grant_types_supported: ["authorization_code"],
  response_types_supported: ["code"],
};

test("RFC 8414 validates real issuer, endpoints, grants, and JWKS", async () => {
  assert.equal(validateOAuthDiscovery(metadata, origin), true);
  const seen = [];
  const fetcher = async (url) => {
    seen.push(url);
    if (url.endsWith("/.well-known/oauth-authorization-server")) {
      return new Response(JSON.stringify(metadata), { headers: { "Content-Type": "application/json" } });
    }
    if (url === metadata.jwks_uri) {
      return new Response(JSON.stringify({ keys: [{ kty: "RSA", kid: "key" }] }), { headers: { "Content-Type": "application/json" } });
    }
    throw new Error("Unexpected URL");
  };
  await checkOAuthDiscovery(origin, fetcher);
  assert.deepEqual(seen, [origin + "/.well-known/oauth-authorization-server", metadata.jwks_uri]);
});

test("Reject guessed, inconsistent, or incomplete OAuth metadata", async () => {
  assert.throws(() => validateOAuthDiscovery({ ...metadata, issuer: "https://evil.test" }, origin), /Issuer/);
  assert.throws(() => validateOAuthDiscovery({ ...metadata, token_endpoint: undefined }, origin), /token_endpoint/);
  assert.throws(() => validateOAuthDiscovery({ ...metadata, grant_types_supported: [] }, origin), /grant_types_supported/);
  assert.throws(() => validateOAuthDiscovery({ ...metadata, response_types_supported: ["token"] }, origin), /Authorization Code/);
  await assert.rejects(() => checkOAuthDiscovery(origin, async () => new Response("<html>not found</html>", {
    status: 404, headers: { "Content-Type": "text/html" },
  })), /HTTP 200/);
});
