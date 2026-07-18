import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { Car, Route, TicketCheck, Bell, CheckCircle2, Users } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { vehicle, ride, booking, notification, user } from "@/db/schema";
import { atLeast } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Dashboard" };

/** Server component — computes REAL, scoped counts (design-standards §1: no fabricated stats). */
export default async function DashboardPage() {
  const session = await requireSession();
  const { id: userId, orgId, role, name } = session.user;

  // Real, scoped counts. Parallelized.
  const [myVehicles, myRides, myBookings, unread, pendingApprovals, totalUsers] = await Promise.all([
    db.select({ n: count() }).from(vehicle).where(eq(vehicle.ownerId, userId)),
    db.select({ n: count() }).from(ride).where(eq(ride.driverId, userId)),
    db.select({ n: count() }).from(booking).where(eq(booking.passengerId, userId)),
    db
      .select({ n: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, false))),
    atLeast(role, "company_admin")
      ? db.select({ n: count() }).from(vehicle).where(eq(vehicle.approvalStatus, "inactive"))
      : Promise.resolve([{ n: 0 }]),
    atLeast(role, "company_admin")
      ? db.select({ n: count() }).from(user)
      : Promise.resolve([{ n: 0 }]),
  ]);

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Ride together, save together — here's your commute at a glance."
      />

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevealItem>
          <StatCard label="My vehicles" value={myVehicles[0]?.n ?? 0} icon={Car} hint="Cars you can drive" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Rides offered" value={myRides[0]?.n ?? 0} icon={Route} hint="As a driver" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Seats booked" value={myBookings[0]?.n ?? 0} icon={TicketCheck} hint="As a passenger" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Unread" value={unread[0]?.n ?? 0} icon={Bell} hint="Notifications" />
        </RevealItem>
        {atLeast(role, "company_admin") && (
          <RevealItem>
            <StatCard
              label="Vehicles to approve"
              value={pendingApprovals[0]?.n ?? 0}
              icon={CheckCircle2}
              hint="Awaiting review"
            />
          </RevealItem>
        )}
        {atLeast(role, "company_admin") && (
          <RevealItem>
            <StatCard label="Total users" value={totalUsers[0]?.n ?? 0} icon={Users} hint="On the platform" />
          </RevealItem>
        )}
      </Reveal>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get moving</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Find a colleague heading your way, or offer a seat on your own commute and share the
              cost.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/app/find">Find a ride</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/app/offer">Offer a ride</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your role</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              You're signed in as{" "}
              <span className="font-medium text-foreground">{role}</span>. The sidebar shows only
              what your role can access — authorization is enforced again on every API route, not
              just hidden in the nav.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
