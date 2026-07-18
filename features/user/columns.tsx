"use client";

import type { ReactNode } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, ShieldOff, CheckCircle, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/states";
import { CoAvatar, coInitials, coAmberBtn, coGhostBtn } from "@/components/co/ui";
import type { User } from "@/db/schema/user";

export type UserRow = Pick<
  User,
  "id" | "name" | "email" | "role" | "status" | "platformAccess" | "department" | "createdAt"
> & { ridesCount: number };

/** Coride column header — uppercase micro-label. */
function Th({ children }: { children: ReactNode }) {
  return (
    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-3)]">
      {children}
    </span>
  );
}

function UserActions({ user }: { user: UserRow }) {
  const router = useRouter();

  async function patch(update: Partial<Pick<User, "status" | "platformAccess">>) {
    await fetch(`/api/user/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    router.refresh();
  }

  // Primary contextual access action — mirrors the comp's single "Access" button per row.
  const primary =
    user.status === "pending"
      ? { label: "Approve", tone: "amber" as const, run: () => patch({ status: "active" }) }
      : user.status === "active"
        ? { label: "Deactivate", tone: "ghost" as const, run: () => patch({ status: "inactive" }) }
        : { label: "Activate", tone: "amber" as const, run: () => patch({ status: "active" }) };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={primary.run}
        className={`${primary.tone === "amber" ? coAmberBtn : coGhostBtn} h-9 px-3.5 text-[13px]`}
      >
        {primary.label}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${coGhostBtn} h-9 w-9 p-0`}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === "pending" && (
            <DropdownMenuItem onClick={() => patch({ status: "active" })}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Approve
            </DropdownMenuItem>
          )}
          {user.status === "active" && (
            <DropdownMenuItem onClick={() => patch({ status: "inactive" })}>
              <XCircle className="mr-2 h-4 w-4 text-orange-500" />
              Deactivate
            </DropdownMenuItem>
          )}
          {user.status === "inactive" && (
            <DropdownMenuItem onClick={() => patch({ status: "active" })}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.platformAccess === "active" ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => patch({ platformAccess: "revoked" })}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke platform access
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => patch({ platformAccess: "active" })}>
              <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
              Grant platform access
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: () => <Th>Employee</Th>,
    cell: ({ row }) => {
      const name = (row.getValue("name") as string | null) ?? "—";
      return (
        <div className="flex items-center gap-3">
          <CoAvatar initials={coInitials(name === "—" ? row.original.email : name)} />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-[color:var(--ink)]">{name}</div>
            <div className="truncate font-mono text-[12px] text-[color:var(--ink-3)]">
              {row.original.email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "department",
    header: () => <Th>Department</Th>,
    cell: ({ row }) => (
      <span className="text-[13.5px] text-[color:var(--ink-2)]">
        {(row.getValue("department") as string | null) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "ridesCount",
    header: () => <Th>Rides</Th>,
    cell: ({ row }) => (
      <span className="font-mono text-[14px] text-[color:var(--ink)]">
        {Number(row.getValue("ridesCount") ?? 0)}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: () => <Th>Role</Th>,
    cell: ({ row }) => (
      <span className="text-[13px] capitalize text-[color:var(--ink-2)]">
        {(row.getValue("role") as string).replace("_", " ")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: () => <Th>Status</Th>,
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    header: () => <div className="text-right"><Th>Access</Th></div>,
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];
