/**
 * ONE Zod schema per entity, re-exported from the Drizzle table (generic-crud rule #2). The API
 * routes and the forms import from HERE. Offer + Find + Booking all live in db/schema so table,
 * validation, and types never drift.
 */
export {
  offerRideFormSchema,
  findRideFormSchema,
  rideSelectSchema,
  geoPointSchema,
  rideStatusEnum,
  type Ride,
  type RideStatus,
  type OfferRideFormValues,
  type FindRideFormValues,
  type GeoPoint,
} from "@/db/schema/ride";

export {
  bookingFormSchema,
  bookingSelectSchema,
  bookingStatusEnum,
  type Booking,
  type BookingStatus,
  type BookingFormValues,
} from "@/db/schema/booking";

import { rideStatusEnum } from "@/db/schema/ride";
import { humanize } from "@/lib/utils";

/** Options for the ride-status faceted filter. */
export const rideStatusOptions = rideStatusEnum.enumValues.map((value) => ({
  value,
  label: humanize(value),
}));

/**
 * A ride enriched with the joined names the list/results screens show. The API returns this shape;
 * it isn't a table — just the select projection.
 */
export type RideWithMeta = import("@/db/schema/ride").Ride & {
  driverName: string | null;
  vehicleModel: string | null;
  seatsRequested?: number;
};

/** A booking enriched with ride + counterparty names for the "my rides" screen. */
export type BookingWithMeta = import("@/db/schema/booking").Booking & {
  origin: import("@/db/schema/ride").GeoPoint;
  destination: import("@/db/schema/ride").GeoPoint;
  departAt: string;
  driverName: string | null;
  rideStatus: import("@/db/schema/ride").RideStatus;
};
