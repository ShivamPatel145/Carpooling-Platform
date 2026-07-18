import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Drizzle over node-postgres — LOCAL Postgres for dev (the Neon serverless driver is disabled; see
 * git history and .env). `db` is SERVER-ONLY.
 *
 * The auth stack is transitively imported by client shell code
 * (nav.config → lib/permissions → @/auth → @/db), and node-postgres pulls in Node built-ins (fs,
 * net, tls, util) that don't exist in the browser — whereas Neon's serverless driver was
 * browser-safe. Two guards keep `db` off the client:
 *   1. next.config.ts aliases `pg` to an empty module in the CLIENT bundle (build time), and
 *   2. the Pool + env are required LAZILY and only when running on the server (runtime), so the
 *      browser never evaluates pg or the server-only env validation.
 *
 * `schema` is the barrel so `db.query.<table>` relational queries work. The `schema` re-export is
 * browser-safe (pure table definitions) and stays available on both sides.
 */
type ServerDb = ReturnType<typeof createServerDb>;

function createServerDb() {
  // Lazy requires: only evaluated on the server, so the client bundle never touches pg/env.
  const { Pool } = require("pg") as typeof import("pg");
  const { env } = require("@/lib/env") as typeof import("@/lib/env");
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return drizzle(pool, { schema, casing: "snake_case" });
}

export const db: ServerDb =
  typeof window === "undefined" ? createServerDb() : (undefined as unknown as ServerDb);

export type DB = ServerDb;
export * from "./schema";
