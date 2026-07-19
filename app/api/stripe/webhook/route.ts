import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { walletEntry } from "@/db/schema";
import { stripe, finalizeStripeRidePayment } from "@/lib/payments";

/**
 * Stripe webhook — the production backstop for card/UPI settlement (payment_intent.succeeded /
 * .payment_failed) and wallet recharges. On localhost, Stripe can't call into a dev server, so ride
 * payments are settled by the browser-side confirm endpoint instead; both paths funnel through the
 * same idempotent finalizer, so it doesn't matter which one wins.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!webhookSecret) {
      // Dev without a webhook secret: skip signature validation.
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
    if (!metadata?.action) return NextResponse.json({ received: true });

    if (metadata.action === "wallet_recharge") {
      const { userId, orgId } = metadata;
      if (event.type === "payment_intent.succeeded" && userId && orgId) {
        const amount = Number(metadata.amount ?? 0);

        const [latest] = await db
          .select({ balanceAfter: walletEntry.balanceAfter })
          .from(walletEntry)
          .where(eq(walletEntry.userId, userId))
          .orderBy(desc(walletEntry.createdAt))
          .limit(1);
        const currentBalance = latest ? Number(latest.balanceAfter) : 0;

        await db.insert(walletEntry).values({
          orgId,
          userId,
          delta: amount.toString(),
          reason: "recharge",
          balanceAfter: (currentBalance + amount).toString(),
        });
      }
    } else if (metadata.action === "ride_payment" && metadata.paymentId) {
      // Credit the driver + complete the trip (idempotent — safe if the confirm endpoint got here first).
      await finalizeStripeRidePayment(metadata.paymentId, event.type === "payment_intent.succeeded");
    }
  }

  return NextResponse.json({ received: true });
}
