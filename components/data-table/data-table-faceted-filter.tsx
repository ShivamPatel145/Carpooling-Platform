"use client";

import type { Column } from "@tanstack/react-table";
import { Check, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Multi-select column filter as a popover, matching shadcn's data-table facet. Used for status,
 * priority, and any enum column in the generic DataTable.
 */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: {
  column: Column<TData, TValue>;
  title: string;
  options: { label: string; value: string }[];
}) {
  const selected = new Set((column.getFilterValue() as string[]) ?? []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <PlusCircle className="h-4 w-4" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="max-h-64 overflow-auto">
          {options.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const next = new Set(selected);
                  if (isSelected) next.delete(option.value);
                  else next.add(option.value);
                  const arr = Array.from(next);
                  column.setFilterValue(arr.length ? arr : undefined);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-secondary"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected ? "bg-accent text-accent-foreground" : "opacity-50",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
        {selected.size > 0 && (
          <>
            <Separator className="my-1" />
            <button
              type="button"
              onClick={() => column.setFilterValue(undefined)}
              className="w-full rounded-sm px-2 py-1.5 text-center text-sm text-muted-foreground hover:bg-secondary"
            >
              Clear filters
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
