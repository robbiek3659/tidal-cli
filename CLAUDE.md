# CLAUDE.md

## Project

tidal-cli — TypeScript CLI for Tidal music streaming. Designed for LLM agent automation via OpenClaw.

## Architecture

- **API**: `@tidal-music/api` client against `https://openapi.tidal.com/v2` (JSON:API spec)
- **Auth**: OAuth Authorization Code + PKCE. No client_secret. Client ID hardcoded (public OAuth pattern).
- **Session**: localStorage polyfill backed by `~/.tidal-cli/session.json`. Tokens auto-refresh.
- **Country code**: Auto-detected from user profile via `/users/me`. Fallback: `TIDAL_COUNTRY` env var, then `US`.
- **Playback**: Uses `/trackManifests/{id}` (DASH segments), not the legacy v1 API.

## Source Layout

```
src/
├── index.ts       # CLI entry point (commander)
├── auth.ts        # OAuth, getApiClient(), getCountryCode()
├── session.ts     # localStorage/EventTarget polyfills for Node.js
├── types.ts       # Shared types for *Data() functions
├── search.ts      # Search + suggestions
├── artist.ts      # Artist info, tracks, albums, similar, radio
├── track.ts       # Track info, similar, radio, ISRC lookup
├── album.ts       # Album info, barcode lookup
├── playlist.ts    # Playlist CRUD, track management, reorder
├── library.ts     # Library/favorites + favorited playlists
├── playback.ts    # Stream manifests, DASH download, local play
├── recommend.ts   # User recommendations (mixes)
├── history.ts     # Recently added items
├── user.ts        # User profile
└── __tests__/     # Vitest unit tests (111 tests)

site/app/
├── .well-known/oauth-authorization-server/  # OAuth metadata discovery
├── api/authorize/   # OAuth authorize → redirects to Tidal
├── api/callback/    # Tidal OAuth callback → stores tokens
├── api/token/       # Token exchange (code → access token)
├── api/mcp/         # MCP Streamable HTTP handler (32 tools)
└── mcp-lib/         # Redis, Tidal OAuth, tool definitions, constants
```

## Commands

Run `npm run build` then `node dist/index.js --help` for the full command list.

## Testing

```bash
npm test           # vitest run
npm run test:watch # vitest watch
```

Tests mock the API client — no real API calls. Run tests before committing.

## Key Patterns

- Each module has `*Data()` functions (return data, throw on error) and display wrappers (console.log + process.exit)
- `*Data()` functions take `client` and `countryCode` as explicit params — reusable from both CLI and MCP server
- CLI wrappers call `getApiClient()` and `getCountryCode()` then delegate to `*Data()`
- Use `as any` for openapi-fetch typed params where the types don't match
- Sort search results by `popularity` descending (except albums/playlists)
- `--json` flag available on all commands via `getJson()` in index.ts
- Error handling in CLI: `console.error()` + `process.exit(1)`. In `*Data()`: throw Error

## MCP Server

Remote MCP server hosted in `site/` (Next.js on Vercel) for Claude Connectors Directory.

- **Transport**: Streamable HTTP via `mcp-handler` at `/api/mcp`
- **Auth**: Double OAuth — server for MCP clients (Claude) + client for Tidal API
- **Tokens**: Per-user Tidal tokens in Upstash Redis (env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- **Tools**: 32 tools with safety annotations (`readOnlyHint`, `destructiveHint`)
- **Imports**: Tools import from compiled `dist/` (not `src/`) to avoid CJS/ESM mismatch with Turbopack
- **Build dependency**: Run `npm run build` in root before building site

## Don't

- Don't add `client_secret` — use PKCE only
- Don't require env vars for onboarding — keep it seamless
- Don't use the legacy v1 API (`api.tidal.com/v1`) — use v2 only
- Don't commit `.env`, `session.json`, or `*.skill` files
- Don't hardcode country codes — use `getCountryCode()`

## Releasing

```bash
npm version patch   # or minor, major
git push && git push --tags
```

This triggers `.github/workflows/release.yml` which automatically:
1. Runs tests (Node 22)
2. Publishes to npm via Trusted Publishing (OIDC, no token needed)
3. Publishes to ClawHub via `CLAWHUB_TOKEN` secret
4. Creates a GitHub Release with auto-generated notes

After release, update the local install: `npm run build && npm install -g .`

The npm package is `@lucaperret/tidal-cli` (scope matches GitHub owner for Trusted Publishing). The old `@lucanova/tidal-cli` is deprecated.

## Distribution

| Channel | URL |
|---------|-----|
| npm | https://www.npmjs.com/package/@lucaperret/tidal-cli |
| GitHub | https://github.com/lucaperret/tidal-cli |
| ClawHub | https://clawhub.ai/lucaperret/tidal-cli |
| Site | https://tidal-cli.lucaperret.ch |

## Related

- Site + MCP: `site/` (Next.js, auto-deployed to Vercel on push)
- Skill: `skills/tidal-cli/SKILL.md` (OpenClaw) — sync to `~/.openclaw/workspace/skills/tidal-cli/` for local testing
- API reference: https://tidal-music.github.io/tidal-api-reference/tidal-api-oas.json
- MCP endpoint: `https://tidal-cli.lucaperret.ch/api/mcp` (requires Upstash Redis env vars)
