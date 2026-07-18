import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Settings" };

/** Stub — Slice C builds settings CRUD build-day, on the systemSetting table. */
export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="System-wide configuration." />
      <ComingSoon
        icon={Settings}
        slice="Slice C · Admin"
        builtOn="the systemSetting key/value table and the generic form primitives"
      />
    </div>
  );
}
