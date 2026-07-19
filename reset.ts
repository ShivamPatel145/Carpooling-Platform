import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

async function reset() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Dropping schema public cascade...");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE;");
    console.log("Creating schema public...");
    await pool.query("CREATE SCHEMA public;");
    
    console.log("Dropping schema drizzle cascade...");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

reset();
