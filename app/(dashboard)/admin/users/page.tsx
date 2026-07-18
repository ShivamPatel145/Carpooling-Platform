import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Users" };

/** Stub — Slice C builds user management + role assignment build-day. Gated by the admin layout. */
export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader title="Users" description="Manage accounts and assign roles." />
      <ComingSoon
        icon={Users}
        slice="Slice C · Admin"
        builtOn="the user table, the RBAC statement in lib/permissions.ts, and the generic DataTable"
      />
    </div>
  );
}
