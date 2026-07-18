"use client";

import { useRideHistory, type HistoryEntry } from "@/features/history/hooks";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { StatusBadge } from "@/components/states";
import { DataTableColumnHeader } from "@/components/data-table";

const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: "trip.startedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const date = row.original.trip.startedAt;
      return date ? format(new Date(date), "MMM d, yyyy") : "N/A";
    },
  },
  {
    id: "route",
    header: "Route",
    cell: ({ row }) => {
      const origin = row.original.ride.origin.label;
      const dest = row.original.ride.destination.label;
      return <div className="max-w-[200px] truncate">{origin} → {dest}</div>;
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
  },
  {
    id: "driver",
    header: "Driver",
    cell: ({ row }) => row.original.driver.name,
  },
  {
    accessorKey: "trip.status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.trip.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      if (row.original.trip.status !== "payment_completed" && row.original.trip.status !== "completed") return null;
      return (
        <a 
          href={`/api/report/receipt/${row.original.trip.id}`} 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Download Receipt
        </a>
      );
    },
  },
];

export function HistoryList() {
  const { data, isLoading, isError, refetch } = useRideHistory();

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      emptyTitle="No past rides"
      emptyDescription="Your completed trips will appear here."
    />
  );
}
