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
  booking,
  notification,
  organization,
  ride,
  savedPlace,
  supportTicket,
  systemSetting,
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

/** Wipe an org's demo domain rows so re-running is deterministic (children first). */
async function clearOrgData(orgId: string) {
  await db.delete(booking).where(eq(booking.orgId, orgId));
  await db.delete(ride).where(eq(ride.orgId, orgId));
  await db.delete(vehicle).where(eq(vehicle.orgId, orgId));
  await db.delete(savedPlace).where(eq(savedPlace.orgId, orgId));
  await db.delete(walletEntry).where(eq(walletEntry.orgId, orgId));
}

const AHMEDABAD = {
  iskcon: { label: "ISKCON Cross Roads", lat: 23.0301, lng: 72.5117 },
  infocity: { label: "Infocity, Gandhinagar", lat: 23.1876, lng: 72.6358 },
  sgHighway: { label: "SG Highway", lat: 23.0335, lng: 72.5062 },
  prahladnagar: { label: "Prahlad Nagar", lat: 23.0121, lng: 72.5106 },
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
  if (emps[1]) {
    await db.insert(booking).values({
      orgId,
      rideId: morningRide!.id,
      passengerId: emps[1].id,
      seatsBooked: 1,
      pickupPoint: AHMEDABAD.iskcon,
      dropPoint: AHMEDABAD.infocity,
      fareAmount: "80.00",
      status: "confirmed",
    });
  }

  // Wallet: give the first employee a recharge so the wallet screen shows a real balance.
  await db.insert(walletEntry).values({
    orgId,
    userId: driver.id,
    delta: "500.00",
    reason: "recharge",
    balanceAfter: "500.00",
  });

  return { admin, emps };
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

  // Notifications for the primary rider (bell count).
  const rider = orgA.emps.find((e) => e.email === "rider@demo.dev")!;
  await db.delete(notification).where(eq(notification.userId, rider.id));
  await db.insert(notification).values([
    { userId: rider.id, type: "info", title: "Welcome to Acme Mobility", body: "Your carpool account is ready.", href: "/dashboard" },
    { userId: rider.id, type: "success", title: "Booking confirmed", body: "Your seat on the ISKCON → Infocity ride is booked.", href: "/app/trips", isRead: false },
    { userId: rider.id, type: "warning", title: "Rate your last trip", body: "How was your ride yesterday?", href: "/history", isRead: false },
  ]);
  console.log("  • 3 notifications for rider@demo.dev");

  // A support ticket linked to the org (D11 rideId can be attached build-day).
  const existingTicket = await db.query.supportTicket.findFirst({ where: eq(supportTicket.requesterId, rider.id) });
  if (!existingTicket) {
    await db.insert(supportTicket).values({
      orgId: orgAId,
      requesterId: rider.id,
      assigneeId: orgA.admin.id,
      subject: "Driver didn't arrive at pickup",
      description: "Waited 15 minutes at ISKCON Cross Roads; the driver never showed.",
      status: "open",
      priority: "high",
    });
    console.log("  • 1 support ticket");
  }

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
  console.log("   Globex admin   admin@globex.dev      (approval-queue org)");
  console.log("   Globex emps    kabir@globex.dev · meera@globex.dev");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
