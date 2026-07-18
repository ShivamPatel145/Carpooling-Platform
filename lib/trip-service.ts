import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { booking, ride, trip, tripEvent, user, vehicle } from "@/db/schema";
import type { Trip } from "@/db/schema/trip";
import { AppError, NotFoundError } from "@/lib/errors";
import { scopedWhere, type Tenant } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import type { TripParticipant, TripRole, TripView } from "@/features/trip/schema";

/**
 * Server-side trip data access (Slice B). Keeps the API routes thin: enrichment (join ride +
 * vehicle + participants), the booking→trip handoff, and the append-only tripEvent stream all live
 * here. EVERY query is org-scoped via scopedWhere; a non-participant resolves to null so the route
 * returns 404 (never 403) — cross-org and "not my trip" are indistinguishable to the caller.
 *
 * NOTE: trip is keyed on rideId (one trip per ride — the driver has one live location that all
 * passengers on that ride follow). We enrich with plain scoped selects rather than relational
 * `with`, because ride/booking relations live in Slice A's files and we don't modify them.
 */

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
const isoReq = (d: Date): string => new Date(d).toISOString();

/** Append a trip event (status transition or location ping). Best-effort — the audit stream must
 *  never fail the action that produced it. */
export async function writeTripEvent(
  orgId: string,
  tripId: string,
  type: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(tripEvent).values({ orgId, tripId, type, payload: payload ?? null });
  } catch (err) {
    logger.error("writeTripEvent failed", { err, tripId, type });
  }
}

/**
 * The booking→trip handoff (the seam Slice B owns). Materializes a `booked` trip for every ride the
 * user participates in (as driver or confirmed passenger) that has ≥1 confirmed booking and no trip
 * yet. Idempotent (one trip per ride); a lost race just returns the existing row. Reads Slice A's
 * booking/ride — never mutates them.
 */
export async function ensureTripsForUser(tenant: Tenant, userId: string): Promise<void> {
  if (!tenant.orgId) return;

  const driven = await db
    .select({ id: ride.id })
    .from(ride)
    .where(scopedWhere(tenant, ride, eq(ride.driverId, userId)));
  const booked = await db
    .selectDistinct({ rideId: booking.rideId })
    .from(booking)
    .where(
      scopedWhere(tenant, booking, and(eq(booking.passengerId, userId), eq(booking.status, "confirmed"))),
    );

  const candidateRideIds = [...new Set([...driven.map((d) => d.id), ...booked.map((b) => b.rideId)])];
  if (!candidateRideIds.length) return;

  // A ride only becomes a trip once it has a confirmed passenger.
  const withBookings = await db
    .selectDistinct({ rideId: booking.rideId })
    .from(booking)
    .where(
      scopedWhere(tenant, booking, and(inArray(booking.rideId, candidateRideIds), eq(booking.status, "confirmed"))),
    );
  const eligible = withBookings.map((b) => b.rideId);
  if (!eligible.length) return;

  const existing = await db
    .select({ rideId: trip.rideId })
    .from(trip)
    .where(scopedWhere(tenant, trip, inArray(trip.rideId, eligible)));
  const existingSet = new Set(existing.map((e) => e.rideId));
  const missing = eligible.filter((id) => !existingSet.has(id));

  for (const rideId of missing) {
    try {
      const [row] = await db
        .insert(trip)
        .values({ orgId: tenant.orgId, rideId, status: "booked" })
        .returning();
      if (row) await writeTripEvent(tenant.orgId, row.id, "booked", { via: "booking-handoff" });
    } catch (err) {
      // Another request materialized it first — one trip per ride is the invariant we want.
      logger.warn("ensureTripsForUser: trip already exists for ride", { rideId });
    }
  }
}

