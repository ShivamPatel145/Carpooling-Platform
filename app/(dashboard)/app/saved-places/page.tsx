import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { SavedPlacesList } from "@/features/saved-place/components/saved-places-list";
import { CreateSavedPlaceDialog } from "@/features/saved-place/components/create-dialog";

export const metadata: Metadata = { title: "Saved Places" };

export default async function SavedPlacesPage() {
  await requirePermissionPage("savedPlace", "read");

  return (
    <div>
      <PageHeader
        title="Saved Places"
        description="Home, Office, and frequent spots — reused to autofill Find and Offer."
        action={<CreateSavedPlaceDialog />}
      />
      <SavedPlacesList />
    </div>
  );
}
