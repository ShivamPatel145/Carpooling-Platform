import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

/**
 * Applies the generated SQL migrations in db/migrations against DATABASE_URL.
 *   pnpm db:generate   → produce SQL (READ IT before applying)
 *   pnpm db:migrate    → apply here, against YOUR Neon branch (dev-1..4), never main from a feature session
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("⏳ Running migrations…");
  const start = Date.now();
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log(`✅ Migrations complete in ${Date.now() - start}ms`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
