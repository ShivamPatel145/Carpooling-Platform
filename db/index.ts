import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/**
 * Drizzle client — SERVER-ONLY, with a switchable driver so we run local Postgres for the hackathon
 * but can flip to Neon serverless for hosting WITHOUT touching call sites.
 *
 *   DB_DRIVER=postgres (default) → node-postgres (`pg`) against a local/standard Postgres.
 *   DB_DRIVER=neon               → Neon's serverless WebSocket driver (Vercel/Neon hosting).
 *
 * We also auto-pick Neon when DB_DRIVER is left at its default but the URL host looks like Neon —
 * so a Neon connection string "just works" in production even if the flag wasn't set.
 *
 * WHY THE WEBSOCKET DRIVER (not neon-http): neon-http opens a fresh HTTPS request PER query, so a
 * page that fires ~12 queries in a Promise.all pays ~12 sequential round-trips (~400ms each from a
 * dev machine → multi-second pages). The WebSocket Pool holds ONE persistent connection and runs
 * those queries concurrently over it, collapsing the page's DB time to roughly a single round-trip.
 *
 * KEEPING `db` OFF THE CLIENT: the auth stack is transitively imported by client shell code
 * (nav.config → lib/permissions → @/auth → @/db). node-postgres pulls in Node built-ins (fs, net,
 * tls, util) that don't exist in the browser; Neon's serverless driver is browser-safe. Two guards:
 *   1. next.config.ts aliases `pg` to an empty module in the CLIENT bundle (build time), and
 *   2. the driver + env are required LAZILY, only on the server (typeof window === "undefined"),
 *      so the browser never evaluates pg/neon or the server-only env validation.
 *
 * `schema` (pure table definitions) is browser-safe and re-exported for both sides so
 * `db.query.<table>` relational queries work.
 */
/**
 * Both drivers expose the same Drizzle query-builder surface, so we present ONE stable type to every
 * call site (`NodePgDatabase`) regardless of which driver is live. Without this the pg⋃neon union
 * makes TypeScript pick incompatible `.insert().values()` overloads at some call sites.
 */
type ServerDb = NodePgDatabase<typeof schema>;

function createServerDb(): ServerDb {
  // Lazy requires: only evaluated on the server, so the client bundle never touches pg/neon/env.
  const { env } = require("@/lib/env") as typeof import("@/lib/env");

  const useNeon =
    env.DB_DRIVER === "neon" ||
    // auto-detect a Neon host when the flag is left at its "postgres" default
    (env.DB_DRIVER === "postgres" && /neon\.tech/i.test(env.DATABASE_URL));

  if (useNeon) {
    // Neon serverless WebSocket driver — ONE persistent Pool connection (queries pipelined),
    // not a new HTTPS request per query. Use the POOLED connection string. On Node there's no
    // global WebSocket, so wire ws in (browser code never reaches here — this factory is
    // server-only). Both requires are lazy so the client bundle never evaluates ws/neon.
    const { Pool, neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    const ws = require("ws") as typeof import("ws");
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    // Cast to the unified type: the query-builder surface is identical across drivers.
    return drizzleNeon(pool, { schema, casing: "snake_case" }) as unknown as ServerDb;
  }

  // node-postgres against local/standard Postgres (hackathon default).
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzlePg(pool, { schema, casing: "snake_case" });
}

export const db: ServerDb =
  typeof window === "undefined" ? createServerDb() : (undefined as unknown as ServerDb);

export type DB = ServerDb;
export * from "./schema";
