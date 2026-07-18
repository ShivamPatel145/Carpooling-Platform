"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, XCircle, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";

export interface VehicleAdminRow {
  id: string;
  model: string;
  registrationNo: string;
  seatingCapacity: number;
  approvalStatus: "approved" | "inactive";
  ownerId: string;
  ownerName: string;
  createdAt: Date;
}

function VehicleActions({ vehicle, onRefresh }: { vehicle: VehicleAdminRow; onRefresh: () => void }) {
  async function setStatus(status: "approved" | "inactive") {
    await fetch(`/api/vehicle/admin/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus: status }),
    });
    onRefresh();
  }

  return (
    <div className="flex gap-2">
      {vehicle.approvalStatus === "inactive" ? (
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
          onClick={() => setStatus("approved")}
          id={`approve-vehicle-${vehicle.id}`}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Approve
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
          onClick={() => setStatus("inactive")}
          id={`deactivate-vehicle-${vehicle.id}`}
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" />
          Deactivate
        </Button>
      )}
    </div>
  );
}

function VehicleTable({ rows }: { rows: VehicleAdminRow[] }) {
  const router = useRouter();

  const columns: ColumnDef<VehicleAdminRow>[] = [
    {
      accessorKey: "model",
      header: "Vehicle",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("model")}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.original.registrationNo}</div>
        </div>
      ),
    },
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("ownerName")}</span>
      ),
    },
    {
      accessorKey: "seatingCapacity",
      header: "Seats",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.getValue("seatingCapacity")}</span>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) =>
        row.getValue("approvalStatus") === "approved" ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
            Inactive
          </Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <VehicleActions vehicle={row.original} onRefresh={() => router.refresh()} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchColumn="model"
      searchPlaceholder="Search vehicles…"
      facets={[
        {
          columnId: "approvalStatus",
          title: "Status",
          options: [
            { label: "Approved", value: "approved" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      ]}
      emptyTitle="No vehicles registered"
      emptyDescription="Employees can register their vehicles from the app, or you can register on their behalf."
    />
  );
}

export function VehicleAdminTable({ rows }: { rows: VehicleAdminRow[] }) {
  return <VehicleTable rows={rows} />;
}
