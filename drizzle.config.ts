import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local (Next's convention) for CLI tooling — drizzle-kit runs outside Next.
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url },
  // Verbose diffs so you can READ the SQL before applying (drizzle-schema skill).
  verbose: true,
  strict: true,
});
