import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { OfferRideForm } from "@/features/ride/components/offer-form";

export const metadata: Metadata = { title: "Offer a Ride" };

/**
 * Offer-a-ride screen (driver mode). Gates ride:create at the page; the API re-checks it and that
 * the chosen vehicle is the caller's and approved.
 */
export default async function OfferPage() {
  await requirePermissionPage("ride", "create");

  return (
    <div>
      <PageHeader
        title="Offer a ride"
        description="Publish your commute and share the ride — and the cost — with colleagues heading your way."
      />
      <OfferRideForm />
    </div>
  );
}
