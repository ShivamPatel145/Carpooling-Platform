import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { TripDetail } from "@/features/trip/components/trip-detail";

export const metadata: Metadata = { title: "Trip" };

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("trip", "read");
  const { id } = await params;
  return <TripDetail id={id} />;
}
