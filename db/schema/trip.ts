import { index, integer, numeric, pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { ride } from "./ride";

/**
 * trip — the live/executing instance of a ride (docs/PRD.md §7.5–7.6, §6). One per ride once
 * started. driverLat/Lng + etaMin drive live tracking (Pusher, polling fallback). Slice B.
 *
 * Lifecycle: booked → started → in_progress → completed → payment_pending → payment_completed.
 */
export const tripStatusEnum = pgEnum("trip_status", [
  "booked",
  "started",
  "in_progress",
  "completed",
  "payment_pending",
  "payment_completed",
]);
export type TripStatus = (typeof tripStatusEnum.enumValues)[number];

export const trip = pgTable(
  "trip",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    rideId: uuid("ride_id")
      .notNull()
      .references(() => ride.id, { onDelete: "cascade" }),
    status: tripStatusEnum("status").notNull().default("booked"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    driverLat: numeric("driver_lat", { precision: 10, scale: 7 }),
    driverLng: numeric("driver_lng", { precision: 10, scale: 7 }),
    etaMin: integer("eta_min"),
  },
  (t) => ({
    orgIdx: index("trip_org_idx").on(t.orgId),
    rideIdx: index("trip_ride_idx").on(t.rideId),
    statusIdx: index("trip_status_idx").on(t.status),
  }),
);

export const tripRelations = relations(trip, ({ one }) => ({
  organization: one(organization, { fields: [trip.orgId], references: [organization.id] }),
  ride: one(ride, { fields: [trip.rideId], references: [ride.id] }),
}));

export type Trip = typeof trip.$inferSelect;
export type NewTrip = typeof trip.$inferInsert;

export const tripSelectSchema = createSelectSchema(trip);

/** Driver location ping (from the driver client to /api/trip/[id]/location). */
export const tripLocationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  etaMin: z.coerce.number().int().min(0).max(100000).optional(),
});
export type TripLocationValues = z.infer<typeof tripLocationSchema>;

/** Trip status transition (driver/payment initiated). */
export const tripTransitionSchema = z.object({
  status: z.enum(tripStatusEnum.enumValues),
});
export type TripTransitionValues = z.infer<typeof tripTransitionSchema>;
