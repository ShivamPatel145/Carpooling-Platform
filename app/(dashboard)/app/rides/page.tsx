import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { MyRidesView } from "@/features/ride/components/my-rides-view";

export const metadata: Metadata = { title: "My Rides" };

/**
 * My Rides — the mode-switcher's history: rides I offer (driver) + seats I booked (passenger).
 * Gates ride:read; the my/booking APIs are owner-scoped. Title/subtitle live in the shell topbar,
 * and Find/Offer are one tap away in the sidebar.
 */
export default async function MyRidesPage() {
  await requirePermissionPage("ride", "read");
  return <MyRidesView />;
}
