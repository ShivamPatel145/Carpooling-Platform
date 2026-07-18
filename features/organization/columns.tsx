"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Organization } from "@/db/schema/organization";

export type OrgRow = Pick<
  Organization,
  "id" | "name" | "currency" | "autoApproveDomain" | "allowedEmailDomains" | "createdAt"
> & { userCount?: number };

interface OrgActionsProps {
  org: OrgRow;
  onInvite: (org: OrgRow) => void;
  onDelete: (id: string) => void;
}

function OrgActions({ org, onInvite, onDelete }: OrgActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onInvite(org)}>
          <Mail className="mr-2 h-4 w-4" />
          Invite Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(org.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Org
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getOrgColumns(
  onInvite: (org: OrgRow) => void,
  onDelete: (id: string) => void,
): ColumnDef<OrgRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "allowedEmailDomains",
      header: "Email Domains",
      cell: ({ row }) => {
        const domains = row.getValue("allowedEmailDomains") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {domains.length === 0 ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              domains.slice(0, 2).map((d) => (
                <Badge key={d} variant="secondary" className="text-xs font-mono">
                  @{d}
                </Badge>
              ))
            )}
            {domains.length > 2 && (
              <Badge variant="outline" className="text-xs">+{domains.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "autoApproveDomain",
      header: "Onboarding",
      cell: ({ row }) =>
        row.getValue("autoApproveDomain") ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Auto-approve</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Approval queue</Badge>
        ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("currency")}</span>
      ),
    },
    {
      accessorKey: "userCount",
      header: "Members",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.getValue("userCount") ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <OrgActions org={row.original} onInvite={onInvite} onDelete={onDelete} />
      ),
    },
  ];
}
