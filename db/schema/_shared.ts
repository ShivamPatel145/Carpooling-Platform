import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Columns every table gets (drizzle-schema skill rule #3): id (uuid, defaultRandom),
 * createdAt, updatedAt. Spread into each table's column object so the convention can't drift.
 *
 *   export const foo = pgTable("foo", { ...timestamps, name: text("name") });
 *
 * `updatedAt` auto-bumps on every UPDATE via `$onUpdate(() => new Date())`. NOTE: `$onUpdate`
 * must return a JS value (a Date), NOT a `sql` fragment — the timestamp column runs the returned
 * value through mapToDriverValue (which calls `.toISOString()`), so a `sql\`now()\`` chunk there
 * throws "value.toISOString is not a function" on every update. (Learned the hard way; keep it a Date.)
 *
 * `deletedAt` is deliberately NOT here — add soft-delete only where the domain needs
 * recoverability. Soft-delete everywhere is cargo cult and complicates every query.
 */
export const timestamps = {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
