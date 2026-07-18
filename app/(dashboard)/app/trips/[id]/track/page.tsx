import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { TrackView } from "@/features/trip/components/track-view";

export const metadata: Metadata = { title: "Live tracking" };

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("trip", "track");
  const { id } = await params;
  return <TrackView id={id} />;
}
