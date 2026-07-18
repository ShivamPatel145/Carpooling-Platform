"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { getOrgColumns, type OrgRow } from "@/features/organization/org-columns";
import { CreateOrgDialog } from "@/features/organization/org-form";
import { InviteAdminDialog } from "@/features/organization/invite-admin-dialog";

interface OrgTableProps {
  initialRows: OrgRow[];
}

/**
 * Client wrapper for the organizations DataTable.
 * Manages the invite dialog state and handles soft-refresh after mutations.
 */
export function OrgTable({ initialRows }: OrgTableProps) {
  const router = useRouter();
  const [inviteOrg, setInviteOrg] = useState<OrgRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleInvite = useCallback((org: OrgRow) => {
    setInviteOrg(org);
    setInviteOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this organization? This is irreversible.")) return;
    await fetch(`/api/organization/${id}`, { method: "DELETE" });
    router.refresh();
  }, [router]);

  const handleMutation = useCallback(() => {
    router.refresh();
  }, [router]);

  const columns = getOrgColumns(handleInvite, handleDelete);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateOrgDialog onSuccess={handleMutation} />
      </div>

      <DataTable
        columns={columns}
        data={initialRows}
        searchColumn="name"
        searchPlaceholder="Search organizations…"
        facets={[
          {
            columnId: "autoApproveDomain",
            title: "Onboarding",
            options: [
              { label: "Auto-approve", value: "true" },
              { label: "Approval queue", value: "false" },
            ],
          },
        ]}
        emptyTitle="No organizations yet"
        emptyDescription="Create the first tenant to get started."
        emptyAction={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" />
            Click &ldquo;New Organization&rdquo; above
          </div>
        }
      />

      <InviteAdminDialog
        org={inviteOrg}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={handleMutation}
      />
    </div>
  );
}
