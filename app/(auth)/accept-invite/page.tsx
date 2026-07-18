import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AcceptInviteForm } from "./accept-invite-form";
import { FormSkeleton } from "@/components/states/loading-state";

export const metadata: Metadata = { title: "Accept Invitation" };

/**
 * /accept-invite?token=… — Onboarding Paths 1 & 2 landing page.
 * Server-validates the token and pre-fills the invite context (email, role, org).
 * Client form calls POST /api/invitation/accept to finalise account creation.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) notFound();

  const inv = await db.query.invitation.findFirst({
    where: eq(invitation.token, token),
    with: { organization: true },
  });

  if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">Invitation Invalid or Expired</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This invitation link has already been used, has expired, or doesn&apos;t exist. Please
          ask for a new invitation.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<FormSkeleton fields={4} />}>
      <AcceptInviteForm
        token={token}
        email={inv.email}
        role={inv.role}
        orgName={(inv as typeof inv & { organization?: { name: string } }).organization?.name ?? "your organization"}
      />
    </Suspense>
  );
}
