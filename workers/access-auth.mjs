// Optional authenticated MCP endpoint for Cloudflare Access Managed OAuth.
// The OAuth authorization server and discovery endpoints are managed by
// Cloudflare Access. Never invent local authorization/token/JWKS routes.
const DOMAIN_PATTERN = /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i;

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid JWT encoding");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  const bytes = decodeBase64Url(value);
  if (bytes.length > 16384) throw new Error("JWT part too large");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export function accessConfigured(env) {
  return typeof env?.ACCESS_TEAM_DOMAIN === "string" &&
    DOMAIN_PATTERN.test(env.ACCESS_TEAM_DOMAIN) &&
    typeof env?.ACCESS_AUD === "string" && env.ACCESS_AUD.length >= 8 &&
    env.ACCESS_AUD.length <= 256;
}

export async function verifyAccessAssertion(request, env, fetcher = fetch) {
  if (!accessConfigured(env)) return false;
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion") || "";
  if (!jwt || jwt.length > 16384) return false;

  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = decodeJsonPart(encodedHeader);
    const claims = decodeJsonPart(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    if (header?.alg !== "RS256" || typeof header?.kid !== "string" || header.kid.length > 256 ||
        typeof claims?.iss !== "string" || claims.iss !== env.ACCESS_TEAM_DOMAIN ||
        !Array.isArray(claims?.aud) && typeof claims?.aud !== "string" ||
        !(Array.isArray(claims.aud) ? claims.aud.includes(env.ACCESS_AUD) : claims.aud === env.ACCESS_AUD) ||
        typeof claims.exp !== "number" || !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
        typeof claims.iat !== "number" || !Number.isSafeInteger(claims.iat) || claims.iat > now + 60 ||
        (claims.nbf !== undefined && (typeof claims.nbf !== "number" || claims.nbf > now + 60))) {
      return false;
    }

    // Fixed configured URL, never derived from untrusted JWT claims.
    const certificates = await fetcher(env.ACCESS_TEAM_DOMAIN + "/cdn-cgi/access/certs", {
      method: "GET", headers: { Accept: "application/json" },
    });
    if (!certificates.ok) return false;
    const jwks = await certificates.json();
    const key = jwks?.keys?.find((candidate) =>
      candidate?.kid === header.kid && candidate.kty === "RSA" &&
      (!candidate.alg || candidate.alg === "RS256") &&
      (candidate.use === undefined || candidate.use === "sig"));
    if (!key || !key.n || !key.e) return false;
    const publicKey = await crypto.subtle.importKey(
      "jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
    );
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", publicKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedHeader + "." + encodedPayload),
    );
  } catch {
    // Never let an invalid token or unreachable JWKS bypass authorization.
    return false;
  }
}
