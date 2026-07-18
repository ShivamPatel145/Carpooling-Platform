import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="My Trips"
        description="Rides you're driving or riding. Start, track, chat, and complete them here."
      />
      <TripsList />
    </div>
  );
}
