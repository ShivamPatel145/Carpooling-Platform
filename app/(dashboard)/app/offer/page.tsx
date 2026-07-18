import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { OfferRideForm } from "@/features/ride/components/offer-form";

export const metadata: Metadata = { title: "Offer a Ride" };

/**
 * Offer-a-ride screen (driver mode). Gates ride:create at the page; the API re-checks it and that
 * the chosen vehicle is the caller's and approved. Title/subtitle live in the shell topbar.
 */
export default async function OfferPage() {
  await requirePermissionPage("ride", "create");
  return <OfferRideForm />;
}
