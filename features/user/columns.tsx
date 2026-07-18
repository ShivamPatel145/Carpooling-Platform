"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, ShieldOff, CheckCircle, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/states/status-badge";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/db/schema/user";

export type UserRow = Pick<
  User,
  "id" | "name" | "email" | "role" | "status" | "platformAccess" | "department" | "createdAt"
>;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Actions</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
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
            Revoke Platform Access
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => patch({ platformAccess: "active" })}>
            <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
            Grant Platform Access
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name") ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.getValue("role") === "company_admin" ? "default" : "secondary"} className="capitalize text-xs">
        {(row.getValue("role") as string).replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("department") ?? "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "platformAccess",
    header: "Access",
    cell: ({ row }) =>
      row.getValue("platformAccess") === "revoked" ? (
        <Badge variant="destructive" className="text-xs">Revoked</Badge>
      ) : (
        <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];
