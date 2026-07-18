"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { tripColumns } from "@/features/trip/columns";
import { tripStatusOptions } from "@/features/trip/schema";
import { useMyTrips } from "@/features/trip/hooks";

const roleOptions = [
  { label: "Driving", value: "driver" },
  { label: "Riding", value: "passenger" },
];

/**
 * My Trips — a thin wrapper over the generic <DataTable> (search by route + Role/Status facets +
 * pagination come free). Renders all five states via DataTable; row click opens the trip.
 */
export function TripsList() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyTrips();

  return (
    <DataTable
      columns={tripColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="route"
      searchPlaceholder="Search by route…"
      facets={[
        { columnId: "role", title: "Role", options: roleOptions },
        { columnId: "status", title: "Status", options: tripStatusOptions },
      ]}
      emptyTitle="No trips yet"
      emptyDescription="When you book a ride — or a colleague books yours — the trip shows up here to track, chat, and complete."
      onRowClick={(t) => router.push(`/app/trips/${t.id}`)}
      pageSize={10}
    />
  );
}
