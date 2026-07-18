"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/fetcher";
import { formatDateTime, humanize, shortId } from "@/lib/utils";

/**
 * Read-only audit trail viewer. Another example of the generic DataTable applied to a second
 * entity — demonstrates the pattern beyond features/_demo without adding domain assumptions.
 */
interface ActivityRow {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
}

const columns: ColumnDef<ActivityRow>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="When" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.original.actorName ?? "System"}</span>
        {row.original.actorEmail && (
          <span className="text-xs text-muted-foreground">{row.original.actorEmail}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => <Badge variant="secondary">{humanize(row.original.action)}</Badge>,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "resource",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Resource" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{humanize(row.original.resource)}</span>
        {row.original.resourceId && (
          <span className="font-mono text-xs text-muted-foreground">{shortId(row.original.resourceId)}</span>
        )}
      </div>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "ip",
    header: "IP",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.ip ?? "—"}</span>
    ),
  },
];

export function ActivityView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-log", "list"],
    queryFn: () => api.get<ActivityRow[]>("/api/activity-log"),
  });

  const actions = Array.from(new Set((data ?? []).map((r) => r.action)));
  const resources = Array.from(new Set((data ?? []).map((r) => r.resource)));

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      facets={[
        { columnId: "action", title: "Action", options: actions.map((a) => ({ label: humanize(a), value: a })) },
        { columnId: "resource", title: "Resource", options: resources.map((r) => ({ label: humanize(r), value: r })) },
      ]}
      emptyTitle="No activity yet"
      emptyDescription="Actions across the app are recorded here as they happen."
      pageSize={20}
    />
  );
}
