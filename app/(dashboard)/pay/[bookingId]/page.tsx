import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { booking } from "@/db/schema";
import { coCard } from "@/components/co/ui";
import { PaymentForm } from "@/features/payment/components/payment-form";

export const metadata: Metadata = { title: "Complete Payment" };

export default async function PayPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await requireRolePage("employee");
  const { bookingId } = await params;

  // Owner- and org-scoped: an employee can only settle their OWN booking (cross-org/other → 404).
  const [b] = await db
    .select()
    .from(booking)
    .where(
      and(
        eq(booking.id, bookingId),
        eq(booking.passengerId, session.user.id),
        eq(booking.orgId, session.user.orgId!),
      ),
    )
    .limit(1);
  if (!b) notFound();

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Complete payment
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Settle your seat fare — wallet, card, UPI, or cash.
        </p>
      </div>
      <div className={`${coCard} p-6`}>
        <PaymentForm bookingId={b.id} fareAmount={Number(b.fareAmount)} />
      </div>
    </div>
  );
}
