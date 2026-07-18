import { index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { trip } from "./trip";

/**
 * tripEvent — append-only audit + tracking stream for a trip (docs/PRD.md §6). Records status
 * transitions and location pings; also the source a reviewer inspects to see the trip's history.
 * Slice B.
 */
export const tripEvent = pgTable(
  "trip_event",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    /** e.g. "started" | "location" | "completed" | "payment_pending" */
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("trip_event_org_idx").on(t.orgId),
    tripIdx: index("trip_event_trip_idx").on(t.tripId),
    atIdx: index("trip_event_at_idx").on(t.at),
  }),
);

export const tripEventRelations = relations(tripEvent, ({ one }) => ({
  organization: one(organization, { fields: [tripEvent.orgId], references: [organization.id] }),
  trip: one(trip, { fields: [tripEvent.tripId], references: [trip.id] }),
}));

export type TripEvent = typeof tripEvent.$inferSelect;
export type NewTripEvent = typeof tripEvent.$inferInsert;

export const tripEventSelectSchema = createSelectSchema(tripEvent);
