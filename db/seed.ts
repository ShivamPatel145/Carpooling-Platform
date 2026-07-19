import { config } from "dotenv";
config({ path: ".env.local" });

// Both drivers kept: local Postgres for the hackathon, Neon for hosting (DB_DRIVER selects).
import { Pool } from "pg";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync } from "crypto";
import * as schema from "./schema";
import {
  activityLog,
  booking,
  invitation,
  message,
  notification,
  organization,
  payment,
  ride,
  savedPlace,
  supportTicket,
  systemSetting,
  trip,
  tripEvent,
  user,
  vehicle,
  walletEntry,
} from "./schema";

/**
 * db:seed — carpooling demo infrastructure. Reviewers arrive at ANY hour; an empty app reads as
 * unfinished. Seeds TWO organizations (to demo cross-tenant isolation AND both onboarding modes),
 * a super_admin, a company_admin + employees per org, vehicles (mixed approval), saved places,
 * a couple of published rides + a booking, a wallet ledger, notifications, and a support ticket —
 * so the §11 demo loop opens populated.
 *
 * Org A "Acme Mobility" auto-approves domain signups; Org B "Globex Transit" uses the approval queue.
 * Idempotent: upserts orgs by name and users by email; clears+repopulates each org's demo rows.
 *
 *   pnpm db:seed
 *
 * ⚠️  Password hashing inlined (scryptSync) — this runs OUTSIDE Next (tsx). Same format as lib/password.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

const DEMO_PASSWORD = "Password123!";
const seedUrl = process.env.DATABASE_URL!;
const seedUseNeon =
  process.env.DB_DRIVER === "neon" ||
  (process.env.DB_DRIVER !== "postgres" && /neon\.tech/i.test(seedUrl));
// One unified type across drivers (identical query-builder surface) — see db/index.ts.
const db: NodePgDatabase<typeof schema> = seedUseNeon
  ? (drizzleNeon(neon(seedUrl), { schema, casing: "snake_case" }) as unknown as NodePgDatabase<typeof schema>)
  : drizzlePg(new Pool({ connectionString: seedUrl }), { schema, casing: "snake_case" });

type SeededUser = { id: string; email: string };

async function upsertOrg(input: {
  name: string;
  domains: string[];
  autoApprove: boolean;
  fuelCostPerKm: string;
  travelCostPerKm: string;
  maintenanceMonthly: string;
}): Promise<string> {
  const existing = await db.query.organization.findFirst({ where: eq(organization.name, input.name) });
  if (existing) {
    await db
      .update(organization)
      .set({
        allowedEmailDomains: input.domains,
        autoApproveDomain: input.autoApprove,
        fuelCostPerKm: input.fuelCostPerKm,
        travelCostPerKm: input.travelCostPerKm,
        maintenanceMonthly: input.maintenanceMonthly,
        currency: "INR",
      })
      .where(eq(organization.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(organization)
    .values({
      name: input.name,
      allowedEmailDomains: input.domains,
      autoApproveDomain: input.autoApprove,
      fuelCostPerKm: input.fuelCostPerKm,
      travelCostPerKm: input.travelCostPerKm,
      maintenanceMonthly: input.maintenanceMonthly,
      currency: "INR",
    })
    .returning({ id: organization.id });
  return row!.id;
}

async function upsertUser(input: {
  email: string;
  name: string;
  role: "super_admin" | "company_admin" | "employee";
  orgId: string | null;
  phone?: string;
  department?: string;
  manager?: string;
  officeLocation?: string;
  passwordHash: string;
}): Promise<SeededUser> {
  const values = {
    name: input.name,
    role: input.role,
    orgId: input.orgId,
    phone: input.phone ?? null,
    department: input.department ?? null,
    manager: input.manager ?? null,
    officeLocation: input.officeLocation ?? null,
    status: "active" as const,
    platformAccess: "active" as const,
    passwordHash: input.passwordHash,
  };
  const existing = await db.query.user.findFirst({ where: eq(user.email, input.email) });
  if (existing) {
    await db.update(user).set(values).where(eq(user.id, existing.id));
    return { id: existing.id, email: input.email };
  }
  const [row] = await db.insert(user).values({ email: input.email, ...values }).returning({ id: user.id });
  return { id: row!.id, email: input.email };
}

/** Wipe an org's demo domain rows so re-running is deterministic (children first: a row is deleted
 *  before anything it is referenced by). trip_event/message/payment → trip → booking → ride. */
async function clearOrgData(orgId: string) {
  await db.delete(tripEvent).where(eq(tripEvent.orgId, orgId));
  await db.delete(message).where(eq(message.orgId, orgId));
  await db.delete(payment).where(eq(payment.orgId, orgId));
  await db.delete(trip).where(eq(trip.orgId, orgId));
  await db.delete(booking).where(eq(booking.orgId, orgId));
  await db.delete(ride).where(eq(ride.orgId, orgId));
  await db.delete(vehicle).where(eq(vehicle.orgId, orgId));
  await db.delete(savedPlace).where(eq(savedPlace.orgId, orgId));
  await db.delete(walletEntry).where(eq(walletEntry.orgId, orgId));
  await db.delete(invitation).where(eq(invitation.orgId, orgId));
}

const AHMEDABAD = {
  iskcon: { label: "ISKCON Cross Roads", lat: 23.0301, lng: 72.5117 },
  infocity: { label: "Infocity, Gandhinagar", lat: 23.1876, lng: 72.6358 },
  sgHighway: { label: "SG Highway", lat: 23.0335, lng: 72.5062 },
  prahladnagar: { label: "Prahlad Nagar", lat: 23.0121, lng: 72.5106 },
  satellite: { label: "Satellite, Ahmedabad", lat: 23.0132, lng: 72.5252 },
  vastrapur: { label: "Vastrapur Lake", lat: 23.0402, lng: 72.5290 },
  bopal: { label: "Bopal", lat: 23.0330, lng: 72.4640 },
  maninagar: { label: "Maninagar", lat: 22.9961, lng: 72.6009 },
  scienceCity: { label: "Science City", lat: 23.0790, lng: 72.5060 },
  airport: { label: "SVPI Airport", lat: 23.0722, lng: 72.6347 },
};

