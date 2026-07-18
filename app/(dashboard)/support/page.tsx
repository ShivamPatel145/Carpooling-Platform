import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Support" };

/** Stub — Slice D builds the support ticket flow build-day on the supportTicket table. */
export default async function SupportPage() {
  await requirePermissionPage("supportTicket", "read");
  return (
    <div>
      <PageHeader title="Support" description="Raise and track support tickets." />
      <ComingSoon
        icon={LifeBuoy}
        slice="Slice D"
        builtOn="the supportTicket table (open/in-progress/resolved/closed) and the generic CRUD pattern"
      />
    </div>
  );
}
