import type { Metadata } from "next";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { Boxes, Bell, LifeBuoy, CheckCircle2, Users } from "lucide-react";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { demoEntity, notification, supportTicket, user } from "@/db/schema";
import { atLeast } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Dashboard" };

/** Server component — computes REAL counts (design-standards §1: no fabricated stats). */
export default async function DashboardPage() {
  const session = await requireSession();
  const { id: userId, role, name } = session.user;

  // Real, scoped counts. Parallelized.
  const [myItems, unread, myOpenTickets, pendingApprovals, totalUsers] = await Promise.all([
    db.select({ n: count() }).from(demoEntity).where(eq(demoEntity.ownerId, userId)),
    db
      .select({ n: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, false))),
    db
      .select({ n: count() })
      .from(supportTicket)
      .where(and(eq(supportTicket.requesterId, userId), eq(supportTicket.status, "open"))),
    atLeast(role, "company_admin")
      ? db.select({ n: count() }).from(demoEntity).where(eq(demoEntity.status, "draft"))
      : Promise.resolve([{ n: 0 }]),
    atLeast(role, "company_admin")
      ? db.select({ n: count() }).from(user)
      : Promise.resolve([{ n: 0 }]),
  ]);

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across your workspace."
      />

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevealItem>
          <StatCard label="My items" value={myItems[0]?.n ?? 0} icon={Boxes} hint="Records you own" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Unread" value={unread[0]?.n ?? 0} icon={Bell} hint="Notifications" />
        </RevealItem>
        <RevealItem>
          <StatCard label="Open tickets" value={myOpenTickets[0]?.n ?? 0} icon={LifeBuoy} hint="Raised by you" />
        </RevealItem>
        {atLeast(role, "company_admin") && (
          <RevealItem>
            <StatCard
              label="Pending approvals"
              value={pendingApprovals[0]?.n ?? 0}
              icon={CheckCircle2}
              hint="Awaiting review"
            />
          </RevealItem>
        )}
        {atLeast(role, "company_admin") && (
          <RevealItem>
            <StatCard label="Total users" value={totalUsers[0]?.n ?? 0} icon={Users} hint="On the platform" />
          </RevealItem>
        )}
      </Reveal>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This workspace is scaffolded and ready. The demo entity in{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">features/_demo</code>{" "}
              is the working CRUD template every feature copies.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/demo">Open demo entities</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/support">Raise a ticket</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your role</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              You're signed in as{" "}
              <span className="font-medium text-foreground">{role}</span>. The sidebar shows only
              what your role can access — authorization is enforced again on every API route, not
              just hidden in the nav.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
