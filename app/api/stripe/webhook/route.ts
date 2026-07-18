import { NextResponse } from "next";
import Stripe from "stripe";
import { db } from "@/db";
import { payment, walletEntry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logActivity } from "@/lib/activity"; // Note: might not have session in webhook, so can't easily log unless we fake req/tenant

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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

    if (!metadata || !metadata.action) {
      return NextResponse.json({ received: true });
    }

    if (metadata.action === "wallet_recharge") {
      if (event.type === "payment_intent.succeeded") {
        const amount = Number(metadata.amount);
        
        // Find latest balance
        const [latest] = await db.select({ balanceAfter: walletEntry.balanceAfter })
          .from(walletEntry)
          .where(eq(walletEntry.userId, metadata.userId))
          .orderBy(desc(walletEntry.createdAt))
          .limit(1);

        const currentBalance = latest ? Number(latest.balanceAfter) : 0;
        const newBalance = currentBalance + amount;

        await db.insert(walletEntry).values({
          orgId: metadata.orgId,
          userId: metadata.userId,
          delta: amount.toString(),
          reason: "recharge",
          refId: paymentIntent.id,
          balanceAfter: newBalance.toString(),
        });
      }
    } else if (metadata.action === "ride_payment") {
      const status = event.type === "payment_intent.succeeded" ? "succeeded" : "failed";
      await db.update(payment)
        .set({ status })
        .where(eq(payment.stripePaymentIntentId, paymentIntent.id));
    }
  }

  return NextResponse.json({ received: true });
}

