import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

/** Minimal profile view — reads the current session. Editing is a build-day nicety. */
export default async function ProfilePage() {
  const { user } = await requireSession();
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Name", value: user.name ?? "—" },
    { label: "Email", value: user.email ?? "—" },
    { label: "Role", value: <Badge variant="outline">{humanize(user.role)}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
