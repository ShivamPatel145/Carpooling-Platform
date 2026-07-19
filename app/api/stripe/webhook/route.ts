import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { payment, walletEntry, booking, ride } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Stripe webhook handler.
 * Handles payment_intent.succeeded and payment_intent.payment_failed.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // In dev mode without webhook secret, just bypass signature validation
      event = JSON.parse(payload) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    console.log("[webhook] event:", event.type, "| metadata:", JSON.stringify(metadata));

    if (!metadata || !metadata.action) {
      console.log("[webhook] No action in metadata, skipping.");
      return NextResponse.json({ received: true });
    }

    if (metadata.action === "wallet_recharge") {
      const { userId, orgId } = metadata;
      if (event.type === "payment_intent.succeeded" && userId && orgId) {
        const amount = Number(metadata.amount ?? 0);

        console.log(`[webhook] wallet_recharge for user ${userId}, amount ${amount}`);

        // Check if already processed (idempotency) — reason stores the Stripe PI id
        const existing = await db.select({ id: walletEntry.id })
          .from(walletEntry)
          .where(eq(walletEntry.reason, `recharge:${paymentIntent.id}`))
          .limit(1);

        if (existing.length > 0) {
          console.log("[webhook] Already processed, skipping.");
          return NextResponse.json({ received: true });
        }

        // Find latest balance
        const [latest] = await db.select({ balanceAfter: walletEntry.balanceAfter })
          .from(walletEntry)
          .where(eq(walletEntry.userId, userId))
          .orderBy(desc(walletEntry.createdAt))
          .limit(1);

        const currentBalance = latest ? Number(latest.balanceAfter) : 0;
        const newBalance = currentBalance + amount;

        await db.insert(walletEntry).values({
          orgId,
          userId,
          delta: amount.toString(),
          reason: `recharge:${paymentIntent.id}`,
          balanceAfter: newBalance.toString(),
        });

        console.log(`[webhook] Wallet updated: ${currentBalance} -> ${newBalance}`);
      }
    } else if (metadata.action === "ride_payment") {
      const status = event.type === "payment_intent.succeeded" ? "succeeded" : "failed";
      await db.update(payment)
        .set({ status })
        .where(eq(payment.stripePaymentIntentId, paymentIntent.id));

      if (status === "succeeded" && metadata.paymentId) {
        // Find the payment, booking, and ride to get the driverId
        const [p] = await db.select().from(payment).where(eq(payment.id, metadata.paymentId));
        if (p) {
          const [b] = await db.select().from(booking).where(eq(booking.id, p.bookingId));
          if (b) {
            const [r] = await db.select().from(ride).where(eq(ride.id, b.rideId));
            if (r) {
              const amount = Number(p.amount);
              
              // Find latest balance for the driver
              const [latestDriver] = await db.select({ balanceAfter: walletEntry.balanceAfter })
                .from(walletEntry)
                .where(eq(walletEntry.userId, r.driverId))
                .orderBy(desc(walletEntry.createdAt))
                .limit(1);

              const currentDriverBalance = latestDriver ? Number(latestDriver.balanceAfter) : 0;
              const newDriverBalance = currentDriverBalance + amount;

              // Credit the driver's wallet
              await db.insert(walletEntry).values({
                orgId: p.orgId,
                userId: r.driverId,
                delta: amount.toString(),
                reason: "ride_payment",
                refId: p.id,
                balanceAfter: newDriverBalance.toString(),
              });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
