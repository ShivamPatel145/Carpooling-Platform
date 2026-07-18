"use client";

import { Mail, Trash2 } from "lucide-react";
import { coGhostBtn } from "@/components/co/ui";
import type { Organization } from "@/db/schema/organization";

export type OrgRow = Pick<
  Organization,
  "id" | "name" | "currency" | "autoApproveDomain" | "allowedEmailDomains" | "createdAt"
> & { userCount?: number };

/**
 * Coride row actions for an organization — invite a company admin, or delete the tenant.
 * Presentation only; the handlers (mutations) are owned by the table wrapper.
 */
export function OrgRowActions({
  org,
  onInvite,
  onDelete,
}: {
  org: OrgRow;
  onInvite: (org: OrgRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onInvite(org)}
        className={`${coGhostBtn} h-8 gap-1.5 px-3 text-[12.5px]`}
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
        Invite admin
      </button>
      <button
        type="button"
        onClick={() => onDelete(org.id)}
        aria-label={`Delete ${org.name}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface)] text-[color:var(--ink-3)] transition hover:border-[color:var(--ink)] hover:text-[color:var(--ink)] active:scale-[.98]"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
