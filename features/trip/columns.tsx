"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Car, User } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import { StatusBadge } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { TripView } from "@/features/trip/schema";

/**
 * DataTable columns for My Trips (generic-crud rule #1 — never hand-roll a list). A single table
 * serves BOTH views (driver + passenger) via the Role column + its faceted filter; IDs/figures use
 * the mono/tabular face (design-standards §3). Row click → trip detail.
 */
export const tripColumns: ColumnDef<TripView>[] = [
  {
    id: "route",
    accessorFn: (t) => `${t.origin.label} ${t.destination.label}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Route" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-medium">
        <span>{row.original.origin.label}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span>{row.original.destination.label}</span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const driver = row.original.role === "driver";
      return (
        <Badge variant={driver ? "accent" : "secondary"} className="gap-1">
          {driver ? <Car className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {driver ? "Driving" : "Riding"}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "with",
    accessorFn: (t) => t.counterparty?.name ?? "—",
    header: "With",
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm">{row.original.counterparty?.name ?? "—"}</span>,
  },
  {
    accessorKey: "departAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Departs" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDateTime(row.original.departAt)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "farePerSeat",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fare" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-sm">₹{row.original.farePerSeat}</span>
    ),
  },
];
