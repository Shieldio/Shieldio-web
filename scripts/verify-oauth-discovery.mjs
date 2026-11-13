// Passive RFC 8414 discovery check. Never POST to OAuth endpoints.
const REQUIRED_URL_FIELDS = ["issuer", "authorization_endpoint", "token_endpoint", "jwks_uri"];
function validHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash;
  } catch { return false; }
}
export function validateOAuthDiscovery(metadata, origin) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("OAuth metadata must be a JSON object");
  }
  for (const field of REQUIRED_URL_FIELDS) {
    if (!validHttps(metadata[field])) throw new Error("Missing/invalid HTTPS URL: " + field);
  }
  if (metadata.issuer !== origin) throw new Error("Issuer does not match the discovery origin");
  for (const field of ["grant_types_supported", "response_types_supported"]) {
    if (!Array.isArray(metadata[field]) || !metadata[field].length ||
        !metadata[field].every((value) => typeof value === "string" && value.length)) {
      throw new Error("Missing/invalid " + field);
    }
  }
  if (!metadata.grant_types_supported.includes("authorization_code") ||
      !metadata.response_types_supported.includes("code")) {
    throw new Error("Authorization Code flow is not advertised");
  }
  return true;
}

export async function checkOAuthDiscovery(origin = "https://shieldio.cz", fetcher = fetch) {
  const target = new URL("/.well-known/oauth-authorization-server", origin).href;
  const response = await fetcher(target, { headers: { Accept: "application/json" }, redirect: "error" });
  if (response.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(response.headers.get("Content-Type") || "")) {
    throw new Error("OAuth discovery must return HTTP 200 application/json");
  }
  const metadata = await response.json();
  validateOAuthDiscovery(metadata, new URL(origin).origin);
  const jwksResponse = await fetcher(metadata.jwks_uri, {
    headers: { Accept: "application/json" }, redirect: "error",
  });
  if (jwksResponse.status !== 200) throw new Error("JWKS unavailable");
  const jwks = await jwksResponse.json();
  if (!Array.isArray(jwks?.keys) || !jwks.keys.length) throw new Error("JWKS has no public keys");
  return metadata;
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const origin = process.argv[2] || "https://shieldio.cz";
  try {
    const metadata = await checkOAuthDiscovery(origin);
    console.log("OAuth discovery OK:", metadata.issuer);
  } catch (error) {
    console.error("OAuth discovery unavailable:", error.message);
    process.exitCode = 1;
  }
}
