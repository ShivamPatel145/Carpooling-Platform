"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Clickable, sortable column header. Use in column defs: `header: ({column}) => <DataTableColumnHeader column={column} title="Name" />`. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort()) {
    return <span className={cn("text-xs font-medium uppercase tracking-wide", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium uppercase tracking-wide hover:text-foreground",
        className,
      )}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}
