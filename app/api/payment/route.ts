import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { booking, payment, trip, walletEntry } from "@/db/schema";
import { requirePermission, scopedWhere } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { AppError, NotFoundError } from "@/lib/errors";
import { logActivity } from "@/lib/activity";
import { paymentFormSchema } from "@/features/payment/schema";
import { stripe, creditDriverAndCompleteTrip } from "@/lib/payments";

/**
 * POST /api/payment — settle a completed trip's seat fare (Slice C). The passenger pays their OWN
 * booking; the driver is paid as a wallet credit (see lib/payments).
 *  - wallet: check balance → debit payer, credit driver, complete trip (on-ledger, synchronous).
 *  - card/upi: create a Stripe PaymentIntent, return clientSecret; the trip stays payment_pending
 *    until the payment is confirmed (POST /api/payment/[id]/confirm) or the webhook fires.
 *  - cash / qr: settled off-platform (cash in hand, or a direct UPI QR transfer to the driver) →
 *    mark paid + complete trip, no wallet movement.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("payment", "create");
  const values = paymentFormSchema.parse(await req.json());

  // Owner- + org-scoped: an employee can only settle their OWN booking (cross-org/other → 404).
  const [b] = await db
    .select()
    .from(booking)
    .where(
      scopedWhere(
        tenant,
        booking,
        and(eq(booking.id, values.bookingId), eq(booking.passengerId, session.user.id)),
      ),
    )
    .limit(1);
  if (!b) throw new NotFoundError("That booking doesn't exist.");

  const amount = Number(b.fareAmount);

  // ── Wallet ──────────────────────────────────────────────────────────────────────────────────
  if (values.method === "wallet") {
    const [latest] = await db
      .select({ balanceAfter: walletEntry.balanceAfter })
      .from(walletEntry)
      .where(eq(walletEntry.userId, session.user.id))
      .orderBy(desc(walletEntry.createdAt))
      .limit(1);
    const currentBalance = latest ? Number(latest.balanceAfter) : 0;
    if (currentBalance < amount) {
      throw new AppError("Insufficient wallet balance.", 409, "INSUFFICIENT_FUNDS");
    }

    const [p] = await db
      .insert(payment)
      .values({
        orgId: tenant.orgId!,
        bookingId: b.id,
        payerId: session.user.id,
        method: "wallet",
        amount: amount.toString(),
        status: "succeeded",
      })
      .returning();
    if (!p) throw new AppError("Failed to record payment.", 500, "PAYMENT_WRITE_FAILED");

    // Debit the payer...
    await db.insert(walletEntry).values({
      orgId: tenant.orgId!,
      userId: session.user.id,
      delta: (-amount).toString(),
      reason: "ride_payment",
      refId: p.id,
      balanceAfter: (currentBalance - amount).toString(),
    });
    // ...credit the driver + complete the trip.
    await creditDriverAndCompleteTrip(p);

    await logActivity({
      orgId: tenant.orgId,
      actorId: session.user.id,
      action: "create",
      resource: "payment",
      resourceId: p.id,
      metadata: { method: "wallet", amount },
      req,
    });
    return ok({ payment: p });
  }

  // ── Card / UPI (Stripe) ─────────────────────────────────────────────────────────────────────
  if (values.method === "card" || values.method === "upi") {
    const [p] = await db
      .insert(payment)
      .values({
        orgId: tenant.orgId!,
        bookingId: b.id,
        payerId: session.user.id,
        method: values.method,
        amount: amount.toString(),
        status: "pending",
      })
      .returning();
    if (!p) throw new AppError("Failed to record payment.", 500, "PAYMENT_WRITE_FAILED");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr",
      metadata: {
        action: "ride_payment",
        userId: session.user.id,
        orgId: tenant.orgId,
        paymentId: p.id,
      },
      payment_method_types: values.method === "upi" ? ["upi"] : ["card"],
    });

    await db.update(payment).set({ stripePaymentIntentId: paymentIntent.id }).where(eq(payment.id, p.id));

    await logActivity({
      orgId: tenant.orgId,
      actorId: session.user.id,
      action: "create",
      resource: "payment",
      resourceId: p.id,
      metadata: { method: values.method, amount, status: "pending" },
      req,
    });
    return ok({ payment: p, clientSecret: paymentIntent.client_secret });
  }

  // ── Cash / QR (direct UPI) ───────────────────────────────────────────────────────────────────
  // Both settle off-platform, hand-to-hand: cash physically, QR as a direct UPI transfer to the
  // driver's own VPA. The passenger confirms it happened; we record the payment and mark the trip
  // paid. No wallet movement — the money never touches the platform ledger (unlike wallet/Stripe).
  if (values.method === "cash" || values.method === "qr") {
    const [p] = await db
      .insert(payment)
      .values({
        orgId: tenant.orgId!,
        bookingId: b.id,
        payerId: session.user.id,
        method: values.method,
        amount: amount.toString(),
        status: "succeeded",
      })
      .returning();
    if (!p) throw new AppError("Failed to record payment.", 500, "PAYMENT_WRITE_FAILED");

    await db.update(trip).set({ status: "payment_completed" }).where(eq(trip.rideId, b.rideId));

    await logActivity({
      orgId: tenant.orgId,
      actorId: session.user.id,
      action: "create",
      resource: "payment",
      resourceId: p.id,
      metadata: { method: values.method, amount },
      req,
    });
    return ok({ payment: p });
  }

  throw new AppError("Invalid payment method.", 400, "INVALID_METHOD");
});
