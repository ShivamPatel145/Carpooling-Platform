import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { booking, payment, ride, trip, walletEntry } from "@/db/schema";
import { logger } from "@/lib/logger";

/**
 * Shared Stripe client + ride-payment settlement (Slice C). ONE Stripe client instead of three
 * inline `new Stripe(...)`, and ONE idempotent finalizer used by BOTH the webhook and the
 * client-side confirm endpoint — so a card/UPI ride payment settles identically whether Stripe's
 * webhook reaches us (production) or the passenger's browser confirms it (localhost, where Stripe
 * can't call back into a dev server).
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type PaymentRow = typeof payment.$inferSelect;

/**
 * Pay the ride's driver and mark the trip paid. Money reaches the driver as a wallet credit — the
 * platform ledger is `walletEntry`, append-only, balance = latest row's `balanceAfter`. Then the
 * trip advances payment_pending → payment_completed so the "Pay now" affordance clears. Shared by
 * the wallet branch and the Stripe finalizer; NOT used for cash (cash settles hand-to-hand,
 * off-ledger).
 */
export async function creditDriverAndCompleteTrip(p: PaymentRow): Promise<void> {
  const amount = Number(p.amount);

  const [b] = await db.select().from(booking).where(eq(booking.id, p.bookingId)).limit(1);
  if (!b) {
    logger.error("creditDriverAndCompleteTrip: booking missing", { paymentId: p.id });
    return;
  }

  const [r] = await db.select().from(ride).where(eq(ride.id, b.rideId)).limit(1);
  if (r) {
    const [latestDriver] = await db
      .select({ balanceAfter: walletEntry.balanceAfter })
      .from(walletEntry)
      .where(eq(walletEntry.userId, r.driverId))
      .orderBy(desc(walletEntry.createdAt))
      .limit(1);
    const currentDriverBalance = latestDriver ? Number(latestDriver.balanceAfter) : 0;

    await db.insert(walletEntry).values({
      orgId: p.orgId,
      userId: r.driverId,
      delta: amount.toString(),
      reason: "ride_payment",
      refId: p.id,
      balanceAfter: (currentDriverBalance + amount).toString(),
    });
  }

  await db.update(trip).set({ status: "payment_completed" }).where(eq(trip.rideId, b.rideId));
}

/**
 * Idempotently settle a Stripe (card/UPI) ride payment. Atomically claims the pending → succeeded
 * (or pending → failed) transition, so repeated calls — a webhook retry, or the webhook AND a
 * client confirm racing — credit the driver exactly once. A no-op once the payment has left
 * `pending`.
 */
export async function finalizeStripeRidePayment(paymentId: string, succeeded: boolean): Promise<void> {
  const nextStatus: "succeeded" | "failed" = succeeded ? "succeeded" : "failed";

  // Claim the transition: only the caller that flips pending → terminal proceeds to pay the driver.
  const [claimed] = await db
    .update(payment)
    .set({ status: nextStatus })
    .where(and(eq(payment.id, paymentId), eq(payment.status, "pending")))
    .returning();
  if (!claimed) return; // already settled by a prior webhook/confirm — nothing more to do

  if (succeeded) await creditDriverAndCompleteTrip(claimed);
}
