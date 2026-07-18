import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle client over Neon's serverless HTTP driver.
 *
 * Always the POOLED (`-pooler`) connection string — Vercel serverless functions exhaust direct
 * connections under load (you'd discover this at hour 20 under demo traffic). The pooled host is
 * baked into DATABASE_URL; see .env.example and the drizzle-schema skill.
 *
 * `schema` is the barrel (db/schema/index.ts) so `db.query.<table>` relational queries work.
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export type DB = typeof db;
export * from "./schema";