async function seedOrg(opts: {
  orgId: string;
  adminEmail: string;
  employees: Array<{ email: string; name: string; phone: string; department: string }>;
  passwordHash: string;
  autoApprovedVehicles: boolean;
}) {
  const { orgId, passwordHash } = opts;
  await clearOrgData(orgId);

  const admin = await upsertUser({
    email: opts.adminEmail,
    name: "Company Admin",
    role: "company_admin",
    orgId,
    phone: "+91 90000 00000",
    passwordHash,
  });

  const emps: SeededUser[] = [];
  for (const e of opts.employees) {
    emps.push(
      await upsertUser({
        email: e.email,
        name: e.name,
        role: "employee",
        orgId,
        phone: e.phone,
        department: e.department,
        manager: "Company Admin",
        officeLocation: "Infocity",
        passwordHash,
      }),
    );
  }

  // Saved places for the first two employees
  for (const emp of emps.slice(0, 2)) {
    await db.insert(savedPlace).values([
      { orgId, userId: emp.id, label: "Home", lat: String(AHMEDABAD.iskcon.lat), lng: String(AHMEDABAD.iskcon.lng), address: AHMEDABAD.iskcon.label },
      { orgId, userId: emp.id, label: "Office", lat: String(AHMEDABAD.infocity.lat), lng: String(AHMEDABAD.infocity.lng), address: AHMEDABAD.infocity.label },
    ]);
  }

  // Vehicles: driver-employee gets an approved car; a second gets a pending (inactive) one.
  const driver = emps[0]!;
  const [driverCar] = await db
    .insert(vehicle)
    .values({
      orgId,
      ownerId: driver.id,
      model: "Maruti Suzuki Ciaz",
      registrationNo: "GJ01AB1234",
      seatingCapacity: 4,
      approvalStatus: opts.autoApprovedVehicles ? "approved" : "approved", // driver's is approved either way so a ride can exist
    })
    .returning({ id: vehicle.id });

  if (emps[1]) {
    await db.insert(vehicle).values({
      orgId,
      ownerId: emps[1].id,
      model: "Hyundai Aura",
      registrationNo: "GJ01CD5678",
      seatingCapacity: 4,
      approvalStatus: opts.autoApprovedVehicles ? "approved" : "inactive", // Org B: awaiting approval (demo the queue)
    });
  }

  // A published ride by the driver: ISKCON → Infocity, tomorrow morning.
  const departAt = new Date(Date.now() + 18 * 60 * 60 * 1000);
  const [morningRide] = await db
    .insert(ride)
    .values({
      orgId,
      driverId: driver.id,
      vehicleId: driverCar!.id,
      origin: AHMEDABAD.iskcon,
      destination: AHMEDABAD.infocity,
      departAt,
      seatsTotal: 3,
      seatsAvailable: 2,
      farePerSeat: "80.00",
      distanceKm: "22.50",
      durationMin: 45,
      status: "published",
      isRecurring: true,
      recurrenceRule: "MO,TU,WE,TH,FR",
    })
    .returning({ id: ride.id });

  // A passenger booked one seat (seatsAvailable already reflects it: 3 total, 1 booked → 2 left).
  let morningBookingId: string | null = null;
  if (emps[1]) {
    const [bk] = await db
      .insert(booking)
      .values({
        orgId,
        rideId: morningRide!.id,
        passengerId: emps[1].id,
        seatsBooked: 1,
        pickupPoint: AHMEDABAD.iskcon,
        dropPoint: AHMEDABAD.infocity,
        fareAmount: "80.00",
        status: "confirmed",
      })
      .returning({ id: booking.id });
    morningBookingId = bk!.id;
  }

  // Wallet: give the first employee a recharge so the wallet screen shows a real balance.
  await db.insert(walletEntry).values({
    orgId,
    userId: driver.id,
    delta: "500.00",
    reason: "recharge",
    balanceAfter: "500.00",
  });

  return {
    admin,
    emps,
    driver,
    driverCarId: driverCar!.id,
    morningRideId: morningRide!.id,
    morningBookingId,
  };
}

type SeededOrg = Awaited<ReturnType<typeof seedOrg>>;

/**
 * Live demo scenario for the ONE org a reviewer explores (Acme). Everything below turns the static
 * "published ride + booking" into a moving story so every feature has data to click:
 *   - a LIVE trip in progress (started) with a driver location ping + ETA  → Live Tracking + map
 *   - persisted chat between driver and passenger on that trip             → per-trip chat
 *   - a second COMPLETED trip with a settled wallet payment                → Ride History + payments
 *   - a pending invitation                                                 → accept-invite flow
 * Idempotent: seedOrg already cleared trips/messages/payments/invitations for the org first.
 */
