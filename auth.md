# Shieldio auth.md — AI agent access

Service: https://shieldio.cz
Audience: autonomous AI agents and integrations that read public Shieldio electronics learning resources.

## Access and registration status

Shieldio currently offers **anonymous, read-only access without registration**. The public interfaces listed below do not require an account, OAuth flow, API key, access token, or `Authorization` header.

- **Supported access method:** anonymous public access.
- **Registration / provisioning endpoint:** none; there is no self-registration or credential issuance service.
- **Supported credential types:** none for the public interfaces described here.
- **OAuth authorization server:** not provided. Shieldio does not publish OAuth Protected Resource Metadata or Authorization Server metadata because no such server exists.
- **Scopes:** none; access is limited by the capabilities of each public endpoint.

This document describes existing access, not a promise that agent accounts, private data, or write operations are available.

## Step 1 — Discover the public agent interface

Read the MCP Server Card:

- `GET https://shieldio.cz/mcp/server-card` — current server card.
- `GET https://shieldio.cz/.well-known/mcp/server-card.json` — legacy discovery card.

Public source index: `GET https://shieldio.cz/llms.txt`.

## Step 2 — Use public MCP without credentials

Send MCP Streamable HTTP JSON-RPC requests to:

`POST https://shieldio.cz/mcp`

Set `Content-Type: application/json` and `Accept: application/json, text/event-stream`. Begin with `initialize` using the protocol version advertised in the server card, then enumerate available tools and resources with `tools/list` and `resources/list`.

Example public initialization request:

```http
POST /mcp HTTP/1.1
Host: shieldio.cz
Content-Type: application/json
Accept: application/json, text/event-stream

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"shieldio-public-reader","version":"1.0.0"}}}
```

The MCP server currently exposes read-only access to public learning information. It does not create accounts, modify projects, access private records, or offer tools for uploading firmware to a user's device.

## Step 3 — Other public resources

- `GET https://shieldio.cz/api/` — public API documentation.
- `GET https://shieldio.cz/.well-known/api-catalog` — machine-readable API catalog.
- `GET https://shieldio.cz/api/simulation-openapi.json` — OpenAPI description.
- `GET https://simulation.shieldio.cz/api/health` — separate public simulator health endpoint.
- Public website pages support `Accept: text/markdown` through the main Cloudflare Worker where deployed.

The health endpoint confirms a basic response, not complete simulator availability. It is not a user-account or credential-registration endpoint.

## Credential handling and errors

No credential is required or issued for the listed public resources; omit `Authorization`. Never send an existing user's private tokens or secrets to these endpoints.

If access is denied (401/403), a resource is unavailable (404), or an endpoint changes, do not guess credentials, bypass access controls, or probe undocumented registration routes such as `POST /agent/auth`. Re-check this document, the public server card, and the API documentation. Shieldio's separate beta or restricted features are not covered by this anonymous access policy.

For a future private or write-enabled integration, a real authorization and provisioning service must be deployed before OAuth metadata or agent registration methods can be advertised.
