"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import { CoAvatar, coInitials, CoEyebrow } from "@/components/co/ui";
import { OrgRowActions, type OrgRow } from "@/features/organization/org-columns";
import { CreateOrgDialog } from "@/features/organization/org-form";
import { InviteAdminDialog } from "@/features/organization/invite-admin-dialog";

interface OrgTableProps {
  initialRows: OrgRow[];
}

/**
 * Coride organizations table — clean tenant list with inline invite/delete actions.
 * Data source is the server-rendered rows; all mutations (create / invite / delete) are preserved,
 * refreshing via router.refresh() on success.
 */
export function OrgTable({ initialRows }: OrgTableProps) {
  const router = useRouter();
  const [inviteOrg, setInviteOrg] = useState<OrgRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleInvite = useCallback((org: OrgRow) => {
    setInviteOrg(org);
    setInviteOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this organization? This is irreversible.")) return;
      await fetch(`/api/organization/${id}`, { method: "DELETE" });
      router.refresh();
    },
    [router],
  );

  const handleMutation = useCallback(() => {
    router.refresh();
  }, [router]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialRows;
    return initialRows.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.allowedEmailDomains ?? []).some((d) => d.toLowerCase().includes(q)),
    );
  }, [initialRows, query]);

  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[color:var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-[280px] sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-3)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations…"
            className="h-10 w-full rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] pl-9 pr-3 text-[14px] text-[color:var(--ink)] placeholder:text-[color:var(--ink-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
          />
        </div>
        <CreateOrgDialog onSuccess={handleMutation} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink-2)]">
            <Building2 className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </span>
          <div className="font-display text-[16px] font-semibold text-[color:var(--ink)]">
            {query ? "No matching organizations" : "No organizations yet"}
          </div>
          <p className="m-0 max-w-[320px] text-[13px] text-[color:var(--ink-3)]">
            {query
              ? "Try a different name or email domain."
              : "Create the first tenant with “New organization” above."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[color:var(--line)]">
                <Th className="pl-5">Organization</Th>
                <Th>Currency</Th>
                <Th>Onboarding</Th>
                <Th className="text-right">Members</Th>
                <Th className="pr-5 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((org) => {
                const domains = org.allowedEmailDomains ?? [];
                return (
                  <tr
                    key={org.id}
                    className="border-b border-[color:var(--line)] transition-colors last:border-b-0 hover:bg-[color:var(--surface-2)]"
                  >
                    {/* Organization */}
                    <td className="py-3.5 pl-5 pr-3 align-middle">
                      <div className="flex items-center gap-3">
                        <CoAvatar initials={coInitials(org.name)} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-[color:var(--ink)]">
                            {org.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {domains.length === 0 ? (
                              <span className="font-mono text-[12px] text-[color:var(--ink-3)]">—</span>
                            ) : (
                              <>
                                {domains.slice(0, 2).map((d) => (
                                  <span
                                    key={d}
                                    className="font-mono text-[12px] text-[color:var(--ink-2)]"
                                  >
                                    @{d}
                                  </span>
                                ))}
                                {domains.length > 2 && (
                                  <span className="font-mono text-[12px] text-[color:var(--ink-3)]">
                                    +{domains.length - 2}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Currency */}
                    <td className="py-3.5 pr-3 align-middle">
                      <span className="font-mono text-[13px] text-[color:var(--ink-2)]">
                        {org.currency}
                      </span>
                    </td>

                    {/* Onboarding */}
                    <td className="py-3.5 pr-3 align-middle">
                      {org.autoApproveDomain ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[color:var(--ok-tint)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--ok)]">
                          Auto-approve
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[color:var(--line-2)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--ink-3)]">
                          Approval queue
                        </span>
                      )}
                    </td>

                    {/* Members */}
                    <td className="py-3.5 pr-3 text-right align-middle">
                      <span className="font-mono text-[14px] font-semibold text-[color:var(--ink)]">
                        {org.userCount ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-5 align-middle">
                      <OrgRowActions org={org} onInvite={handleInvite} onDelete={handleDelete} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InviteAdminDialog
        org={inviteOrg}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={handleMutation}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 ${className}`}>
      <CoEyebrow>{children}</CoEyebrow>
    </th>
  );
}
