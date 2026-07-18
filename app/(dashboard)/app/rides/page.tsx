import type { Metadata } from "next";
import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MyRidesView } from "@/features/ride/components/my-rides-view";

export const metadata: Metadata = { title: "My Rides" };

/**
 * My Rides — the mode-switcher's history: rides I offer (driver) + seats I booked (passenger).
 * Gates ride:read; the my/booking APIs are owner-scoped.
 */
export default async function MyRidesPage() {
  await requirePermissionPage("ride", "read");

  return (
    <div>
      <PageHeader
        title="My rides"
        description="Everything you're driving and everything you've booked, in one place."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/app/find">Find a ride</Link>
            </Button>
            <Button asChild>
              <Link href="/app/offer">Offer a ride</Link>
            </Button>
          </div>
        }
      />
      <MyRidesView />
    </div>
  );
}
