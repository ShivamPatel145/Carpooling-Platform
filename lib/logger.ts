/**
 * Structured logger — no external observability stack (a deliberate rejection; Vercel's function
 * logs + this are enough for a 24h build, and "why no Datadog" has a one-line answer). Emits JSON
 * in production for log aggregators; pretty, coloured lines in development.
 */
type Level = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: Level = isProd ? "info" : "debug";

function serialize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v;
  }
  return out;
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;
  const time = new Date().toISOString();
  const payload = meta ? serialize(meta) : undefined;

  if (isProd) {
    // one JSON object per line
    console[level === "debug" ? "log" : level](
      JSON.stringify({ time, level, message, ...(payload ?? {}) }),
    );
    return;
  }

  const tag = { debug: "·", info: "ℹ", warn: "⚠", error: "✖" }[level];
  const fn = level === "debug" ? console.log : console[level];
  if (payload) fn(`${tag} ${message}`, payload);
  else fn(`${tag} ${message}`);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
};