async function seedDemoScenario(org: SeededOrg, orgId: string) {
  const driver = org.driver; // Acme: employee@demo.dev (Eli)
  const passenger = org.emps[1]; // Acme: rider@demo.dev (Uma) — the booked passenger
  if (!passenger || !org.morningBookingId) return;

  // ── 1. A LIVE trip on the morning ride (driver en route, mid-route location) ──────────────────
  const startedAt = new Date(Date.now() - 8 * 60 * 1000); // started 8 min ago
  const [liveTrip] = await db
    .insert(trip)
    .values({
      orgId,
      rideId: org.morningRideId,
      status: "started",
      startedAt,
      // A point roughly a third of the way from ISKCON toward Infocity.
      driverLat: "23.0810000",
      driverLng: "72.5530000",
      etaMin: 12,
    })
    .returning({ id: trip.id });
  const liveTripId = liveTrip!.id;
  await db.insert(tripEvent).values([
    { orgId, tripId: liveTripId, type: "booked", payload: { via: "seed" }, at: new Date(startedAt.getTime() - 60_000) },
    { orgId, tripId: liveTripId, type: "started", payload: { by: "driver" }, at: startedAt },
    { orgId, tripId: liveTripId, type: "location", payload: { lat: 23.081, lng: 72.553, etaMin: 12 }, at: new Date() },
  ]);

  // ── 2. Persisted chat on the live trip (both directions) ──────────────────────────────────────
  const t0 = startedAt.getTime();
  await db.insert(message).values([
    { orgId, tripId: liveTripId, senderId: driver.id, body: "Heading out now, I'm at ISKCON gate.", createdAt: new Date(t0 + 30_000) },
    { orgId, tripId: liveTripId, senderId: passenger.id, body: "Great, I'm waiting near the pickup point.", createdAt: new Date(t0 + 90_000) },
    { orgId, tripId: liveTripId, senderId: driver.id, body: "White Ciaz, GJ01AB1234. Be there in ~12 min.", createdAt: new Date(t0 + 150_000) },
  ]);

  // ── 3. A COMPLETED past trip with a settled wallet payment (history + payments) ───────────────
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pastRide] = await db
    .insert(ride)
    .values({
      orgId,
      driverId: driver.id,
      vehicleId: org.driverCarId,
      origin: AHMEDABAD.iskcon,
      destination: AHMEDABAD.infocity,
      departAt: yesterday,
      seatsTotal: 3,
      seatsAvailable: 2,
      farePerSeat: "80.00",
      distanceKm: "22.50",
      durationMin: 45,
      status: "completed",
    })
    .returning({ id: ride.id });
  const [pastBooking] = await db
    .insert(booking)
    .values({
      orgId,
      rideId: pastRide!.id,
      passengerId: passenger.id,
      seatsBooked: 1,
      pickupPoint: AHMEDABAD.iskcon,
      dropPoint: AHMEDABAD.infocity,
      fareAmount: "80.00",
      status: "completed",
    })
    .returning({ id: booking.id });
  const [pastTrip] = await db
    .insert(trip)
    .values({
      orgId,
      rideId: pastRide!.id,
      status: "payment_completed",
      startedAt: new Date(yesterday.getTime() + 5 * 60_000),
      completedAt: new Date(yesterday.getTime() + 50 * 60_000),
      etaMin: 0,
    })
    .returning({ id: trip.id });
  await db.insert(payment).values({
    orgId,
    bookingId: pastBooking!.id,
    payerId: passenger.id,
    method: "wallet",
    amount: "80.00",
    status: "succeeded",
  });
  // Wallet ledger for the passenger: a recharge then the fare debit (so the balance is real).
  await db.insert(walletEntry).values([
    { orgId, userId: passenger.id, delta: "500.00", reason: "recharge", balanceAfter: "500.00" },
    { orgId, userId: passenger.id, delta: "-80.00", reason: "ride_payment", refId: pastBooking!.id, balanceAfter: "420.00" },
  ]);
  await db.insert(tripEvent).values([
    { orgId, tripId: pastTrip!.id, type: "completed", payload: { by: "driver" }, at: new Date(yesterday.getTime() + 50 * 60_000) },
    { orgId, tripId: pastTrip!.id, type: "payment", payload: { method: "wallet", amount: "80.00" }, at: new Date(yesterday.getTime() + 51 * 60_000) },
  ]);

  // ── 4. A pending invitation (accept-invite flow) ──────────────────────────────────────────────
  const inviteToken = randomBytes(24).toString("hex");
  await db.insert(invitation).values({
    orgId,
    email: "newhire@acme.dev",
    role: "employee",
    token: inviteToken,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { liveTripId, inviteToken };
}

/**
 * Reviewer volume — ~10 realistic rows per feature on Acme so EVERY list screen opens populated
 * (vehicles, rides, bookings, trips, payments, wallet ledger, chat, invitations, audit trail).
 * Runs after seedDemoScenario; idempotent because clearOrgData wiped the org's domain rows first
 * (activity log is cleared here — it isn't in clearOrgData's child-first chain).
 */
async function seedReviewerVolume(org: SeededOrg, orgId: string, passwordHash: string, liveTripId: string | null) {
  const day = 24 * 60 * 60 * 1000;
  const eli = org.driver; // employee@demo.dev
  const uma = org.emps[1]!; // rider@demo.dev
  const arjun = org.emps[2]!;
  const diya = org.emps[3]!;

  // ── 6 more employees → ~10 Acme people on the admin's Users screen ────────────────────────────
  const extra: SeededUser[] = [];
  const extraDefs = [
    { email: "rohan@acme.dev", name: "Rohan Mehta", phone: "+91 90000 77001", department: "Engineering" },
    { email: "priya@acme.dev", name: "Priya Nair", phone: "+91 90000 77002", department: "Marketing" },
    { email: "vikram@acme.dev", name: "Vikram Singh", phone: "+91 90000 77003", department: "Operations" },
    { email: "ananya@acme.dev", name: "Ananya Joshi", phone: "+91 90000 77004", department: "HR" },
    { email: "karan@acme.dev", name: "Karan Desai", phone: "+91 90000 77005", department: "Support" },
    { email: "sneha@acme.dev", name: "Sneha Kulkarni", phone: "+91 90000 77006", department: "Finance" },
  ];
  for (const e of extraDefs) {
    extra.push(
      await upsertUser({ ...e, role: "employee", orgId, manager: "Company Admin", officeLocation: "Infocity", passwordHash }),
    );
  }
  const [rohan, priya, vikram, ananya, karan, sneha] = extra as [SeededUser, SeededUser, SeededUser, SeededUser, SeededUser, SeededUser];

  // ── 8 more vehicles (10 total; mixed approval so the admin queue has entries) ─────────────────
  const carRows = await db
    .insert(vehicle)
    .values([
      { orgId, ownerId: arjun.id, model: "Honda City", registrationNo: "GJ01EF9012", seatingCapacity: 4, approvalStatus: "approved" as const },
      { orgId, ownerId: diya.id, model: "Tata Nexon", registrationNo: "GJ01GH3456", seatingCapacity: 4, approvalStatus: "approved" as const },
      { orgId, ownerId: rohan.id, model: "Kia Seltos", registrationNo: "GJ01IJ7890", seatingCapacity: 5, approvalStatus: "approved" as const },
      { orgId, ownerId: vikram.id, model: "Maruti Ertiga", registrationNo: "GJ01KL2345", seatingCapacity: 6, approvalStatus: "approved" as const },
      { orgId, ownerId: eli.id, model: "Toyota Innova Crysta", registrationNo: "GJ01MN6789", seatingCapacity: 6, approvalStatus: "approved" as const },
      { orgId, ownerId: priya.id, model: "Hyundai i20", registrationNo: "GJ01OP1234", seatingCapacity: 4, approvalStatus: "inactive" as const },
      { orgId, ownerId: karan.id, model: "Renault Kiger", registrationNo: "GJ01QR5678", seatingCapacity: 4, approvalStatus: "inactive" as const },
      { orgId, ownerId: ananya.id, model: "Honda Amaze", registrationNo: "GJ01ST9012", seatingCapacity: 4, approvalStatus: "inactive" as const },
    ])
    .returning({ id: vehicle.id, ownerId: vehicle.ownerId });
  const carOf = (userId: string) => carRows.find((c) => c.ownerId === userId)!.id;

  // ── 6 more saved places (10 total) ────────────────────────────────────────────────────────────
  await db.insert(savedPlace).values([
    { orgId, userId: arjun.id, label: "Home", lat: String(AHMEDABAD.satellite.lat), lng: String(AHMEDABAD.satellite.lng), address: AHMEDABAD.satellite.label },
    { orgId, userId: arjun.id, label: "Office", lat: String(AHMEDABAD.infocity.lat), lng: String(AHMEDABAD.infocity.lng), address: AHMEDABAD.infocity.label },
    { orgId, userId: diya.id, label: "Home", lat: String(AHMEDABAD.maninagar.lat), lng: String(AHMEDABAD.maninagar.lng), address: AHMEDABAD.maninagar.label },
    { orgId, userId: rohan.id, label: "Home", lat: String(AHMEDABAD.scienceCity.lat), lng: String(AHMEDABAD.scienceCity.lng), address: AHMEDABAD.scienceCity.label },
    { orgId, userId: priya.id, label: "Gym", lat: String(AHMEDABAD.vastrapur.lat), lng: String(AHMEDABAD.vastrapur.lng), address: AHMEDABAD.vastrapur.label },
    { orgId, userId: vikram.id, label: "Airport", lat: String(AHMEDABAD.airport.lat), lng: String(AHMEDABAD.airport.lng), address: AHMEDABAD.airport.label },
  ]);

  // ── 8 more rides (10 total) across the lifecycle: published / full / completed / cancelled ────
  const rideRows = await db
    .insert(ride)
    .values([
      // upcoming
      { orgId, driverId: eli.id, vehicleId: org.driverCarId, origin: AHMEDABAD.infocity, destination: AHMEDABAD.iskcon, departAt: new Date(Date.now() + 26 * 60 * 60 * 1000), seatsTotal: 3, seatsAvailable: 3, farePerSeat: "80.00", distanceKm: "22.50", durationMin: 45, status: "published" as const },
      { orgId, driverId: arjun.id, vehicleId: carOf(arjun.id), origin: AHMEDABAD.prahladnagar, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() + 2 * day), seatsTotal: 4, seatsAvailable: 3, farePerSeat: "75.00", distanceKm: "24.00", durationMin: 50, status: "published" as const },
      { orgId, driverId: diya.id, vehicleId: carOf(diya.id), origin: AHMEDABAD.sgHighway, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() + 20 * 60 * 60 * 1000), seatsTotal: 3, seatsAvailable: 0, farePerSeat: "90.00", distanceKm: "26.00", durationMin: 55, status: "full" as const },
      { orgId, driverId: rohan.id, vehicleId: carOf(rohan.id), origin: AHMEDABAD.scienceCity, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() + 3 * day), seatsTotal: 3, seatsAvailable: 2, farePerSeat: "85.00", distanceKm: "20.00", durationMin: 40, status: "published" as const, isRecurring: true, recurrenceRule: "MO,WE,FR" },
      // past
      { orgId, driverId: eli.id, vehicleId: org.driverCarId, origin: AHMEDABAD.bopal, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() - 2 * day), seatsTotal: 3, seatsAvailable: 2, farePerSeat: "95.00", distanceKm: "30.00", durationMin: 60, status: "completed" as const },
      { orgId, driverId: arjun.id, vehicleId: carOf(arjun.id), origin: AHMEDABAD.satellite, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() - 3 * day), seatsTotal: 4, seatsAvailable: 2, farePerSeat: "60.00", distanceKm: "25.00", durationMin: 50, status: "completed" as const },
      { orgId, driverId: diya.id, vehicleId: carOf(diya.id), origin: AHMEDABAD.maninagar, destination: AHMEDABAD.infocity, departAt: new Date(Date.now() - 5 * day), seatsTotal: 3, seatsAvailable: 2, farePerSeat: "70.00", distanceKm: "32.00", durationMin: 65, status: "completed" as const },
      { orgId, driverId: eli.id, vehicleId: org.driverCarId, origin: AHMEDABAD.vastrapur, destination: AHMEDABAD.airport, departAt: new Date(Date.now() - 1 * day), seatsTotal: 3, seatsAvailable: 3, farePerSeat: "85.00", distanceKm: "15.00", durationMin: 35, status: "cancelled" as const },
    ])
    .returning({ id: ride.id });
  const [rEve, rArjun, rFull, rRohan, rEli2, rArjun2, rDiya2, rCancelled] = rideRows.map((r) => r.id) as string[];

  // ── 10 more bookings (12 total) in every state ────────────────────────────────────────────────
  const bookingRows = await db
    .insert(booking)
    .values([
      { orgId, rideId: rFull!, passengerId: vikram.id, seatsBooked: 1, pickupPoint: AHMEDABAD.sgHighway, dropPoint: AHMEDABAD.infocity, fareAmount: "90.00", status: "confirmed" as const },
      { orgId, rideId: rFull!, passengerId: sneha.id, seatsBooked: 1, pickupPoint: AHMEDABAD.sgHighway, dropPoint: AHMEDABAD.infocity, fareAmount: "90.00", status: "confirmed" as const },
      { orgId, rideId: rFull!, passengerId: karan.id, seatsBooked: 1, pickupPoint: AHMEDABAD.sgHighway, dropPoint: AHMEDABAD.infocity, fareAmount: "90.00", status: "confirmed" as const },
      { orgId, rideId: rArjun!, passengerId: ananya.id, seatsBooked: 1, pickupPoint: AHMEDABAD.prahladnagar, dropPoint: AHMEDABAD.infocity, fareAmount: "75.00", status: "confirmed" as const },
      { orgId, rideId: rRohan!, passengerId: uma.id, seatsBooked: 1, pickupPoint: AHMEDABAD.scienceCity, dropPoint: AHMEDABAD.infocity, fareAmount: "85.00", status: "pending" as const },
      { orgId, rideId: rEli2!, passengerId: arjun.id, seatsBooked: 1, pickupPoint: AHMEDABAD.bopal, dropPoint: AHMEDABAD.infocity, fareAmount: "95.00", status: "completed" as const },
      { orgId, rideId: rArjun2!, passengerId: priya.id, seatsBooked: 1, pickupPoint: AHMEDABAD.satellite, dropPoint: AHMEDABAD.infocity, fareAmount: "60.00", status: "completed" as const },
      { orgId, rideId: rArjun2!, passengerId: sneha.id, seatsBooked: 1, pickupPoint: AHMEDABAD.satellite, dropPoint: AHMEDABAD.infocity, fareAmount: "60.00", status: "completed" as const },
      { orgId, rideId: rDiya2!, passengerId: karan.id, seatsBooked: 1, pickupPoint: AHMEDABAD.maninagar, dropPoint: AHMEDABAD.infocity, fareAmount: "70.00", status: "completed" as const },
      { orgId, rideId: rCancelled!, passengerId: ananya.id, seatsBooked: 1, pickupPoint: AHMEDABAD.vastrapur, dropPoint: AHMEDABAD.airport, fareAmount: "85.00", status: "cancelled" as const },
    ])
    .returning({ id: booking.id, rideId: booking.rideId, passengerId: booking.passengerId });
  const bkOn = (rideId: string, passengerId: string) =>
    bookingRows.find((b) => b.rideId === rideId && b.passengerId === passengerId)!.id;

  // ── Completed trips for the 3 past rides (5 trips total) + their events ───────────────────────
  const pastTripDefs = [
    { rideId: rEli2!, daysAgo: 2 },
    { rideId: rArjun2!, daysAgo: 3 },
    { rideId: rDiya2!, daysAgo: 5 },
  ];
  for (const t of pastTripDefs) {
    const start = new Date(Date.now() - t.daysAgo * day);
    const end = new Date(start.getTime() + 55 * 60_000);
    const [row] = await db
      .insert(trip)
      .values({ orgId, rideId: t.rideId, status: "payment_completed", startedAt: start, completedAt: end, etaMin: 0 })
      .returning({ id: trip.id });
    await db.insert(tripEvent).values([
      { orgId, tripId: row!.id, type: "started", payload: { by: "driver" }, at: start },
      { orgId, tripId: row!.id, type: "completed", payload: { by: "driver" }, at: end },
    ]);
  }

  // ── 7 more chat messages on the live trip (10 total) ──────────────────────────────────────────
  if (liveTripId) {
    const base = Date.now() - 6 * 60_000;
    const chat: Array<{ senderId: string; body: string }> = [
      { senderId: uma.id, body: "Traffic looks light on SG Highway today." },
      { senderId: eli.id, body: "Yes, should reach a couple of minutes early." },
      { senderId: uma.id, body: "Can we make a quick stop at the Iscon signal?" },
      { senderId: eli.id, body: "Sure, that's on the route anyway." },
      { senderId: uma.id, body: "Thanks! I'm wearing a blue jacket, easy to spot." },
      { senderId: eli.id, body: "Noted. Crossing Vastrapur lake now." },
      { senderId: uma.id, body: "See you in a bit 👍" },
    ];
    await db.insert(message).values(
      chat.map((m, i) => ({ orgId, tripId: liveTripId, senderId: m.senderId, body: m.body, createdAt: new Date(base + i * 45_000) })),
    );
  }

  // ── 8 more payments (9 total): succeeded / failed+retried / refunded / pending ────────────────
  await db.insert(payment).values([
    { orgId, bookingId: bkOn(rEli2!, arjun.id), payerId: arjun.id, method: "upi", amount: "95.00", status: "succeeded" },
    { orgId, bookingId: bkOn(rArjun2!, priya.id), payerId: priya.id, method: "card", amount: "60.00", status: "failed" },
    { orgId, bookingId: bkOn(rArjun2!, priya.id), payerId: priya.id, method: "wallet", amount: "60.00", status: "succeeded" },
    { orgId, bookingId: bkOn(rArjun2!, sneha.id), payerId: sneha.id, method: "cash", amount: "60.00", status: "succeeded" },
    { orgId, bookingId: bkOn(rDiya2!, karan.id), payerId: karan.id, method: "card", amount: "70.00", status: "succeeded" },
    { orgId, bookingId: bkOn(rCancelled!, ananya.id), payerId: ananya.id, method: "wallet", amount: "85.00", status: "refunded" },
    { orgId, bookingId: bkOn(rFull!, vikram.id), payerId: vikram.id, method: "upi", amount: "90.00", status: "pending" },
    { orgId, bookingId: bkOn(rFull!, sneha.id), payerId: sneha.id, method: "wallet", amount: "90.00", status: "pending" },
  ]);

  // ── 8 more wallet ledger entries (11 total) — balances stay self-consistent per user ──────────
  await db.insert(walletEntry).values([
    { orgId, userId: eli.id, delta: "80.00", reason: "ride_earning", balanceAfter: "580.00" },
    { orgId, userId: arjun.id, delta: "300.00", reason: "recharge", balanceAfter: "300.00" },
    { orgId, userId: arjun.id, delta: "-95.00", reason: "ride_payment", refId: bkOn(rEli2!, arjun.id), balanceAfter: "205.00" },
    { orgId, userId: priya.id, delta: "150.00", reason: "recharge", balanceAfter: "150.00" },
    { orgId, userId: priya.id, delta: "-60.00", reason: "ride_payment", refId: bkOn(rArjun2!, priya.id), balanceAfter: "90.00" },
    { orgId, userId: vikram.id, delta: "400.00", reason: "recharge", balanceAfter: "400.00" },
    { orgId, userId: ananya.id, delta: "85.00", reason: "refund", refId: bkOn(rCancelled!, ananya.id), balanceAfter: "85.00" },
    { orgId, userId: diya.id, delta: "200.00", reason: "recharge", balanceAfter: "200.00" },
  ]);

  // ── 3 more invitations (4 total): pending / accepted / expired ────────────────────────────────
  await db.insert(invitation).values([
    { orgId, email: "devesh@acme.dev", role: "employee", token: randomBytes(24).toString("hex"), status: "pending", expiresAt: new Date(Date.now() + 7 * day) },
    { orgId, email: "sneha@acme.dev", role: "employee", token: randomBytes(24).toString("hex"), status: "accepted", expiresAt: new Date(Date.now() + 7 * day) },
    { orgId, email: "legacy@acme.dev", role: "employee", token: randomBytes(24).toString("hex"), status: "expired", expiresAt: new Date(Date.now() - 2 * day) },
  ]);

  // ── ~12 audit-trail entries so the admin's Activity screen tells a story ──────────────────────
  await db.delete(activityLog).where(eq(activityLog.orgId, orgId));
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) seed";
  await db.insert(activityLog).values([
    { orgId, actorId: eli.id, action: "login", resource: "user", resourceId: eli.id, ip: "203.0.113.10", userAgent: ua, createdAt: new Date(Date.now() - 6 * day) },
    { orgId, actorId: eli.id, action: "create", resource: "vehicle", resourceId: org.driverCarId, metadata: { model: "Maruti Suzuki Ciaz" }, ip: "203.0.113.10", userAgent: ua, createdAt: new Date(Date.now() - 6 * day + 60_000) },
    { orgId, actorId: org.admin.id, action: "approve", resource: "vehicle", resourceId: org.driverCarId, metadata: { registrationNo: "GJ01AB1234" }, ip: "203.0.113.20", userAgent: ua, createdAt: new Date(Date.now() - 5 * day) },
    { orgId, actorId: diya.id, action: "create", resource: "ride", resourceId: rDiya2!, metadata: { route: "Maninagar → Infocity" }, ip: "203.0.113.30", userAgent: ua, createdAt: new Date(Date.now() - 5 * day + 120_000) },
    { orgId, actorId: karan.id, action: "create", resource: "booking", resourceId: bkOn(rDiya2!, karan.id), metadata: { seats: 1 }, ip: "203.0.113.31", userAgent: ua, createdAt: new Date(Date.now() - 5 * day + 300_000) },
    { orgId, actorId: arjun.id, action: "create", resource: "ride", resourceId: rArjun2!, metadata: { route: "Satellite → Infocity" }, ip: "203.0.113.32", userAgent: ua, createdAt: new Date(Date.now() - 3 * day) },
    { orgId, actorId: priya.id, action: "create", resource: "booking", resourceId: bkOn(rArjun2!, priya.id), metadata: { seats: 1 }, ip: "203.0.113.33", userAgent: ua, createdAt: new Date(Date.now() - 3 * day + 200_000) },
    { orgId, actorId: priya.id, action: "create", resource: "payment", resourceId: bkOn(rArjun2!, priya.id), metadata: { method: "wallet", amount: "60.00" }, ip: "203.0.113.33", userAgent: ua, createdAt: new Date(Date.now() - 3 * day + 3_600_000) },
    { orgId, actorId: eli.id, action: "cancel", resource: "ride", resourceId: rCancelled!, metadata: { reason: "vehicle service" }, ip: "203.0.113.10", userAgent: ua, createdAt: new Date(Date.now() - 1 * day) },
    { orgId, actorId: org.admin.id, action: "create", resource: "invitation", metadata: { email: "devesh@acme.dev" }, ip: "203.0.113.20", userAgent: ua, createdAt: new Date(Date.now() - 1 * day + 500_000) },
    { orgId, actorId: uma.id, action: "create", resource: "supportTicket", metadata: { subject: "Driver didn't arrive at pickup" }, ip: "203.0.113.40", userAgent: ua, createdAt: new Date(Date.now() - 0.5 * day) },
    { orgId, actorId: rohan.id, action: "create", resource: "ride", resourceId: rRohan!, metadata: { route: "Science City → Infocity", recurring: true }, ip: "203.0.113.34", userAgent: ua, createdAt: new Date(Date.now() - 0.2 * day) },
  ]);

  // ── Passenger history for rider@demo.dev: 2 more completed trips (3 total in /history) ────────
  const riderPastDefs = [
    { driver: diya, car: carOf(diya.id), origin: AHMEDABAD.vastrapur, destination: AHMEDABAD.infocity, daysAgo: 4, fare: "70.00", method: "wallet" as const, distanceKm: "24.00", durationMin: 48 },
    { driver: rohan, car: carOf(rohan.id), origin: AHMEDABAD.bopal, destination: AHMEDABAD.prahladnagar, daysAgo: 6, fare: "65.00", method: "upi" as const, distanceKm: "12.00", durationMin: 30 },
  ];
  for (const d of riderPastDefs) {
    const departAt = new Date(Date.now() - d.daysAgo * day);
    const [hRide] = await db
      .insert(ride)
      .values({ orgId, driverId: d.driver.id, vehicleId: d.car, origin: d.origin, destination: d.destination, departAt, seatsTotal: 3, seatsAvailable: 2, farePerSeat: d.fare, distanceKm: d.distanceKm, durationMin: d.durationMin, status: "completed" })
      .returning({ id: ride.id });
    const [hBk] = await db
      .insert(booking)
      .values({ orgId, rideId: hRide!.id, passengerId: uma.id, seatsBooked: 1, pickupPoint: d.origin, dropPoint: d.destination, fareAmount: d.fare, status: "completed" })
      .returning({ id: booking.id });
    const [hTrip] = await db
      .insert(trip)
      .values({ orgId, rideId: hRide!.id, status: "payment_completed", startedAt: new Date(departAt.getTime() + 5 * 60_000), completedAt: new Date(departAt.getTime() + (d.durationMin + 5) * 60_000), etaMin: 0 })
      .returning({ id: trip.id });
    await db.insert(tripEvent).values([
      { orgId, tripId: hTrip!.id, type: "started", payload: { by: "driver" }, at: new Date(departAt.getTime() + 5 * 60_000) },
      { orgId, tripId: hTrip!.id, type: "completed", payload: { by: "driver" }, at: new Date(departAt.getTime() + (d.durationMin + 5) * 60_000) },
    ]);
    await db.insert(payment).values({ orgId, bookingId: hBk!.id, payerId: uma.id, method: d.method, amount: d.fare, status: "succeeded" });
  }
  // Uma's ledger continues coherently from the scenario's 420: −70 → 350, then a recharge → 550.
  await db.insert(walletEntry).values([
    { orgId, userId: uma.id, delta: "-70.00", reason: "ride_payment", balanceAfter: "350.00" },
    { orgId, userId: uma.id, delta: "200.00", reason: "recharge", balanceAfter: "550.00" },
  ]);

  return { extra, counts: { employees: 6, vehicles: 8, rides: 10, bookings: 12, payments: 10, walletEntries: 10, messages: 7, invitations: 3, activity: 12 } };
}

