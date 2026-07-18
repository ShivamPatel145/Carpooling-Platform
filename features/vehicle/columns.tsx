"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Car } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import { StatusBadge } from "@/components/states";
import { formatDate } from "@/lib/utils";
import type { Vehicle } from "@/features/vehicle/schema";
import { VehicleRowActions } from "@/features/vehicle/components/row-actions";

/**
 * DataTable column defs for vehicle. Registration is the mono/tabular face (design-standards §3).
 * Status uses StatusBadge (approved/inactive map in STATUS_VARIANTS). The employee owns these rows;
 * the API re-checks ownership, so the row menu is convenience, not authorization.
 */
export const vehicleColumns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: "model",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Model" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="font-medium">{row.original.model}</span>
      </div>
    ),
  },
  {
    accessorKey: "registrationNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registration" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs uppercase tracking-wide">{row.original.registrationNo}</span>
    ),
  },
  {
    accessorKey: "seatingCapacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Seats" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.seatingCapacity}</span>
    ),
  },
  {
    accessorKey: "approvalStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.approvalStatus} />,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <VehicleRowActions vehicle={row.original} />,
  },
];
