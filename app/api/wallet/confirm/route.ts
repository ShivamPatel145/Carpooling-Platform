import Stripe from "stripe";
import { requirePermission } from "@/lib/permissions";
import { withErrorHandler, ok } from "@/lib/api";
import { db } from "@/db";
import { walletEntry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const schema = z.object({
  paymentIntentId: z.string(),
});

/**
 * POST /api/wallet/confirm
 * Called client-side after stripe.confirmPayment() succeeds.
 * Retrieves the PaymentIntent from Stripe (source of truth), then credits the wallet if not already done.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { session, tenant } = await requirePermission("wallet", "recharge");
  const { paymentIntentId } = schema.parse(await req.json());

  // Fetch from Stripe — never trust the client amount
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== "succeeded") {
    return ok({ credited: false, reason: "payment_not_succeeded" });
  }

  const metadata = pi.metadata;
  if (metadata?.action !== "wallet_recharge" || metadata?.userId !== session.user.id) {
    return ok({ credited: false, reason: "metadata_mismatch" });
  }

  // Idempotency: check if already credited by webhook or previous confirm call
  const existing = await db
    .select({ id: walletEntry.id, balanceAfter: walletEntry.balanceAfter })
    .from(walletEntry)
    .where(eq(walletEntry.reason, `recharge:${pi.id}`))
    .limit(1);

  if (existing.length > 0) {
    // Already done — just return current balance
    const [latest] = await db
      .select({ balanceAfter: walletEntry.balanceAfter })
      .from(walletEntry)
      .where(eq(walletEntry.userId, session.user.id))
      .orderBy(desc(walletEntry.createdAt))
      .limit(1);
    return ok({ credited: true, balance: latest?.balanceAfter ?? "0" });
  }

  // Webhook hasn't fired yet (or was missed) — credit now
  const amount = Number(metadata.amount ?? 0);

  const [latest] = await db
    .select({ balanceAfter: walletEntry.balanceAfter })
    .from(walletEntry)
    .where(eq(walletEntry.userId, session.user.id))
    .orderBy(desc(walletEntry.createdAt))
    .limit(1);

  const currentBalance = latest ? Number(latest.balanceAfter) : 0;
  const newBalance = currentBalance + amount;

  await db.insert(walletEntry).values({
    orgId: tenant.orgId!,
    userId: session.user.id,
    delta: amount.toString(),
    reason: `recharge:${pi.id}`,
    balanceAfter: newBalance.toString(),
  });

  return ok({ credited: true, balance: newBalance.toString() });
});
