"use client";

import { Car } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { vehicleColumns } from "@/features/vehicle/columns";
import { vehicleApprovalOptions } from "@/features/vehicle/schema";
import { useMyVehicles } from "@/features/vehicle/hooks";
import { CreateVehicleDialog } from "@/features/vehicle/components/create-dialog";

/**
 * The employee's own-vehicles list — a thin wrapper over the generic <DataTable>. Search by model +
 * status facet + pagination come free. Renders all five states via DataTable.
 */
export function VehicleList() {
  const { data, isLoading, isError, refetch } = useMyVehicles();

  return (
    <DataTable
      columns={vehicleColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="model"
      searchPlaceholder="Search your vehicles…"
      facets={[{ columnId: "approvalStatus", title: "Status", options: vehicleApprovalOptions }]}
      emptyTitle="No vehicles yet"
      emptyDescription="Register your car to start offering rides to colleagues on your route."
      emptyAction={<CreateVehicleDialog label="Register your first vehicle" />}
      pageSize={10}
    />
  );
}