/**
 * Platform volume for superadmin@demo.dev — the /platform console must ALSO open populated:
 * ~8 organizations (varied onboarding modes/settings, each with a company_admin), pending
 * company_admin invitations, platform-level audit entries, and a notification bell for the
 * super admin. Idempotent: orgs/admins upsert by name/email; invites/logs/bell delete-then-insert.
 */
async function seedPlatformVolume(superAdminId: string, passwordHash: string) {
  const day = 24 * 60 * 60 * 1000;
  const orgDefs = [
    { name: "TechNova Solutions", domains: ["technova.io"], autoApprove: true, fuel: "7.00", travel: "11.50", maint: "12000.00" },
    { name: "Meridian Finance", domains: ["meridian.co"], autoApprove: false, fuel: "8.50", travel: "14.00", maint: "20000.00" },
    { name: "BlueSky Logistics", domains: ["bluesky.in"], autoApprove: true, fuel: "6.75", travel: "10.00", maint: "25000.00" },
    { name: "Kinetic Motors", domains: ["kinetic.dev"], autoApprove: false, fuel: "7.25", travel: "12.50", maint: "16000.00" },
    { name: "Zephyr Analytics", domains: ["zephyr.ai"], autoApprove: true, fuel: "9.00", travel: "15.00", maint: "10000.00" },
    { name: "Horizon Health", domains: ["horizonhealth.in"], autoApprove: false, fuel: "8.00", travel: "13.00", maint: "22000.00" },
  ];
  const newOrgIds: string[] = [];
  for (const o of orgDefs) {
    const id = await upsertOrg({ name: o.name, domains: o.domains, autoApprove: o.autoApprove, fuelCostPerKm: o.fuel, travelCostPerKm: o.travel, maintenanceMonthly: o.maint });
    newOrgIds.push(id);
    await upsertUser({
      email: `admin@${o.domains[0]}`,
      name: `${o.name.split(" ")[0]} Admin`,
      role: "company_admin",
      orgId: id,
      passwordHash,
    });
  }

  // Pending company_admin invitations on the two newest orgs (Path 1 onboarding).
  for (const orgId of newOrgIds.slice(-2)) {
    await db.delete(invitation).where(eq(invitation.orgId, orgId));
    await db.insert(invitation).values({
      orgId,
      email: `ops@${orgDefs[newOrgIds.indexOf(orgId)]!.domains[0]}`,
      role: "company_admin",
      token: randomBytes(24).toString("hex"),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * day),
    });
  }

  // Platform-level audit trail (orgId per target org, actor = super admin).
  await db.delete(activityLog).where(eq(activityLog.actorId, superAdminId));
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) seed";
  await db.insert(activityLog).values([
    { orgId: null, actorId: superAdminId, action: "login", resource: "user", resourceId: superAdminId, ip: "198.51.100.5", userAgent: ua, createdAt: new Date(Date.now() - 10 * day) },
    ...newOrgIds.map((id, i) => ({
      orgId: id,
      actorId: superAdminId,
      action: "create",
      resource: "organization",
      resourceId: id,
      metadata: { name: orgDefs[i]!.name, autoApprove: orgDefs[i]!.autoApprove },
      ip: "198.51.100.5",
      userAgent: ua,
      createdAt: new Date(Date.now() - (9 - i) * day),
    })),
    { orgId: newOrgIds[4]!, actorId: superAdminId, action: "create", resource: "invitation", metadata: { email: `ops@${orgDefs[4]!.domains[0]}`, role: "company_admin" }, ip: "198.51.100.5", userAgent: ua, createdAt: new Date(Date.now() - 2 * day) },
    { orgId: newOrgIds[5]!, actorId: superAdminId, action: "create", resource: "invitation", metadata: { email: `ops@${orgDefs[5]!.domains[0]}`, role: "company_admin" }, ip: "198.51.100.5", userAgent: ua, createdAt: new Date(Date.now() - 1 * day) },
  ]);

  // Super admin's bell.
  const hr = 60 * 60 * 1000;
  await db.delete(notification).where(eq(notification.userId, superAdminId));
  await db.insert(notification).values([
    { userId: superAdminId, type: "success", title: "Organization onboarded", body: "Horizon Health completed registration (approval-queue mode).", href: "/platform/organizations", isRead: false, createdAt: new Date(Date.now() - 1 * day) },
    { userId: superAdminId, type: "info", title: "Company admin invite pending", body: "ops@zephyr.ai hasn't accepted their invitation yet.", href: "/platform/organizations", isRead: false, createdAt: new Date(Date.now() - 2 * day) },
    { userId: superAdminId, type: "info", title: "Platform weekly digest", body: "8 organizations · 22 users · 13 rides this week.", href: "/platform", isRead: true, createdAt: new Date(Date.now() - 3 * day) },
    { userId: superAdminId, type: "warning", title: "Support escalation", body: "An urgent fare-dispute ticket was closed at Acme Mobility.", href: "/platform/activity", isRead: true, createdAt: new Date(Date.now() - 4 * 24 * hr) },
  ]);

  return { orgs: orgDefs.length };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  console.log("🌱 Seeding carpooling demo…");
  const passwordHash = hashPassword(DEMO_PASSWORD);

  // Super admin — cross-tenant, no org.
  const superAdmin = await upsertUser({
    email: "superadmin@demo.dev",
    name: "Sam Super",
    role: "super_admin",
    orgId: null,
    passwordHash,
  });
  console.log(`  • super_admin ${superAdmin.email}`);

  // ── Org A — auto-approve on domain match ──────────────────────────────────────────────────
  const orgAId = await upsertOrg({
    name: "Acme Mobility",
    domains: ["acme.dev", "demo.dev"],
    autoApprove: true,
    fuelCostPerKm: "7.50",
    travelCostPerKm: "12.00",
    maintenanceMonthly: "15000.00",
  });
  const orgA = await seedOrg({
    orgId: orgAId,
    adminEmail: "admin@demo.dev",
    passwordHash,
    autoApprovedVehicles: true,
    employees: [
      { email: "employee@demo.dev", name: "Eli Employee", phone: "+91 90000 11111", department: "Engineering" },
      { email: "rider@demo.dev", name: "Uma Rider", phone: "+91 90000 22222", department: "Design" },
      { email: "arjun@acme.dev", name: "Arjun Patel", phone: "+91 90000 33333", department: "Sales" },
      { email: "diya@acme.dev", name: "Diya Shah", phone: "+91 90000 44444", department: "Finance" },
    ],
  });
  console.log(`  • org "Acme Mobility" (auto-approve): admin + ${orgA.emps.length} employees, vehicles, ride, booking`);

  // Live demo story on Acme: a trip in progress + chat, a completed trip + payment, an invitation.
  const scenario = await seedDemoScenario(orgA, orgAId);
  if (scenario) {
    console.log(`  • Acme live scenario: 1 in-progress trip (+chat), 1 completed trip (+wallet payment), 1 pending invite`);
  }

  // Reviewer volume: ~10 rows per feature so every list screen opens populated.
  const volume = await seedReviewerVolume(orgA, orgAId, passwordHash, scenario?.liveTripId ?? null);
  console.log(
    `  • Acme reviewer volume: +${volume.counts.employees} employees, +${volume.counts.vehicles} vehicles, ` +
      `+${volume.counts.rides} rides, +${volume.counts.bookings} bookings, +${volume.counts.payments} payments, ` +
      `+${volume.counts.walletEntries} wallet entries, +${volume.counts.messages} chat messages, ` +
      `+${volume.counts.invitations} invitations, ${volume.counts.activity} audit entries`,
  );

  // ── Org B — approval queue (autoApprove off) ──────────────────────────────────────────────
  const orgBId = await upsertOrg({
    name: "Globex Transit",
    domains: ["globex.dev"],
    autoApprove: false,
    fuelCostPerKm: "8.00",
    travelCostPerKm: "13.50",
    maintenanceMonthly: "18000.00",
  });
  const orgB = await seedOrg({
    orgId: orgBId,
    adminEmail: "admin@globex.dev",
    passwordHash,
    autoApprovedVehicles: false,
    employees: [
      { email: "kabir@globex.dev", name: "Kabir Rao", phone: "+91 90000 55555", department: "Operations" },
      { email: "meera@globex.dev", name: "Meera Iyer", phone: "+91 90000 66666", department: "HR" },
    ],
  });
  console.log(`  • org "Globex Transit" (approval queue): admin + ${orgB.emps.length} employees, ride + pending vehicle`);

  // Platform volume so the SUPER ADMIN console opens populated too (8 orgs, invites, audit, bell).
  const platform = await seedPlatformVolume(superAdmin.id, passwordHash);
  console.log(`  • platform volume: +${platform.orgs} organizations (each with a company_admin), 2 pending admin invites, 9 platform audit entries, 4 super-admin notifications`);

  // Notifications (~10 across the two demo logins so both bells have real counts).
  const rider = orgA.emps.find((e) => e.email === "rider@demo.dev")!;
  const driverEli = orgA.driver;
  const hr = 60 * 60 * 1000;
  await db.delete(notification).where(eq(notification.userId, rider.id));
  await db.delete(notification).where(eq(notification.userId, driverEli.id));
  await db.delete(notification).where(eq(notification.userId, orgA.admin.id));
  await db.insert(notification).values([
    // admin@demo.dev (company admin) — approvals, tickets, org pulse
    { userId: orgA.admin.id, type: "warning", title: "3 vehicles awaiting approval", body: "Hyundai i20, Renault Kiger and Honda Amaze are in the queue.", href: "/admin", isRead: false, createdAt: new Date(Date.now() - 3 * hr) },
    { userId: orgA.admin.id, type: "info", title: "New support ticket assigned", body: "\"Driver didn't arrive at pickup\" was assigned to you (high).", href: "/support", isRead: false, createdAt: new Date(Date.now() - 5 * hr) },
    { userId: orgA.admin.id, type: "success", title: "Invitation accepted", body: "sneha@acme.dev joined Acme Mobility.", href: "/admin", isRead: true, createdAt: new Date(Date.now() - 30 * hr) },
    { userId: orgA.admin.id, type: "info", title: "Weekly org report ready", body: "13 rides · 15 bookings · ₹1,020 in fares this week.", href: "/reports", isRead: true, createdAt: new Date(Date.now() - 50 * hr) },
    // rider@demo.dev (passenger)
    { userId: rider.id, type: "info", title: "Welcome to Acme Mobility", body: "Your carpool account is ready.", href: "/dashboard", isRead: true, createdAt: new Date(Date.now() - 72 * hr) },
    { userId: rider.id, type: "success", title: "Booking confirmed", body: "Your seat on the ISKCON → Infocity ride is booked.", href: "/app/trips", isRead: false, createdAt: new Date(Date.now() - 20 * hr) },
    { userId: rider.id, type: "warning", title: "Rate your last trip", body: "How was your ride yesterday?", href: "/history", isRead: false, createdAt: new Date(Date.now() - 18 * hr) },
    { userId: rider.id, type: "info", title: "Driver is on the way", body: "Eli started the trip — track it live.", href: "/app/track", isRead: false, createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    { userId: rider.id, type: "success", title: "Payment settled", body: "₹80.00 was paid from your wallet for yesterday's ride.", href: "/wallet", isRead: true, createdAt: new Date(Date.now() - 22 * hr) },
    { userId: rider.id, type: "info", title: "New ride on your route", body: "Science City → Infocity (recurring MO/WE/FR) just got published.", href: "/app/find", isRead: false, createdAt: new Date(Date.now() - 4 * hr) },
    // employee@demo.dev (driver)
    { userId: driverEli.id, type: "success", title: "Vehicle approved", body: "Your Maruti Suzuki Ciaz (GJ01AB1234) was approved by the admin.", href: "/app/vehicles", isRead: true, createdAt: new Date(Date.now() - 5 * 24 * hr) },
    { userId: driverEli.id, type: "info", title: "New booking on your ride", body: "Uma booked 1 seat on ISKCON → Infocity.", href: "/app/rides", isRead: false, createdAt: new Date(Date.now() - 19 * hr) },
    { userId: driverEli.id, type: "success", title: "You earned ₹80.00", body: "Fare received for yesterday's completed trip.", href: "/wallet", isRead: false, createdAt: new Date(Date.now() - 21 * hr) },
    { userId: driverEli.id, type: "warning", title: "Ride cancelled", body: "Your Vastrapur → Airport ride was cancelled (vehicle service).", href: "/app/rides", isRead: true, createdAt: new Date(Date.now() - 23 * hr) },
  ]);
  console.log("  • 14 notifications (6 rider + 4 driver + 4 company admin)");

  // ~10 support tickets in every state so the admin's queue has a real backlog.
  await db.delete(supportTicket).where(eq(supportTicket.orgId, orgAId));
  const people = [...orgA.emps, ...volume.extra];
  const byEmail = (email: string) => people.find((p) => p.email === email)!;
  await db.insert(supportTicket).values([
    { orgId: orgAId, requesterId: rider.id, assigneeId: orgA.admin.id, subject: "Driver didn't arrive at pickup", description: "Waited 15 minutes at ISKCON Cross Roads; the driver never showed.", status: "open", priority: "high", createdAt: new Date(Date.now() - 6 * hr) },
    { orgId: orgAId, requesterId: byEmail("arjun@acme.dev").id, assigneeId: orgA.admin.id, subject: "Wallet recharge not reflecting", description: "Paid ₹300 via UPI but the balance took 10 minutes to update.", status: "in_progress", priority: "medium", createdAt: new Date(Date.now() - 26 * hr) },
    { orgId: orgAId, requesterId: byEmail("priya@acme.dev").id, subject: "Card payment failed twice", description: "My card keeps failing at checkout; wallet worked as a fallback.", status: "open", priority: "medium", createdAt: new Date(Date.now() - 30 * hr) },
    { orgId: orgAId, requesterId: byEmail("karan@acme.dev").id, assigneeId: orgA.admin.id, subject: "Can't edit my vehicle details", description: "The registration number field is greyed out after approval.", status: "resolved", priority: "low", createdAt: new Date(Date.now() - 3 * 24 * hr) },
    { orgId: orgAId, requesterId: byEmail("ananya@acme.dev").id, assigneeId: orgA.admin.id, subject: "Refund for cancelled ride", description: "The Vastrapur → Airport ride was cancelled — refund reached my wallet, please confirm the ledger.", status: "resolved", priority: "medium", createdAt: new Date(Date.now() - 20 * hr) },
    { orgId: orgAId, requesterId: byEmail("sneha@acme.dev").id, subject: "App shows wrong ETA on live trip", description: "ETA said 5 min while the driver was 15 min away.", status: "open", priority: "low", createdAt: new Date(Date.now() - 8 * hr) },
    { orgId: orgAId, requesterId: byEmail("vikram@acme.dev").id, assigneeId: orgA.admin.id, subject: "Recurring ride not repeating", description: "My MO/WE/FR ride only shows the next occurrence.", status: "in_progress", priority: "high", createdAt: new Date(Date.now() - 48 * hr) },
    { orgId: orgAId, requesterId: byEmail("rohan@acme.dev").id, subject: "Chat notifications delayed", description: "Messages arrive but the bell updates a minute late.", status: "open", priority: "low", createdAt: new Date(Date.now() - 12 * hr) },
    { orgId: orgAId, requesterId: byEmail("diya@acme.dev").id, assigneeId: orgA.admin.id, subject: "Passenger no-show, fare dispute", description: "Passenger didn't show; requesting the cancellation fee per policy.", status: "closed", priority: "urgent", createdAt: new Date(Date.now() - 4 * 24 * hr) },
    { orgId: orgAId, requesterId: byEmail("employee@demo.dev").id, subject: "Update office pickup point", description: "Please move the default Infocity pickup to Gate 2.", status: "closed", priority: "low", createdAt: new Date(Date.now() - 5 * 24 * hr) },
  ]);
  console.log("  • 10 support tickets (open/in_progress/resolved/closed)");

  // Platform-level settings.
  const settings = [
    { key: "app.name", value: "Enterprise Carpooling", category: "general", label: "Application name" },
    { key: "app.support_email", value: "support@demo.dev", category: "general", label: "Support email" },
    { key: "features.registration_open", value: true, category: "features", label: "Open registration" },
  ];
  for (const s of settings) {
    const existing = await db.query.systemSetting.findFirst({ where: eq(systemSetting.key, s.key) });
    if (!existing) await db.insert(systemSetting).values(s);
  }
  console.log(`  • ${settings.length} system settings`);

  console.log("\n✅ Seed complete.  (password for all: " + DEMO_PASSWORD + ")");
  console.log("   super_admin    superadmin@demo.dev");
  console.log("   Acme admin     admin@demo.dev        (auto-approve org)");
  console.log("   Acme employees employee@demo.dev · rider@demo.dev · arjun@acme.dev · diya@acme.dev");
  console.log("                  + rohan/priya/vikram/ananya/karan/sneha @acme.dev (reviewer volume)");
  console.log("   Globex admin   admin@globex.dev      (approval-queue org)");
  console.log("   Globex emps    kabir@globex.dev · meera@globex.dev");
  if (scenario) {
    console.log("\n🎬 Demo scenario (Acme): log in as employee@demo.dev (driver) or rider@demo.dev (passenger)");
    console.log(`   • Live tracking + chat:  /app/track  →  a trip is IN PROGRESS right now`);
    console.log(`   • Ride history + payment: /history  →  a completed trip with a settled wallet payment`);
    console.log(`   • Accept-invite flow:     /accept-invite?token=${scenario.inviteToken}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
