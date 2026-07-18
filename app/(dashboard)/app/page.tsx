import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { Car, Route, TicketCheck, Search, PlusCircle } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { booking, ride, vehicle } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Rides" };

/**
 * Employee home — the mode-switcher hub (PRD §7.16 / §11 demo loop). Real, org- and owner-scoped
 * counts only (design-standards §1: no fabricated stats). The two primary CTAs are the whole loop:
 * OFFER a ride (driver mode) and FIND a ride (passenger mode).
 */
export default async function EmployeeHomePage() {
  const session = await requireSession();
  const { id: userId, orgId, name } = session.user;

  const [myVehicles, myRides, myBookings] = await Promise.all([
    db
      .select({ n: count() })
      .from(vehicle)
      .where(and(eq(vehicle.orgId, orgId!), eq(vehicle.ownerId, userId))),
    db
      .select({ n: count() })
      .from(ride)
      .where(and(eq(ride.orgId, orgId!), eq(ride.driverId, userId))),
    db
      .select({ n: count() })
      .from(booking)
      .where(and(eq(booking.orgId, orgId!), eq(booking.passengerId, userId))),
  ]);

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Hi ${firstName}`}
        description="Ride together, save together. Offer a seat on your commute, or find one going your way."
      />

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RevealItem>
          <StatCard label="My vehicles" value={myVehicles[0]?.n ?? 0} icon={Car} hint="Cars you can drive" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Rides offered" value={myRides[0]?.n ?? 0} icon={Route} hint="As a driver" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Seats booked" value={myBookings[0]?.n ?? 0} icon={TicketCheck} hint="As a passenger" />
        </RevealItem>
      </Reveal>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              Find a ride
            </CardTitle>
            <CardDescription>
              Search colleagues' published rides along your route and book a seat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app/find">Find a ride</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-muted-foreground" />
              Offer a ride
            </CardTitle>
            <CardDescription>
              Driving in? Publish your commute and share the ride (and the cost) with colleagues.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/app/offer">Offer a ride</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/vehicles">Manage vehicles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
