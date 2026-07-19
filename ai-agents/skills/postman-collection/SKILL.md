---
name: postman-collection
description: "Trigger: postman collection, coleccion postman, test endpoints, probar API, API collection. Generate an organized Postman collection from any backend (Nest, Spring, Go, .NET, FastAPI, Django…) — via Postman MCP if installed, else a local v2.1 JSON file."
license: Apache-2.0
metadata:
  author: rafaelwt
  version: "1.1"
---

## Activation Contract

Use when the user asks to generate, update, or organize a Postman collection for the current repo's API, or wants a way to test all endpoints without doing it manually.

## Hard Rules

- Survey the codebase BEFORE writing any collection — never guess endpoints.
- Framework-agnostic: identify the stack first, then read routes from the real code (see the route-discovery map in `references/collection-conventions.md`). Works for NestJS, Express, Spring, Go, ASP.NET, FastAPI, Django, Rails, or anything else.
- Follow `references/collection-conventions.md` for collection structure, auth chaining, variables, and scripts.
- Detect the Postman MCP before choosing the output target (see Decision Gates).
- Never hardcode secrets or real tokens; use collection variables with placeholder defaults.

## Decision Gates

| Condition | Action |
|-----------|--------|
| Postman MCP tools available (ToolSearch for `postman` → `mcp__postman*` tools) | Push to the user's Postman workspace. Update by name if it already exists — do not duplicate. |
| Collection contains scripts (`event`) or formdata bodies | Do NOT push through MCP create/put tools — their strict schemas strip those fields. Use the raw Postman API instead (see "MCP specifics" in references). MCP stays for discovery, environments, and simple collections. |
| No Postman MCP | Write `postman/<repo>.postman_collection.json` (schema v2.1) in the repo. |
| Push fails (auth/network) | Fall back to the local file and tell the user why. |

## Execution Steps

1. **Survey** (delegate an exploration agent for 4+ files): every route with HTTP verb, full path (global prefix, versioning), path/query params with defaults; request DTO fields with types, required/optional, validation; auth flow (login endpoint, token type, public routes, roles per route); special cases (multipart uploads with file field names, HMAC-signed webhooks, custom headers); default port/base URL; seed credentials if any.
2. **Detect target**: run ToolSearch with query `postman`; apply Decision Gates.
3. **Build** the collection per `references/collection-conventions.md`: folders per module, collection-level bearer auth, login test script that auto-saves `{{accessToken}}`, id variables, disabled optional query params, HMAC pre-request scripts for signed webhooks.
4. **Validate**: local file → `jq` parse check; MCP → confirm the returned collection id/URL.
5. **Report**: folder/request counts, execution order (login first), variables the user must adjust, and how to run it (`postman collection run <file>` or from the workspace).

## Output Contract

Return: where the collection landed (workspace URL/id or file path), folder and request totals, required variable setup, and first-run instructions.

## References

- `references/collection-conventions.md` — collection structure, variable naming, and script snippets.
