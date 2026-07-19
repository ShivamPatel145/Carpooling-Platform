import { eq, or, and } from "drizzle-orm";
import { db } from "@/db";
import { trip, ride, booking, organization, vehicle } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";

/**
 * GET /api/report
 * Returns computed metrics for the dashboard.
 */
export const GET = withErrorHandler(async () => {
  const { session, tenant } = await requirePermission("report", "read");

  // The trip/booking filters depend only on tenant + role (not on any query result), so org config,
  // trips, and bookings are INDEPENDENT — fetch them in ONE parallel batch (the Neon pool pipelines
  // them over a single round-trip) instead of three sequential awaits. On remote Neon this cuts the
  // endpoint's DB time ~3×.
  const isEmployee = session.user.role === "employee";

  // Employee sees only trips they drove; admins see the whole org. payment_completed only.
  const tripCond = isEmployee
    ? scopedWhere(tenant, trip, and(eq(ride.driverId, session.user.id), eq(trip.status, "payment_completed")))
    : scopedWhere(tenant, trip, eq(trip.status, "payment_completed"));
  // Revenue = completed bookings on the driver's rides (employee) or across the org (admin).
  const revenueCond = isEmployee
    ? scopedWhere(tenant, booking, and(eq(ride.driverId, session.user.id), eq(booking.status, "completed")))
    : scopedWhere(tenant, booking, eq(booking.status, "completed"));

  const [orgRows, trips, bookings] = await Promise.all([
    db.select().from(organization).where(eq(organization.id, tenant.orgId!)).limit(1),
    db
      .select({
        id: trip.id,
        distanceKm: ride.distanceKm,
        departAt: ride.departAt,
        completedAt: trip.completedAt,
        vehicleId: ride.vehicleId,
        vehicleModel: vehicle.model,
      })
      .from(trip)
      .innerJoin(ride, eq(trip.rideId, ride.id))
      .leftJoin(vehicle, eq(ride.vehicleId, vehicle.id))
      .where(tripCond),
    db
      .select({
        fareAmount: booking.fareAmount,
        createdAt: booking.createdAt,
      })
      .from(booking)
      .innerJoin(ride, eq(booking.rideId, ride.id))
      .where(revenueCond),
  ]);

  const org = orgRows[0];
  const fuelCostPerKm = Number(org?.fuelCostPerKm ?? 0);
  const travelCostPerKm = Number(org?.travelCostPerKm ?? 0);
  const maintenanceMonthly = Number(org?.maintenanceMonthly ?? 0);

  let totalDistance = 0;
  trips.forEach((t) => {
    totalDistance += Number(t.distanceKm || 0);
  });

  let totalRevenue = 0;
  bookings.forEach((b) => {
    totalRevenue += Number(b.fareAmount || 0);
  });

  const totalFuelCost = totalDistance * fuelCostPerKm;
  const netProfit = totalRevenue - totalFuelCost - (session.user.role === "employee" ? 0 : maintenanceMonthly);

  // ── Financial Summary: REAL month buckets (design-standards §1: no fabricated stats) ──
  // Fuel follows the trip's departure month; revenue follows the booking's month. Merged + sorted.
  const monthKey = (d: Date | string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  };
  const monthLabel = (key: string) =>
    new Date(`${key}-01T00:00:00`).toLocaleString("en", { month: "short", year: "2-digit" });

  const buckets = new Map<string, { revenue: number; fuel: number }>();
  const bucket = (key: string) => {
    let b = buckets.get(key);
    if (!b) {
      b = { revenue: 0, fuel: 0 };
      buckets.set(key, b);
    }
    return b;
  };
  for (const t of trips) {
    bucket(monthKey(t.departAt)).fuel += Number(t.distanceKm || 0) * fuelCostPerKm;
  }
  for (const b of bookings) {
    bucket(monthKey(b.createdAt)).revenue += Number(b.fareAmount || 0);
  }
  const monthlySummary = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: monthLabel(key),
      revenue: Math.round(v.revenue * 100) / 100,
      fuel: Math.round(v.fuel * 100) / 100,
      net: Math.round((v.revenue - v.fuel) * 100) / 100,
    }));

  // ── Vehicle-wise cost: distance + fuel per vehicle across the same trips ──
  const byVehicle = new Map<string, { model: string; trips: number; distanceKm: number }>();
  for (const t of trips) {
    if (!t.vehicleId) continue;
    let v = byVehicle.get(t.vehicleId);
    if (!v) {
      v = { model: t.vehicleModel ?? "Unknown vehicle", trips: 0, distanceKm: 0 };
      byVehicle.set(t.vehicleId, v);
    }
    v.trips += 1;
    v.distanceKm += Number(t.distanceKm || 0);
  }
  const vehicleWise = [...byVehicle.values()]
    .map((v) => ({
      model: v.model,
      trips: v.trips,
      distanceKm: Math.round(v.distanceKm * 100) / 100,
      fuelCost: Math.round(v.distanceKm * fuelCostPerKm * 100) / 100,
    }))
    .sort((a, b) => b.fuelCost - a.fuelCost);

  return ok({
    metrics: {
      totalTrips: trips.length,
      totalDistance,
      totalFuelCost,
      netProfit,
      revenue: totalRevenue,
      maintenanceMonthly: session.user.role === "company_admin" ? maintenanceMonthly : 0,
      costPerKm: totalDistance > 0 ? Math.round((totalFuelCost / totalDistance) * 100) / 100 : 0,
    },
    monthlySummary,
    vehicleWise,
  });
});
