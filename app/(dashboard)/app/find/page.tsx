import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { FindView } from "@/features/ride/components/find-view";

export const metadata: Metadata = { title: "Find a Ride" };

/**
 * Find-a-ride screen (passenger mode). Gates ride:read at the page; the search + booking APIs
 * re-enforce permissions and org scoping. The screen title/subtitle live in the shell topbar.
 */
export default async function FindPage() {
  await requirePermissionPage("ride", "read");
  return <FindView />;
}
