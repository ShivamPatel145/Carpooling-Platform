import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { TripsList } from "@/features/trip/components/trips-list";
import { ActiveRideCard } from "@/features/trip/components/active-ride-card";

export const metadata: Metadata = { title: "My Trips" };

/**
 * My Trips (PRD §7.5). Server component: gates read at the page (redirects a role that can't read);
 * the API enforces the same permission again. The ActiveRideCard surfaces the one in-flight trip with
 * its stage-appropriate actions (start / track / complete / pay); the list below serves both views.
 */
export default async function TripsPage() {
  await requirePermissionPage("trip", "read");

  return (
    <div className="space-y-6">
      <ActiveRideCard />
      <TripsList />
    </div>
  );
}
