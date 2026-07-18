/**
 * SCHEMA BARREL — the single shared file in db/. One file per table; this re-exports them.
 *
 * ⚠️  SHARED FILE. Only the integrator edits this, only at a sync point. The PreToolUse hook
 *     blocks everyone else — that's not a bug. Need a table exported? Route it through the
 *     integrator at :50. (drizzle-schema skill, rule #2.)
 *
 * Add a new table by adding its file (db/schema/<table>.ts) and ONE line here.
 */

// ── Shared column helper ────────────────────────────────────────────────────────────────────
export * from "./_shared";

// ── Tenant root (carpooling) ────────────────────────────────────────────────────────────────
export * from "./organization";

// ── Auth.js adapter tables (user extended for carpooling: orgId, role, status, …) ───────────
export * from "./user";
export * from "./account";
export * from "./session";

// ── Generic, domain-agnostic tables (extend by reference, never duplicate) ──────────────────
export * from "./notification";
export * from "./activity-log";
export * from "./system-setting";
export * from "./support-ticket";

// ── Carpooling domain — Slice D (tenancy/admin/onboarding) ──────────────────────────────────
export * from "./invitation";

// ── Carpooling domain — Slice A (ride engine) ───────────────────────────────────────────────
export * from "./vehicle";
export * from "./ride";
export * from "./booking";

// ── Carpooling domain — Slice B (trips/tracking/chat/saved places) ──────────────────────────
export * from "./saved-place";
export * from "./trip";
export * from "./trip-event";
export * from "./message";

// ── Carpooling domain — Slice C (payments/wallet) ───────────────────────────────────────────
export * from "./payment";
export * from "./wallet-entry";
