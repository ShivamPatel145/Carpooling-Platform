import { index, integer, jsonb, numeric, pgEnum, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";
import { ride, geoPointSchema, type GeoPoint } from "./ride";

/**
 * booking — a passenger's seat(s) on a ride (docs/PRD.md §7.2, §6). Creating one decrements
 * ride.seatsAvailable; a per-booking trip is created when the driver starts. Slice A.
 */
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

export const booking = pgTable(
  "booking",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    rideId: uuid("ride_id")
      .notNull()
      .references(() => ride.id, { onDelete: "cascade" }),
    passengerId: uuid("passenger_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seatsBooked: integer("seats_booked").notNull().default(1),
    pickupPoint: jsonb("pickup_point").$type<GeoPoint>(),
    dropPoint: jsonb("drop_point").$type<GeoPoint>(),
    fareAmount: numeric("fare_amount", { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
  },
  (t) => ({
    orgIdx: index("booking_org_idx").on(t.orgId),
    rideIdx: index("booking_ride_idx").on(t.rideId),
    passengerIdx: index("booking_passenger_idx").on(t.passengerId),
    statusIdx: index("booking_status_idx").on(t.status),
  }),
);

export const bookingRelations = relations(booking, ({ one }) => ({
  organization: one(organization, { fields: [booking.orgId], references: [organization.id] }),
  ride: one(ride, { fields: [booking.rideId], references: [ride.id] }),
  passenger: one(user, { fields: [booking.passengerId], references: [user.id] }),
}));

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

export const bookingSelectSchema = createSelectSchema(booking);

/** Book-a-ride form (seats + optional pickup/drop refinement). */
export const bookingFormSchema = z.object({
  rideId: z.string().uuid(),
  seatsBooked: z.coerce.number().int().min(1, "At least 1 seat").max(20).default(1),
  pickupPoint: geoPointSchema.optional(),
  dropPoint: geoPointSchema.optional(),
});
export type BookingFormValues = z.infer<typeof bookingFormSchema>;
