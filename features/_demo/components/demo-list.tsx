"use client";

import { Boxes } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { demoColumns } from "@/features/_demo/columns";
import { demoStatusOptions } from "@/features/_demo/schema";
import { useDemoEntities } from "@/features/_demo/hooks";
import { CreateDemoEntityDialog } from "@/features/_demo/components/create-dialog";

/**
 * The demoEntity list screen — a thin wrapper over the generic <DataTable>. Search + status facet
 * + pagination come free (generic-crud rule #1). Renders all five states via DataTable.
 */
export function DemoList() {
  const { data, isLoading, isError, refetch } = useDemoEntities();

  return (
    <DataTable
      columns={demoColumns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      searchColumn="name"
      searchPlaceholder="Search by name…"
      facets={[{ columnId: "status", title: "Status", options: demoStatusOptions }]}
      emptyTitle="No items yet"
      emptyDescription="Create your first demo entity to see the full CRUD pattern in action."
      emptyAction={<CreateDemoEntityDialog label="Create the first item" />}
      pageSize={10}
    />
  );
}
