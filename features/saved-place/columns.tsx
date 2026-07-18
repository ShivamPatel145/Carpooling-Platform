"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import type { SavedPlace } from "@/features/saved-place/schema";
import { SavedPlaceRowActions } from "@/features/saved-place/components/row-actions";

export const savedPlaceColumns: ColumnDef<SavedPlace>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden />
        {row.original.label}
      </div>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.address || "—"}</span>
    ),
  },
  {
    id: "coords",
    header: "Coordinates",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {Number(row.original.lat).toFixed(4)}, {Number(row.original.lng).toFixed(4)}
      </span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <SavedPlaceRowActions place={row.original} />,
  },
];
