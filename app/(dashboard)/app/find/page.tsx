import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { FindView } from "@/features/ride/components/find-view";

export const metadata: Metadata = { title: "Find a Ride" };

/**
 * Find-a-ride screen (passenger mode). Gates ride:read at the page; the search + booking APIs
 * re-enforce permissions and org scoping.
 */
export default async function FindPage() {
  await requirePermissionPage("ride", "read");

  return (
    <div>
      <PageHeader
        title="Find a ride"
        description="Search colleagues' published rides along your route and book a seat in seconds."
      />
      <FindView />
    </div>
  );
}
