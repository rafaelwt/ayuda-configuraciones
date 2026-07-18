# Postman Collection Conventions

Schema: `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`

## Route discovery by stack

Identify the framework from manifest files (`package.json`, `pom.xml`/`build.gradle`, `go.mod`, `*.csproj`, `requirements.txt`/`pyproject.toml`, `Gemfile`), then read routes where that stack declares them:

| Stack | Routes live in | Body/validation source |
|-------|----------------|------------------------|
| NestJS | `@Controller` classes, `@Get/@Post...` decorators, global prefix in `main.ts` | class-validator DTOs |
| Express/Fastify/Koa | `router.get(...)`/route registrations, mounted prefixes | zod/joi/celebrate schemas, middleware |
| Spring | `@RestController`, `@RequestMapping`/`@GetMapping...`, `server.servlet.context-path` | `@Valid` request classes, Bean Validation annotations |
| Go (gin/echo/chi/fiber/net-http) | router setup (`r.GET(...)`, `mux.HandleFunc`), route groups | request structs + binding/validate tags |
| ASP.NET | controllers with `[Route]`/`[HttpGet...]` or Minimal API `MapGet/MapPost` | model classes, DataAnnotations, FluentValidation |
| FastAPI | `@app.get`/`APIRouter` decorators, router prefixes | Pydantic models |
| Django/DRF | `urls.py`, DRF routers/ViewSets | serializers, forms |
| Rails | `config/routes.rb` | strong params in controllers |
| Laravel | `routes/api.php` | FormRequest classes |

Auth discovery is stack-specific too: guards/decorators (Nest), middleware (Express/Go), Spring Security config, `[Authorize]` attributes (.NET), DRF permission classes, etc. Always record which routes are public and which roles each route needs.

If the app already exposes an OpenAPI spec (FastAPI `/openapi.json`, springdoc, Swashbuckle, Nest Swagger), use it to cross-check completeness — but still read the code for auth/roles, cookies, and signed webhooks, which specs rarely capture.

## Structure

- One folder per module/controller, named after the domain (e.g. `Auth`, `Campaigns`).
- Diagnostic/test-only endpoints go in a clearly labeled folder (e.g. `Test Only (diagnostics)`).
- Every request has a `description`: what it does, required roles, and relevant error codes (401, 403, 409, 422).
- `info.description` documents usage: run Login first, which variables to adjust, cookie behavior.

## Variables (collection-level)

| Variable | Default | Purpose |
|----------|---------|---------|
| `baseUrl` | `http://localhost:<port>` | API root, including global prefix if the app has one |
| `accessToken` | `""` | Set automatically by the Login/Refresh test scripts |
| `<entity>Id` (e.g. `campaignId`) | `1` | One per distinct `:id` path param |
| `<secret>` (e.g. `whatsappAppSecret`) | `change-me` | HMAC keys, verify tokens — never real values |

## Auth chaining

- Collection-level auth: `bearer` with `{{accessToken}}`.
- Public endpoints override with `"auth": { "type": "noauth" }`.
- Login (and Refresh, if any) test script saves the token:

```js
pm.test('Login succeeded', () => pm.response.to.have.status(200));
const json = pm.response.json();
if (json.accessToken) {
    pm.collectionVariables.set('accessToken', json.accessToken);
}
```

- Cookie-based refresh tokens need no handling — Postman's cookie jar replays them automatically. Note it in the request description.
- Prefill Login with seed credentials when the repo defines them.

## Optional query params

Include them with `"disabled": true` and a `description` stating allowed values, so they appear in the Params tab without polluting the default request.

## Multipart uploads

Use `"mode": "formdata"`; file fields as `{ "key": "<field>", "type": "file", "src": [] }` with the size limit in the description. Numeric fields go as text (multipart coerces server-side).

## HMAC-signed webhooks

Pre-request script computes the signature from the raw body so the request works out of the box:

```js
const secret = pm.collectionVariables.get('<secretVar>');
const body = pm.request.body ? pm.request.body.raw : '';
const signature = CryptoJS.HmacSHA256(body, secret).toString(CryptoJS.enc.Hex);
pm.request.headers.upsert({ key: '<Signature-Header>', value: 'sha256=' + signature });
```

Provide a realistic sample payload matching the provider's actual shape (e.g. Meta's `entry[].changes[].value.statuses[]`).

## Validation

- Local file: `jq -e '.item | length' <file>` and sum of `[.item[].item | length] | add` — report both counts.
- MCP: confirm the collection id/URL returned by the create/update call.

## MCP specifics

- Discover tools with ToolSearch query `postman`; tool names vary by server version — prefer create/update-collection operations that accept a full v2.1 collection object.
- Search the workspace for a collection with the same name first; update it instead of creating a duplicate.
- On any MCP failure, fall back to writing the local file and report the reason.
