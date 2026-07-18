import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/session";
import { DemoDetail } from "@/features/_demo/components/demo-detail";

export const metadata: Metadata = { title: "Item detail" };

/** demoEntity detail page. Gates read at the page; the API re-checks + enforces ownership. */
export default async function DemoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("demoEntity", "read");
  const { id } = await params;
  return <DemoDetail id={id} />;
}
