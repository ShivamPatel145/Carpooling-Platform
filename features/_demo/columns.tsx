"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Pin } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import { StatusBadge } from "@/components/states";
import { formatDate, shortId } from "@/lib/utils";
import type { DemoEntity } from "@/features/_demo/schema";
import { DemoEntityRowActions } from "@/features/_demo/components/row-actions";

/**
 * DataTable column defs for demoEntity. Note: IDs and figures use the mono/tabular face
 * (design-standards §3). The `status` column has an accessor + filterFn so the faceted filter and
 * the DataTable's multi-select work. Copy + adapt for a real entity.
 */
export const demoColumns: ColumnDef<DemoEntity>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.isPinned && <Pin className="h-3.5 w-3.5 text-accent" aria-label="Pinned" />}
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.amount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDate(row.original.dueDate)}</span>
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{shortId(row.original.id)}</span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <DemoEntityRowActions entity={row.original} />,
  },
];