/** Build enriched views for a set of trip rows. Non-participant rows resolve to null. */
async function buildViews(
  tenant: Tenant,
  userId: string,
  trips: Trip[],
  includeRoute: boolean,
): Promise<(TripView | null)[]> {
  const rideIds = [...new Set(trips.map((t) => t.rideId))];
  const rides = rideIds.length
    ? await db.select().from(ride).where(scopedWhere(tenant, ride, inArray(ride.id, rideIds)))
    : [];
  const rideById = new Map(rides.map((r) => [r.id, r]));

  const vehicleIds = [...new Set(rides.map((r) => r.vehicleId))];
  const vehicles = vehicleIds.length
    ? await db.select().from(vehicle).where(scopedWhere(tenant, vehicle, inArray(vehicle.id, vehicleIds)))
    : [];
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  const bookings = rideIds.length
    ? await db.select().from(booking).where(scopedWhere(tenant, booking, inArray(booking.rideId, rideIds)))
    : [];

  const userIds = [...new Set([...rides.map((r) => r.driverId), ...bookings.map((b) => b.passengerId)])];
  const users = userIds.length ? await db.select().from(user).where(inArray(user.id, userIds)) : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  return trips.map((t) => {
    const r = rideById.get(t.rideId);
    if (!r) return null;
    const rideBookings = bookings.filter((b) => b.rideId === r.id && b.status !== "cancelled");
    const myBooking = rideBookings.find((b) => b.passengerId === userId);
    const isDriver = r.driverId === userId;
    const isPassenger = Boolean(myBooking);
    if (!isDriver && !isPassenger) return null; // not my trip → caller returns 404

    const role: TripRole = isDriver ? "driver" : "passenger";
    const driverUser = userById.get(r.driverId);
    const driver: TripParticipant = {
      id: r.driverId,
      name: driverUser?.name ?? null,
      phone: driverUser?.phone ?? null,
    };
    const passengers: TripParticipant[] = rideBookings.map((b) => {
      const u = userById.get(b.passengerId);
      return { id: b.passengerId, name: u?.name ?? null, phone: u?.phone ?? null, seatsBooked: b.seatsBooked };
    });
    const v = vehicleById.get(r.vehicleId);

    return {
      id: t.id,
      rideId: t.rideId,
      status: t.status,
      role,
      origin: r.origin,
      destination: r.destination,
      departAt: isoReq(r.departAt),
      farePerSeat: r.farePerSeat,
      fareAmount: myBooking?.fareAmount ?? null,
      seatsBooked: myBooking?.seatsBooked ?? null,
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      etaMin: t.etaMin,
      driverLat: t.driverLat,
      driverLng: t.driverLng,
      startedAt: iso(t.startedAt),
      completedAt: iso(t.completedAt),
      createdAt: isoReq(t.createdAt),
      updatedAt: isoReq(t.updatedAt),
      vehicleLabel: v ? `${v.model} · ${v.registrationNo}` : null,
      driver,
      passengers,
      counterparty: isDriver ? (passengers[0] ?? null) : driver,
      routeGeoJSON: includeRoute ? (r.routeGeoJSON ?? null) : null,
    } satisfies TripView;
  });
}

/** All of the caller's trips (as driver or passenger), org-scoped, newest first. */
export async function getMyTripViews(tenant: Tenant, userId: string): Promise<TripView[]> {
  await ensureTripsForUser(tenant, userId);
  const trips = await db
    .select()
    .from(trip)
    .where(scopedWhere(tenant, trip))
    .orderBy(desc(trip.createdAt));
  if (!trips.length) return [];
  const views = await buildViews(tenant, userId, trips, false);
  return views.filter((v): v is TripView => v !== null);
}

/** One enriched trip by id (with route geometry). null when cross-org OR the caller isn't a party. */
export async function getTripViewById(
  tenant: Tenant,
  userId: string,
  tripId: string,
): Promise<TripView | null> {
  const [t] = await db.select().from(trip).where(scopedWhere(tenant, trip, eq(trip.id, tripId)));
  if (!t) return null;
  const [view] = await buildViews(tenant, userId, [t], true);
  return view ?? null;
}

/**
 * Explicit booking→trip create for a ride (POST /api/trip). Idempotent. Requires the caller to be a
 * participant and the ride to have a confirmed booking. Returns the (new or existing) trip row.
 */
export async function createTripForRide(
  tenant: Tenant,
  userId: string,
  rideId: string,
): Promise<Trip> {
  const [r] = await db.select().from(ride).where(scopedWhere(tenant, ride, eq(ride.id, rideId)));
  if (!r) throw new NotFoundError("That ride doesn't exist.");

  const bookings = await db
    .select()
    .from(booking)
    .where(scopedWhere(tenant, booking, and(eq(booking.rideId, rideId), eq(booking.status, "confirmed"))));
  const isDriver = r.driverId === userId;
  const isPassenger = bookings.some((b) => b.passengerId === userId);
  if (!isDriver && !isPassenger) throw new NotFoundError("That ride doesn't exist."); // hide cross-user

  if (!bookings.length) {
    throw new AppError("This ride has no confirmed booking to start a trip from.", 409, "NO_BOOKING");
  }

  const [existing] = await db.select().from(trip).where(scopedWhere(tenant, trip, eq(trip.rideId, rideId)));
  if (existing) return existing;

  const [row] = await db.insert(trip).values({ orgId: tenant.orgId!, rideId, status: "booked" }).returning();
  await writeTripEvent(tenant.orgId!, row!.id, "booked", { via: "booking-handoff" });
  return row!;
}
