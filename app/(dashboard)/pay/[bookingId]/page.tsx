import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireRolePage } from "@/lib/session";
import { db } from "@/db";
import { booking, ride, user } from "@/db/schema";
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

  // Who gets paid — the ride's driver. Used to build the UPI QR payee (name + VPA). Org-scoped.
  const [r] = await db
    .select({ driverId: ride.driverId })
    .from(ride)
    .where(and(eq(ride.id, b.rideId), eq(ride.orgId, session.user.orgId!)))
    .limit(1);
  const [driver] = r
    ? await db
        .select({ name: user.name, phone: user.phone })
        .from(user)
        .where(eq(user.id, r.driverId))
        .limit(1)
    : [];
  // A driver's phone is their UPI handle in most Indian apps; fall back to a stable per-driver id.
  const digits = (driver?.phone ?? "").replace(/\D/g, "");
  const payeeVpa = digits ? `${digits}@upi` : `${(r?.driverId ?? "driver").slice(0, 8)}@upi`;

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="mb-6">
        <h2 className="m-0 font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
          Complete payment
        </h2>
        <p className="m-0 mt-1 text-[15px] text-[color:var(--ink-2)]">
          Settle your seat fare — scan a QR, pay cash, or use your wallet, card, or UPI.
        </p>
      </div>
      <div className={`${coCard} p-6`}>
        <PaymentForm
          bookingId={b.id}
          fareAmount={Number(b.fareAmount)}
          driverName={driver?.name ?? null}
          payeeVpa={payeeVpa}
        />
      </div>
    </div>
  );
}
