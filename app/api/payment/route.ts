import Stripe from "stripe";
import { db } from "@/db";
import { payment, walletEntry, booking, trip } from "@/db/schema";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { paymentFormSchema } from "@/features/payment/schema";
import { eq, desc } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/payment
 * Processes a trip payment.
 * If Wallet: checks balance, subtracts, marks payment success, sets trip status to payment_completed.
 * If Card/UPI: initiates Stripe PaymentIntent, returns clientSecret, trip status stays payment_pending until webhook.
 * If Cash: marks payment success, sets trip status to payment_completed.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("payment", "create");
  const values = paymentFormSchema.parse(await req.json());

  // We should verify the booking belongs to the org
  const [b] = await db.select().from(booking).where(eq(booking.id, values.bookingId)).limit(1);
  if (!b) throw new Error("Booking not found");
  if (b.orgId !== tenant.orgId) throw new Error("Unauthorized");

  const amount = Number(b.fareAmount);

  // If Wallet, verify balance
  if (values.method === "wallet") {
    const [latest] = await db.select({ balanceAfter: walletEntry.balanceAfter })
      .from(walletEntry)
      .where(eq(walletEntry.userId, session.user.id))
      .orderBy(desc(walletEntry.createdAt))
      .limit(1);

    const currentBalance = latest ? Number(latest.balanceAfter) : 0;
    if (currentBalance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Insert payment row
    const [p] = await db.insert(payment).values({
      orgId: tenant.orgId!,
      bookingId: b.id,
      payerId: session.user.id,
      method: "wallet",
      amount: amount.toString(),
      status: "succeeded",
    }).returning();
    if (!p) throw new Error("Failed to record payment");

    // Deduct from wallet
    await db.insert(walletEntry).values({
      orgId: tenant.orgId!,
      userId: session.user.id,
      delta: (-amount).toString(),
      reason: "ride_payment",
      refId: p.id,
      balanceAfter: (currentBalance - amount).toString(),
    });

    // Update trip status
    await db.update(trip).set({ status: "payment_completed" }).where(eq(trip.rideId, b.rideId));

    return ok({ payment: p });
  }

  // If Card/UPI
  if (values.method === "card" || values.method === "upi") {
    // Insert pending payment
    const [p] = await db.insert(payment).values({
      orgId: tenant.orgId!,
      bookingId: b.id,
      payerId: session.user.id,
      method: values.method,
      amount: amount.toString(),
      status: "pending",
    }).returning();
    if (!p) throw new Error("Failed to record payment");

    // Init Stripe
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

    // Save intent ID
    await db.update(payment).set({ stripePaymentIntentId: paymentIntent.id }).where(eq(payment.id, p.id));

    return ok({ payment: p, clientSecret: paymentIntent.client_secret });
  }

  // If Cash
  if (values.method === "cash") {
    const [p] = await db.insert(payment).values({
      orgId: tenant.orgId!,
      bookingId: b.id,
      payerId: session.user.id,
      method: "cash",
      amount: amount.toString(),
      status: "succeeded",
    }).returning();
    if (!p) throw new Error("Failed to record payment");

    await db.update(trip).set({ status: "payment_completed" }).where(eq(trip.rideId, b.rideId));
    return ok({ payment: p });
  }

  throw new Error("Invalid payment method");
});
