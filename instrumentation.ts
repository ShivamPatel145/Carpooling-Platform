/**
 * Next.js instrumentation — `register()` runs ONCE per server process at startup.
 *
 * We use it to WARM the database. Neon's serverless compute auto-suspends when idle and cold-starts
 * (a few seconds, occasionally much longer) on the next query; meanwhile a page like the employee
 * dashboard fans out ~12 concurrent queries, so the FIRST request after a cold period can hang for
 * tens of seconds and even 500 as the pooled connections race the waking compute. Firing a trivial
 * `select 1` here wakes the compute BEFORE any user request, so the first page load lands warm.
 *
 * IMPORTANT: do NOT import `@/db` here — it pulls in `pg` (node-postgres), whose `fs` require breaks
 * when Next compiles instrumentation for non-Node targets (see next.config.ts + db/index.ts notes).
 * We talk to Neon through its own edge-safe HTTP driver instead, and only when the URL is actually
 * Neon (local Postgres needs no waking). Node runtime only; fire-and-forget.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const url = process.env.DATABASE_URL;
  if (!url || !/neon\.tech/i.test(url)) return; // only Neon suspends/cold-starts
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    await sql`select 1`;
    // eslint-disable-next-line no-console
    console.log("✓ DB warm-up: Neon connection established at boot");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("DB warm-up skipped (will connect on first request):", (err as Error)?.message);
  }
}
