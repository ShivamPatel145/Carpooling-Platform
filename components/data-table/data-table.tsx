"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { TableSkeleton } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";

/**
 * GENERIC DATATABLE — parameterized by entity. Search + column filters + pagination come free
 * (generic-crud skill rule #1: never hand-roll a list screen). Client-side by default; a slice
 * with large data passes server-driven pagination via the `manualPagination` escape hatch.
 *
 * Renders the FIVE states: loading skeleton, error, empty, and the data itself. Success toasts
 * live in the mutation hooks.
 */
export interface FacetFilter {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** column id to wire the search box to (client-side contains filter) */
  searchColumn?: string;
  searchPlaceholder?: string;
  /** faceted (multi-select) filters rendered as popovers */
  facets?: FacetFilter[];
  /** empty-state customization */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** initial page size */
  pageSize?: number;
  /** optional row click */
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  searchColumn,
  searchPlaceholder = "Search…",
  facets,
  emptyTitle = "Nothing here yet",
  emptyDescription = "When records are added, they'll show up here.",
  emptyAction,
  pageSize = 10,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <TableSkeleton rows={pageSize} cols={columns.length} />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  const hasData = (data?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar: search + faceted filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchColumn && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
              className="pl-8"
              aria-label="Search"
            />
          </div>
        )}
        {facets && facets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {facets.map((facet) => {
              const column = table.getColumn(facet.columnId);
              if (!column) return null;
              return (
                <DataTableFacetedFilter
                  key={facet.columnId}
                  column={column}
                  title={facet.title}
                  options={facet.options}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {!hasData ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results match your filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasData && <DataTablePagination table={table} />}
    </div>
  );
}
