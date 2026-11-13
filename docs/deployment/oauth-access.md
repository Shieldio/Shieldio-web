# OAuth 2.0 discovery for Shieldio agents (Cloudflare Access)

**Status: implementation prepared; not activated until Cloudflare Zero Trust is configured.**

Shieldio's main website and public `/mcp` remain anonymous and read-only. Do **not** publish static `/.well-known/oauth-authorization-server` or `/.well-known/openid-configuration` with guessed values: this would advertise endpoints that cannot authenticate anyone.

## Architecture

- `https://shieldio.cz/mcp` stays public.
- `https://shieldio.cz/mcp/secure` is a new *opt-in* endpoint that delegates to the same read-only MCP tools **only after a valid Cloudflare Access JWT** is verified.
- Cloudflare Access Managed OAuth owns authorization, token issuance, refresh, client registration and OAuth metadata. Shieldio does not store passwords or issue fake keys.
- The secured route returns HTTP 404 until `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are configured. Once configured, unsigned/invalid assertions fail with HTTP 401.
- Only the configured Cloudflare team JWKS is trusted; the token's `iss`, `aud`, expiration and RS256 signature are checked in the Worker. This also blocks attempts to bypass Access through workers.dev.
- The route does **not** provide new private or write APIs; it authenticates use of the existing public learning tools.

## Cloudflare configuration (requires account administrator)

1. In Cloudflare Zero Trust, configure an identity provider (for example, email one-time PIN) and create an **Access application** protecting **only** `shieldio.cz/mcp/secure`, not the entire website. Use an explicit Allow policy restricting permitted identities; do not create an unrestricted public policy.
2. In the application's Advanced settings, enable **Managed OAuth**. Cloudflare handles the OAuth authorization code flow and publishes `/.well-known/oauth-authorization-server` on the protected application's domain.
3. Configure redirect URI policy for the agent clients you intend to use and enable dynamic client registration if needed. For local agents, only enable loopback redirects when required; prefer an allowlist for web clients. Set short access token lifetime (5–15 min).
4. Find the application's **Application Audience (AUD) Tag** and the account's team domain, e.g. `https://example.cloudflareaccess.com`.
5. Set deployment secrets **without committing values to Git**:

   ```bash
   npx wrangler secret put ACCESS_TEAM_DOMAIN --config wrangler.jsonc
   npx wrangler secret put ACCESS_AUD --config wrangler.jsonc
   ```

   Use the complete `https://<team>.cloudflareaccess.com` URL for `ACCESS_TEAM_DOMAIN`. `ACCESS_AUD` is the application AUD tag. Make sure the GitHub Actions Cloudflare deployment token can deploy the Worker afterwards.

6. Test the secured route using an actual Access-authenticated agent. The Worker expects the cryptographically signed `Cf-Access-Jwt-Assertion` forwarded by Cloudflare Access after Managed OAuth exchanges the client's bearer token.

**Important:** Verify Cloudflare actually serves discovery for your path-scoped application. If it does not, configure a dedicated Access application and hostname for authenticated agents; do **not** intercept the public apex discovery URI with invented JSON.

## Verification of OAuth discovery

Get `https://shieldio.cz/.well-known/oauth-authorization-server` (GET) and check:

- HTTP 200 and `application/json`.
- `issuer` is the canonical HTTPS issuer used by the Access application.
- `authorization_endpoint`, `token_endpoint` and `jwks_uri` are real HTTPS endpoints.
- `grant_types_supported` and `response_types_supported` are non-empty arrays.
- For authorization code clients, the returned grant types include `authorization_code`; if `code_challenge_methods_supported` exists, prefer `S256`.
- Make a complete Authorization Code + PKCE login and token exchange with a permitted client. Metadata and a scanner result alone do not demonstrate authentication.
- Run `node scripts/verify-oauth-discovery.mjs https://shieldio.cz` after configuration.
- In GitHub repository Actions variables set `OAUTH_DISCOVERY_REQUIRED=true` *only after* Cloudflare Managed OAuth is active. Future deployments then strictly validate discovery.

Run the external checker without probing any registration POST endpoint:

```bash
curl -fsS -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://shieldio.cz"}'
```

The relevant result is `checks.discovery.oauthDiscovery.status` (`pass` expected after activation). If `jwks_uri` is omitted by the chosen OAuth provider, the stated scanner requirements are **not met**; do not invent a JSON Web Key Set to compensate. Cloudflare Managed OAuth uses opaque access tokens, while the Access JWT used for origin verification has its own issuer/signing keys.

Reference: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/ and https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
