import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import {
  PiggyBank,
  Route as RouteIcon,
  Leaf,
  Wallet,
  Search,
  PlusCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { booking, ride, trip, walletEntry, payment, user } from "@/db/schema";
import type { GeoPoint } from "@/db/schema/ride";
import { coCard, coAmberBtn } from "@/components/co/ui";

export const metadata: Metadata = { title: "Dashboard" };

const inr = (n: number) => Math.round(n).toLocaleString("en-IN");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Estimation constants for the rider-benefit figures. Both are transparent multipliers applied to
 * REAL trip distances (design-standards §1: compute from real data, never hardcode a headline stat):
 *   SOLO_RATE — what a single-occupancy car/cab would cost per km (fuel + wear), so
 *               saved = soloCost − fareShared.
 *   CO2_PER_KM — a standard petrol-car tailpipe factor (~120 g/km), so CO2 avoided = distance × it.
 */
const SOLO_RATE_PER_KM = 12; // ₹/km
const CO2_PER_KM = 0.12; // kg/km

/** Crow-flies distance fallback when a ride has no cached OSRM distanceKm. */
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

type Tone = "positive" | "negative" | "neutral";

/** Month-over-month percentage delta as display text + a tone for colour. */
function pctDelta(current: number, previous: number): { text: string; tone: Tone } {
  if (previous <= 0) {
    return current > 0 ? { text: "New this month", tone: "positive" } : { text: "This month", tone: "neutral" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "Same as last", tone: "neutral" };
  return { text: `${pct > 0 ? "+" : ""}${pct}% vs last`, tone: pct > 0 ? "positive" : "negative" };
}

/**
 * Employee home — the mode-switcher hub (PRD §7.16 / §11), matched to the Coride comp. Every figure
 * here is real and org-/owner-scoped (design-standards §1: no fabricated stats): savings & CO₂ are
 * computed from the distances of the user's completed rides, the trend is those savings bucketed by
 * month, and the two primary CTAs are the whole loop — OFFER a ride (driver) and FIND one (passenger).
 */
export default async function EmployeeHomePage() {
  const session = await requireSession();
  const { id: userId, orgId, name } = session.user;
  const oid = orgId!;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 6 * 864e5);
  weekAgo.setHours(0, 0, 0, 0);
  // First day of the month five months back → six monthly buckets, current one last.
  const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const LIVE_TRIP = ["started", "in_progress"] as const;
  const DONE_TRIP = ["completed", "payment_pending", "payment_completed"] as const;

  const [
    ridesOffered,
    seatsBooked,
    completed,
    upcoming,
    walletRow,
    pendingPayRow,
    activeAsPassenger,
    activeAsDriver,
    completedBookingRows,
    driverTripRows,
    recentRides,
    recentBookings,
  ] = await Promise.all([
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
      .select({ n: count() })
      .from(payment)
      .where(and(eq(payment.orgId, oid), eq(payment.payerId, userId), eq(payment.status, "pending"))),
    // Active trip where you're the RIDER — counterpart is the driver.
    db
      .select({
        tripId: trip.id,
        etaMin: trip.etaMin,
        origin: ride.origin,
        destination: ride.destination,
        counterpart: user.name,
      })
      .from(booking)
      .innerJoin(trip, eq(trip.rideId, booking.rideId))
      .innerJoin(ride, eq(ride.id, booking.rideId))
      .innerJoin(user, eq(user.id, ride.driverId))
      .where(
        and(
          eq(booking.orgId, oid),
          eq(booking.passengerId, userId),
          eq(booking.status, "confirmed"),
          inArray(trip.status, [...LIVE_TRIP]),
        ),
      )
      .limit(1),
    // Active trip where you're the DRIVER.
    db
      .select({ tripId: trip.id, etaMin: trip.etaMin, origin: ride.origin, destination: ride.destination })
      .from(trip)
      .innerJoin(ride, eq(ride.id, trip.rideId))
      .where(and(eq(trip.orgId, oid), eq(ride.driverId, userId), inArray(trip.status, [...LIVE_TRIP])))
      .limit(1),
    // Completed rides you took (passenger) in the trend window → savings, CO₂, trip counts.
    db
      .select({
        departAt: ride.departAt,
        distanceKm: ride.distanceKm,
        origin: ride.origin,
        destination: ride.destination,
        fareAmount: booking.fareAmount,
      })
      .from(booking)
      .innerJoin(ride, eq(ride.id, booking.rideId))
      .where(
        and(
          eq(booking.orgId, oid),
          eq(booking.passengerId, userId),
          eq(booking.status, "completed"),
          gte(ride.departAt, sixStart),
        ),
      ),
    // Completed trips you drove in the window → added to the monthly trip count.
    db
      .select({ completedAt: trip.completedAt })
      .from(trip)
      .innerJoin(ride, eq(ride.id, trip.rideId))
      .where(
        and(
          eq(trip.orgId, oid),
          eq(ride.driverId, userId),
          inArray(trip.status, [...DONE_TRIP]),
          gte(trip.completedAt, sixStart),
        ),
      ),
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
  const ridesN = ridesOffered[0]?.n ?? 0;
  const seatsN = seatsBooked[0]?.n ?? 0;
  const completedN = completed[0]?.n ?? 0;
  const upcomingN = upcoming[0]?.n ?? 0;
  const pendingN = pendingPayRow[0]?.n ?? 0;
  const balance = Number(walletRow[0]?.balance ?? 0);

  const activeP = activeAsPassenger[0];
  const activeD = activeAsDriver[0];
  const active = activeP
    ? { ...activeP, counterpart: activeP.counterpart }
    : activeD
      ? { ...activeD, counterpart: null as string | null }
      : null;

  // ── Monthly buckets: saved (₹), CO₂ (kg), trips ───────────────────────────────────────────────
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), key: monthKey(d), saved: 0, co2: 0, trips: 0 };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const r of completedBookingRows) {
    const b = byKey.get(monthKey(new Date(r.departAt)));
    if (!b) continue;
    const dist = r.distanceKm != null ? Number(r.distanceKm) : haversineKm(r.origin, r.destination);
    const fare = Number(r.fareAmount ?? 0);
    b.saved += Math.max(0, dist * SOLO_RATE_PER_KM - fare);
    b.co2 += dist * CO2_PER_KM;
    b.trips += 1;
  }
  for (const t of driverTripRows) {
    if (!t.completedAt) continue;
    const b = byKey.get(monthKey(new Date(t.completedAt)));
    if (b) b.trips += 1;
  }

  const cur = buckets[5]!;
  const prev = buckets[4]!;
  const savedNow = Math.round(cur.saved);
  const co2Now = Math.round(cur.co2);
  const tripsNow = cur.trips;
  const tripsDelta = tripsNow - prev.trips;
  const tripsSub =
    tripsDelta > 0 ? `+${tripsDelta} trips` : tripsDelta < 0 ? `${tripsDelta} trips` : "This month";

  const kpis: { label: string; value: string; unit?: string; sub: string; tone: Tone; Icon: LucideIcon }[] = [
    { label: "Saved this month", value: `₹${inr(savedNow)}`, ...deltaKpi(pctDelta(cur.saved, prev.saved)), Icon: PiggyBank },
    { label: "Trips this month", value: String(tripsNow), sub: tripsSub, tone: tripsDelta > 0 ? "positive" : "neutral", Icon: RouteIcon },
    { label: "CO₂ avoided", value: String(co2Now), unit: "kg", ...deltaKpi(pctDelta(cur.co2, prev.co2)), Icon: Leaf },
    {
      label: "Wallet balance",
      value: `₹${inr(balance)}`,
      sub: pendingN > 0 ? `${pendingN} pending` : "Ready to spend",
      tone: "neutral",
      Icon: Wallet,
    },
  ];

  // ── Savings-trend area chart (SVG, no lib — matches the comp's viewBox) ────────────────────────
  const W = 300;
  const H = 120;
  const PAD = 12;
  const trendMax = Math.max(1, ...buckets.map((b) => b.saved));
  const px = (i: number) => (i / (buckets.length - 1)) * W;
  const py = (v: number) => H - PAD - (v / trendMax) * (H - 2 * PAD);
  const points = buckets.map((b, i) => `${px(i).toFixed(1)},${py(b.saved).toFixed(1)}`);
  const savLine = points.join(" ");
  const savArea = `M0,${H} ${points.map((p) => `L${p}`).join(" ")} L${W},${H} Z`;

  // ── Rides this week (real activity per weekday) ────────────────────────────────────────────────
  const weekCounts = new Array(7).fill(0) as number[];
  const dayIndex = (d: Date) => (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  for (const r of [...recentRides, ...recentBookings]) {
    if (r.at) weekCounts[dayIndex(new Date(r.at))]!++;
  }
  const weekMax = Math.max(1, ...weekCounts);
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);
  const peakDay = weekCounts.indexOf(Math.max(...weekCounts));

  // ── Ride mix donut (driver vs rider) ──────────────────────────────────────────────────────────
  const mixTotal = ridesN + seatsN;
  const driverPct = mixTotal ? Math.round((ridesN / mixTotal) * 100) : 0;
  const CIRC = 2 * Math.PI * 28;
  const donutLen = (driverPct / 100) * CIRC;

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
              {active.counterpart && (
                <span className="text-[color:var(--ink-3)]"> · with {active.counterpart}</span>
              )}
            </div>
          </div>
          {active.etaMin != null && (
            <div className="font-mono text-[14px] text-[color:var(--ink-2)]">
              ETA <span className="font-semibold text-[color:var(--ink)]">{active.etaMin} min</span>
            </div>
          )}
          <Link href={`/app/trips/${active.tripId}/track`} className={`${coAmberBtn} px-[18px] py-2.5 text-[14px]`}>
            Track live
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-[22px] grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, unit, sub, tone, Icon }) => (
          <div key={label} className={cnCard("p-5")}>
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[12.5px] text-[color:var(--ink-3)]">{label}</span>
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </div>
            <div className="mb-1.5 font-mono text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
              {value}
              {unit && <span className="ml-1 text-[13px] font-medium text-[color:var(--ink-3)]">{unit}</span>}
            </div>
            <div
              className="text-[12px]"
              style={{
                color:
                  tone === "positive"
                    ? "var(--ok)"
                    : tone === "negative"
                      ? "var(--destructive)"
                      : "var(--ink-3)",
              }}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts: savings trend · rides this week · ride mix */}
      <div className="mb-[22px] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Savings trend */}
        <div className={cnCard("p-5")}>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">Savings trend</div>
            <div className="font-mono text-[11.5px] text-[color:var(--ink-3)]">₹ / month</div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="128" preserveAspectRatio="none">
            <path d={savArea} fill="var(--amber-tint)" />
            <polyline
              points={savLine}
              fill="none"
              stroke="var(--amber-strong)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-[color:var(--ink-3)]">
            {buckets.map((b) => (
              <span key={b.key}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Rides this week */}
        <div className={cnCard("p-5")}>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-[15px] font-semibold text-[color:var(--ink)]">Rides this week</div>
            <div className="font-mono text-[11.5px] text-[color:var(--ink-3)]">{weekTotal} total</div>
          </div>
          <div className="flex h-[128px] items-end gap-2.5">
            {weekCounts.map((c, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full rounded-[5px]"
                    style={{
                      height: `${Math.max(6, (c / weekMax) * 100)}%`,
                      background:
                        weekTotal > 0 && i === peakDay ? "var(--amber-strong)" : c > 0 ? "var(--ink-3)" : "var(--surface-2)",
                    }}
                  />
                </div>
                <div className="text-[11px] text-[color:var(--ink-2)]">{WEEKDAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ride mix */}
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
        <Tile
          href="/app/rides"
          title="My Trips"
          sub={`${upcomingN} upcoming${pendingN > 0 ? ` · ${pendingN} to pay` : ""}`}
        />
        <Tile href="/wallet" title="Wallet" sub={`Balance ₹${inr(balance)}`} mono />
        <Tile href="/history" title="Ride History" sub={`${completedN} completed trips`} />
      </div>
    </div>
  );
}

/** Spread helper so a KPI entry can take a pctDelta result as {sub, tone}. */
function deltaKpi(d: { text: string; tone: Tone }): { sub: string; tone: Tone } {
  return { sub: d.text, tone: d.tone };
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
