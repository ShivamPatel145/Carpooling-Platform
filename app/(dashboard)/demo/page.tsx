import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { DemoList } from "@/features/_demo/components/demo-list";
import { CreateDemoEntityDialog } from "@/features/_demo/components/create-dialog";

export const metadata: Metadata = { title: "Demo Entities" };

/**
 * demoEntity list page. Server component: gates read access at the page (redirects if the role
 * can't read), then renders the client list. The API enforces the same permission again.
 */
export default async function DemoPage() {
  await requirePermissionPage("demoEntity", "read");

  return (
    <div>
      <PageHeader
        title="Demo Entities"
        description="The working CRUD template. Copy features/_demo/ to build a real slice."
        action={<CreateDemoEntityDialog />}
      />
      <DemoList />
    </div>
  );
}
