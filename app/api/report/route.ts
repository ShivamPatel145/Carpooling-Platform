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

  // Fetch org config
  const [org] = await db.select().from(organization).where(eq(organization.id, tenant.orgId!)).limit(1);
  const fuelCostPerKm = Number(org?.fuelCostPerKm ?? 0);
  const travelCostPerKm = Number(org?.travelCostPerKm ?? 0);
  const maintenanceMonthly = Number(org?.maintenanceMonthly ?? 0);

  // Filter trips based on role
  let tripCond;
  if (session.user.role === "employee") {
    // Employee only sees their own trips (as driver)
    tripCond = scopedWhere(tenant, trip, and(
      eq(ride.driverId, session.user.id),
      eq(trip.status, "payment_completed")
    ));
  } else {
    tripCond = scopedWhere(tenant, trip, eq(trip.status, "payment_completed"));
  }

  // Fetch trips and rides (+ vehicle for the vehicle-wise breakdown)
  const trips = await db
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
    .where(tripCond);

  // Revenue from wallet entry (ride_payments for this user or org)
  let revenueCond;
  if (session.user.role === "employee") {
    // For employee, revenue is what they got? No, walletEntry ride_payment is a spend.
    // So if they are a driver, they don't get walletEntry. Wait, how do they get paid?
    // The PRD says "Revenue from walletEntry ride-payments".
    // Let's just sum all ride payments as revenue for the org.
    // For employee, their revenue is their trips * fare.
    revenueCond = scopedWhere(tenant, booking, and(
      eq(ride.driverId, session.user.id),
      eq(booking.status, "completed")
    ));
  } else {
    revenueCond = scopedWhere(tenant, booking, eq(booking.status, "completed"));
  }

  const bookings = await db
    .select({
      fareAmount: booking.fareAmount,
      createdAt: booking.createdAt,
    })
    .from(booking)
    .innerJoin(ride, eq(booking.rideId, ride.id))
    .where(revenueCond);

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
