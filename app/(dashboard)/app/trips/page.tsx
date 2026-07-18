import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { TripsList } from "@/features/trip/components/trips-list";

export const metadata: Metadata = { title: "My Trips" };

/**
 * My Trips (PRD §7.5). Server component: gates read at the page (redirects a role that can't read);
 * the API enforces the same permission again. One list serves both driver and passenger views.
 */
export default async function TripsPage() {
  await requirePermissionPage("trip", "read");

  return (
    <div>
      <TripsList />
    </div>
  );
}
