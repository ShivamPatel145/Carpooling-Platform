"use client";

import { DataTable } from "@/components/data-table";
import { savedPlaceColumns } from "@/features/saved-place/columns";
import { useSavedPlaces } from "@/features/saved-place/hooks";
import { CreateSavedPlaceDialog } from "@/features/saved-place/components/create-dialog";

/** Saved Places list — generic <DataTable> (search + pagination + five states) over the user's own
 *  places. Row actions (edit/delete) live in the column def. */
export function SavedPlacesList() {
  const { data, isLoading, isError, refetch } = useSavedPlaces();

  return (
    <DataTable
      columns={savedPlaceColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="label"
      searchPlaceholder="Search places…"
      emptyTitle="No saved places yet"
      emptyDescription="Save Home, Office, or frequent spots to autofill them on Find and Offer."
      emptyAction={<CreateSavedPlaceDialog label="Add your first place" />}
      pageSize={10}
    />
  );
}
