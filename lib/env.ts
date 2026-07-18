import { z } from "zod";

/**
 * Environment validation — fails fast with a readable error instead of an undefined-at-runtime
 * surprise at hour 14. Required vars gate boot; integration vars (email, uploads, OAuth) are
 * optional so the app runs with only DATABASE_URL + AUTH_SECRET during Phase 0, degrading those
 * features gracefully. See .env.example for the full list with comments.
 */
const envSchema = z.object({
  // ── Required to boot ─────────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres connection string"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required (generate with: npx auth secret)"),

  // ── Database driver select ───────────────────────────────────────────────────────────────
  // "postgres" (default) → node-postgres against a local/standard Postgres (hackathon setup).
  // "neon"                → Neon's serverless HTTP driver (use for Vercel/Neon hosting).
  // Both code paths live in db/index.ts; flip this one var to switch. Auto-detects "neon" when the
  // URL host looks like Neon and the flag is left at its default.
  DB_DRIVER: z.enum(["postgres", "neon"]).default("postgres"),

  // ── Optional integrations (feature degrades if absent) ───────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),

  // ── Optional: Pusher realtime (live tracking + chat; degrades to polling if absent) ─────────
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),

  // ── Public ───────────────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/**
 * Parsed, typed env. In production a missing required var throws at import time (fail fast).
 * We read from process.env once and freeze the result.
 */
function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${issues}\n`);
  }
  return parsed.data;
}

export const env = loadEnv();

/** Feature flags derived from which optional integrations are configured. */
export const features = {
  email: Boolean(env.RESEND_API_KEY),
  uploads: Boolean(env.UPLOADTHING_TOKEN),
  realtime: Boolean(
    env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER,
  ),
} as const;
