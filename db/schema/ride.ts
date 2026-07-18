import { boolean, index, integer, jsonb, numeric, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamps } from "./_shared";
import { organization } from "./organization";
import { user } from "./user";
import { vehicle } from "./vehicle";

/** A location point stored in jsonb on ride/booking. */
export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
}

/** Zod for a GeoPoint (shared by ride + booking forms). */
export const geoPointSchema = z.object({
  label: z.string().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * ride — a published trip offer (docs/PRD.md §7.3, §6). routeGeoJSON/distanceKm/durationMin are
 * cached from OSRM so we don't re-route per view. Only APPROVED vehicles can back a ride. Slice A.
 */
export const rideStatusEnum = pgEnum("ride_status", ["published", "full", "cancelled", "completed"]);
export type RideStatus = (typeof rideStatusEnum.enumValues)[number];

export const ride = pgTable(
  "ride",
  {
    ...timestamps,
    orgId: uuid("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicle.id, { onDelete: "restrict" }),
    origin: jsonb("origin").$type<GeoPoint>().notNull(),
    destination: jsonb("destination").$type<GeoPoint>().notNull(),
    departAt: timestamp("depart_at", { withTimezone: true }).notNull(),
    seatsTotal: integer("seats_total").notNull(),
    seatsAvailable: integer("seats_available").notNull(),
    farePerSeat: numeric("fare_per_seat", { precision: 10, scale: 2 }).notNull(),
    routeGeoJSON: jsonb("route_geojson").$type<unknown>(),
    distanceKm: numeric("distance_km", { precision: 10, scale: 2 }),
    durationMin: integer("duration_min"),
    status: rideStatusEnum("status").notNull().default("published"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    /** iCal-ish RRULE or a simple weekday list, e.g. "MO,TU,WE" */
    recurrenceRule: text("recurrence_rule"),
  },
  (t) => ({
    orgIdx: index("ride_org_idx").on(t.orgId),
    driverIdx: index("ride_driver_idx").on(t.driverId),
    vehicleIdx: index("ride_vehicle_idx").on(t.vehicleId),
    statusIdx: index("ride_status_idx").on(t.status),
    departIdx: index("ride_depart_idx").on(t.departAt),
  }),
);

export const rideRelations = relations(ride, ({ one }) => ({
  organization: one(organization, { fields: [ride.orgId], references: [organization.id] }),
  driver: one(user, { fields: [ride.driverId], references: [user.id] }),
  vehicle: one(vehicle, { fields: [ride.vehicleId], references: [vehicle.id] }),
}));

export type Ride = typeof ride.$inferSelect;
export type NewRide = typeof ride.$inferInsert;

export const rideSelectSchema = createSelectSchema(ride);

/** Offer-a-ride form (shared with the API). Route geometry is filled server-side from OSRM. */
export const offerRideFormSchema = z.object({
  vehicleId: z.string().uuid("Select an approved vehicle"),
  origin: geoPointSchema,
  destination: geoPointSchema,
  departAt: z.coerce.date(),
  seatsTotal: z.coerce.number().int().min(1, "At least 1 seat").max(20),
  farePerSeat: z.coerce.number().min(0, "Fare cannot be negative").max(1_000_000),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().max(120).optional().or(z.literal("")),
});
export type OfferRideFormValues = z.infer<typeof offerRideFormSchema>;

/** Find-a-ride search form. */
export const findRideFormSchema = z.object({
  origin: geoPointSchema,
  destination: geoPointSchema,
  date: z.coerce.date(),
  seats: z.coerce.number().int().min(1).max(20).default(1),
  isRecurring: z.boolean().default(false),
});
export type FindRideFormValues = z.infer<typeof findRideFormSchema>;
