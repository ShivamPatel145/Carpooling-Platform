import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import {
  Wallet,
  Route as RouteIcon,
  TicketCheck,
  CircleCheck,
  Search,
  PlusCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { booking, ride, vehicle, trip, walletEntry } from "@/db/schema";
import type { GeoPoint } from "@/db/schema/ride";
import { coCard, coAmberBtn } from "@/components/co/ui";

export const metadata: Metadata = { title: "Dashboard" };

const inr = (n: number) => n.toLocaleString("en-IN");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Employee home — the mode-switcher hub (PRD §7.16 / §11). Every figure here is real and
 * org-/owner-scoped (design-standards §1: no fabricated stats). The two primary CTAs are the whole
 * loop: OFFER a ride (driver) and FIND a ride (passenger).
 */
export default async function EmployeeHomePage() {
  const session = await requireSession();
  const { id: userId, orgId, name } = session.user;
  const oid = orgId!;
  const weekAgo = new Date(Date.now() - 6 * 864e5);
  weekAgo.setHours(0, 0, 0, 0);

  const [
    myVehicles,
    ridesOffered,
    seatsBooked,
    completed,
    upcoming,
    walletRow,
    activeTripRow,
    recentRides,
    recentBookings,
  ] = await Promise.all([
    db.select({ n: count() }).from(vehicle).where(and(eq(vehicle.orgId, oid), eq(vehicle.ownerId, userId))),
    db.select({ n: count() }).from(ride).where(and(eq(ride.orgId, oid), eq(ride.driverId, userId))),
    db.select({ n: count() }).from(booking).where(and(eq(booking.orgId, oid), eq(booking.passengerId, userId))),
    db
      .select({ n: count() })
      .from(booking)
      .where(and(eq(booking.orgId, oid), eq(booking.passengerId, userId), eq(booking.status, "completed"))),
    db
      .select({ n: count() })
      .from(booking)
      .where(and(eq(booking.orgId, oid), eq(booking.passengerId, userId), eq(booking.status, "confirmed"))),
    db
      .select({ balance: walletEntry.balanceAfter })
      .from(walletEntry)
      .where(and(eq(walletEntry.orgId, oid), eq(walletEntry.userId, userId)))
      .orderBy(desc(walletEntry.createdAt))
      .limit(1),
    db
      .select({ status: trip.status, etaMin: trip.etaMin, origin: ride.origin, destination: ride.destination })
      .from(trip)
      .innerJoin(ride, eq(trip.rideId, ride.id))
      .where(and(eq(trip.orgId, oid), eq(ride.driverId, userId), inArray(trip.status, ["started", "in_progress"])))
      .limit(1),
    db
      .select({ at: ride.createdAt })
      .from(ride)
      .where(and(eq(ride.orgId, oid), eq(ride.driverId, userId), gte(ride.createdAt, weekAgo))),
    db
      .select({ at: booking.createdAt })
      .from(booking)
      .where(and(eq(booking.orgId, oid), eq(booking.passengerId, userId), gte(booking.createdAt, weekAgo))),
  ]);

  const firstName = name?.split(" ")[0] ?? "there";
  const vehiclesN = myVehicles[0]?.n ?? 0;
  const ridesN = ridesOffered[0]?.n ?? 0;
  const seatsN = seatsBooked[0]?.n ?? 0;
  const completedN = completed[0]?.n ?? 0;
  const upcomingN = upcoming[0]?.n ?? 0;
  const balance = Number(walletRow[0]?.balance ?? 0);
  const active = activeTripRow[0];

  // Real driver/rider split for the donut.
  const mixTotal = ridesN + seatsN;
  const driverPct = mixTotal ? Math.round((ridesN / mixTotal) * 100) : 0;
  const CIRC = 2 * Math.PI * 28;
  const donutLen = (driverPct / 100) * CIRC;

  // Real activity per weekday (last 7 days).
  const weekCounts = new Array(7).fill(0) as number[];
  const dayIndex = (d: Date) => (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  for (const r of [...recentRides, ...recentBookings]) {
    if (r.at) weekCounts[dayIndex(new Date(r.at))]!++;
  }
  const weekMax = Math.max(1, ...weekCounts);
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);

  const kpis = [
    { label: "Wallet", value: `₹${inr(balance)}`, sub: "Ready to spend", Icon: Wallet },
    { label: "Rides offered", value: String(ridesN), sub: "As driver", Icon: RouteIcon },
    { label: "Seats booked", value: String(seatsN), sub: "As passenger", Icon: TicketCheck },
    { label: "Completed", value: String(completedN), sub: "Trips finished", Icon: CircleCheck },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(24px,3vw,30px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Hello, {firstName}
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          You&apos;re both a driver and a rider. Offer your seats going home, or find one going in.
        </p>
      </div>

      {/* Active-trip banner (only when a real trip is running) */}
      {active && (
        <div
          className={cnCard(
            "mb-[22px] flex flex-wrap items-center gap-4 border-l-[3px] border-l-[color:var(--amber)] px-5 py-[18px]",
          )}
        >
          <span className="relative h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-[color:var(--amber)]" />
            <span className="co-pulse absolute inset-0 rounded-full bg-[color:var(--amber)]" />
          </span>
          <div className="min-w-[180px] flex-1">
            <div className="mb-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--amber-strong)]">
              Active trip · en route
            </div>
            <div className="font-mono text-[15px] text-[color:var(--ink)]">
              {(active.origin as GeoPoint)?.label} → {(active.destination as GeoPoint)?.label}
            </div>
          </div>
          {active.etaMin != null && (
            <div className="font-mono text-[14px] text-[color:var(--ink-2)]">
              ETA <span className="font-semibold text-[color:var(--ink)]">{active.etaMin} min</span>
            </div>
          )}
          <Link href="/app/rides" className={`${coAmberBtn} px-[18px] py-2.5 text-[14px]`}>
            Track live
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, sub, Icon }) => (
          <div key={label} className={cnCard("p-5")}>
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[12.5px] text-[color:var(--ink-3)]">{label}</span>
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </div>
            <div className="mb-1.5 font-mono text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
              {value}
            </div>
            <div className="text-[12px] text-[color:var(--ink-3)]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Ride mix + this week */}
      <div className="mb-[22px] grid gap-4 lg:grid-cols-2">
        <div className={cnCard("p-5")}>
          <div className="mb-4 font-display text-[15px] font-semibold text-[color:var(--ink)]">Ride mix</div>
          {mixTotal ? (
            <div className="flex items-center gap-[18px]">
              <svg width="92" height="92" viewBox="0 0 72 72" className="shrink-0">
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke="var(--amber-strong)"
                  strokeWidth="10"
                  strokeDasharray={`${donutLen} ${CIRC}`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
                    <span className="h-[9px] w-[9px] rounded-[3px] bg-[color:var(--amber-strong)]" />
                    As driver
                  </div>
                  <div className="ml-[17px] font-mono text-[16px] font-semibold text-[color:var(--ink)]">
                    {driverPct}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
                    <span className="h-[9px] w-[9px] rounded-[3px] bg-[color:var(--ink-3)]" />
                    As rider
                  </div>
                  <div className="ml-[17px] font-mono text-[16px] font-semibold text-[color:var(--ink)]">
                    {100 - driverPct}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-[13px] text-[color:var(--ink-3)]">
              Your driver / rider split appears once you take your first ride.
            </p>
          )}
        </div>

        <div className={cnCard("p-5")}>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">This week</div>
            <div className="font-mono text-[11.5px] text-[color:var(--ink-3)]">{weekTotal} rides</div>
          </div>
          <div className="flex h-[128px] items-end gap-2.5">
            {weekCounts.map((c, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full rounded-[5px]"
                    style={{
                      height: `${Math.max(6, (c / weekMax) * 100)}%`,
                      background: c ? "var(--amber-strong)" : "var(--surface-2)",
                    }}
                  />
                </div>
                <div className="text-[11px] text-[color:var(--ink-2)]">{WEEKDAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="mb-[22px] grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/app/find"
          title="Find a Ride"
          desc="Search matching rides on your route and book a seat."
          cta="Search rides"
          Icon={Search}
        />
        <ActionCard
          href="/app/offer"
          title="Offer a Ride"
          desc="Publish your empty seats and split the fuel cost."
          cta="Publish a ride"
          Icon={PlusCircle}
        />
      </div>

      {/* Secondary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile href="/app/rides" title="My Rides" sub={`${upcomingN} upcoming`} />
        <Tile href="/wallet" title="Wallet" sub={`Balance ₹${inr(balance)}`} mono />
        <Tile href="/history" title="Ride History" sub={`${completedN} completed trips`} />
      </div>
    </div>
  );
}

function cnCard(extra: string) {
  return `${coCard} ${extra}`;
}

function ActionCard({
  href,
  title,
  desc,
  cta,
  Icon,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={`${coCard} group flex min-h-[168px] flex-col gap-3.5 p-6 transition hover:-translate-y-[3px] hover:border-[color:var(--line-2)]`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink)]">
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
      </span>
      <div className="flex-1">
        <div className="mb-1.5 font-display text-[20px] font-semibold text-[color:var(--ink)]">{title}</div>
        <div className="text-[14px] text-[color:var(--ink-2)]">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[13px] text-[color:var(--amber-strong)]">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function Tile({ href, title, sub, mono }: { href: string; title: string; sub: string; mono?: boolean }) {
  return (
    <Link
      href={href}
      className={`${coCard} flex items-center justify-between gap-3 rounded-[14px] px-5 py-[18px] transition hover:-translate-y-[2px] hover:border-[color:var(--line-2)]`}
    >
      <div>
        <div className="mb-0.5 text-[15px] font-semibold text-[color:var(--ink)]">{title}</div>
        <div className={`text-[13px] text-[color:var(--ink-3)] ${mono ? "font-mono" : ""}`}>{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--ink-3)]" />
    </Link>
  );
}
