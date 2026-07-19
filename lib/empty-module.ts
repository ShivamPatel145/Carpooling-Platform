/**
 * Intentionally-empty module. Used as the CLIENT-bundle stand-in for `pg` (node-postgres) under
 * Turbopack (`experimental.turbo.resolveAlias` in next.config.ts) — the Turbopack analogue of the
 * webpack `config.resolve.alias = { pg: false }` used by the webpack dev compiler. `db` is required
 * lazily and server-only (db/index.ts), so the browser never actually touches pg; this alias just
 * stops the bundler from trying to bundle its Node internals (fs/net/tls) for the client.
 */
export {};
