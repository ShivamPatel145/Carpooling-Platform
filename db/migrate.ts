import { config } from "dotenv";
config({ path: ".env.local" });

// Both drivers are kept: local Postgres for the hackathon, Neon for hosting. DB_DRIVER selects
// (default "postgres"; auto-uses Neon for a neon.tech URL). Mirrors db/index.ts.
import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";

/**
 * Applies the generated SQL migrations in db/migrations against DATABASE_URL.
 *   pnpm db:generate   → produce SQL (READ IT before applying)
 *   pnpm db:migrate    → apply here, against YOUR local branch, never main from a feature session
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const useNeon =
    process.env.DB_DRIVER === "neon" ||
    (process.env.DB_DRIVER !== "postgres" && /neon\.tech/i.test(url));

  console.log("⏳ Running migrations…");
  const started = Date.now();
  if (useNeon) {
    const db = drizzleNeon(neon(url));
    await migrateNeon(db, { migrationsFolder: "./db/migrations" });
    console.log(`✅ Migrations complete in ${Date.now() - started}ms`);
    process.exit(0);
  }
  const pool = new Pool({ connectionString: url });
  const db = drizzlePg(pool);
  await migratePg(db, { migrationsFolder: "./db/migrations" });
  console.log(`✅ Migrations complete in ${Date.now() - started}ms`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
